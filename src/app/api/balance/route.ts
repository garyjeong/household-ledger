import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, verifyResourceOwnership } from '@/lib/auth'
import {
  balanceQuerySchema,
  formatBalanceResponse,
  type BalanceResponse,
} from '@/lib/schemas/balance'

/**
 * GET /api/balance
 * 잔액 조회 (계좌별, 전체, 고정 지출 예상 포함)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (쿠키 기반)
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 쿼리 파라미터 파싱
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)

    const validationResult = balanceQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '잘못된 쿼리 파라미터입니다',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { ownerType, ownerId, accountId, includeProjection, projectionMonths } =
      validationResult.data

    // 기본값 설정 (파라미터가 없으면 현재 사용자의 개인 계좌)
    const finalOwnerType = ownerType || 'USER'
    const finalOwnerId = ownerId || user.userId

    // 소유권 확인
    const ownershipResult = await verifyResourceOwnership(user.userId, finalOwnerType, finalOwnerId)
    if (!ownershipResult.isValid) {
      return NextResponse.json(
        {
          error: ownershipResult.error || '접근 권한이 없습니다',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      )
    }

    // 계좌 조회 조건 설정
    const accountWhereCondition: any = {
      ownerType: finalOwnerType,
      ownerId: BigInt(finalOwnerId),
    }

    // 특정 계좌 조회인 경우
    if (accountId) {
      accountWhereCondition.id = BigInt(accountId)
    }

    // 계좌 정보 조회
    const accounts = await prisma.account.findMany({
      where: accountWhereCondition,
      orderBy: [
        { isActive: 'desc' }, // 활성 계좌 우선
        { createdAt: 'asc' },
      ],
    })

    if (accounts.length === 0) {
      return NextResponse.json({
        totalBalance: 0,
        accountBalances: [],
        currency: 'KRW',
        lastUpdated: new Date().toISOString(),
      } as BalanceResponse)
    }

    // 고정 지출 정보 조회 (예상 잔액 계산 시)
    let recurringExpenses: any[] = []
    if (includeProjection) {
      recurringExpenses = await prisma.recurringRule.findMany({
        where: {
          ownerType: finalOwnerType,
          ownerId: BigInt(finalOwnerId),
          isActive: true,
        },
        orderBy: { startDate: 'desc' },
      })
    }

    // 응답 데이터 포맷팅
    const balanceResponse = formatBalanceResponse({
      accounts,
      recurringExpenses,
      includeProjection,
      projectionMonths,
    })

    return NextResponse.json(balanceResponse)
  } catch (error: unknown) {
    console.error('Balance fetch error:', error)
    return NextResponse.json(
      { error: '잔액을 조회하는 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/balance/recalculate
 * 잔액 재계산 (수동 트리거)
 * 데이터 불일치 발생 시 사용
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (쿠키 기반)
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { ownerType = 'USER', ownerId = user.userId, accountId } = body

    // 소유권 확인
    const ownershipResult = await verifyResourceOwnership(user.userId, ownerType, ownerId)
    if (!ownershipResult.isValid) {
      return NextResponse.json(
        {
          error: ownershipResult.error || '접근 권한이 없습니다',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      )
    }

    // 계좌 조회 조건 설정
    const accountWhereCondition: any = {
      ownerType,
      ownerId: BigInt(ownerId),
    }

    if (accountId) {
      accountWhereCondition.id = BigInt(accountId)
    }

    // 대상 계좌들 조회
    const accounts = await prisma.account.findMany({
      where: accountWhereCondition,
    })

    // 각 계좌별로 잔액 재계산
    const recalculationResults = await Promise.all(
      accounts.map(async account => {
        // 해당 계좌의 모든 거래 조회
        const transactions = await prisma.transaction.findMany({
          where: { accountId: account.id },
          orderBy: { createdAt: 'asc' },
        })

        // 잔액 재계산
        let calculatedBalance = BigInt(0)
        for (const transaction of transactions) {
          if (transaction.type === 'INCOME') {
            calculatedBalance += transaction.amount
          } else if (transaction.type === 'EXPENSE') {
            calculatedBalance -= transaction.amount
          }
        }

        // 현재 저장된 잔액과 비교
        const currentBalance = account.balance
        const balanceDifference = calculatedBalance - currentBalance

        // 잔액이 다르면 업데이트
        if (balanceDifference !== BigInt(0)) {
          await prisma.account.update({
            where: { id: account.id },
            data: { balance: calculatedBalance },
          })
        }

        return {
          accountId: account.id.toString(),
          accountName: account.name,
          previousBalance: Number(currentBalance),
          calculatedBalance: Number(calculatedBalance),
          difference: Number(balanceDifference),
          wasUpdated: balanceDifference !== BigInt(0),
        }
      })
    )

    const updatedCount = recalculationResults.filter(result => result.wasUpdated).length

    return NextResponse.json({
      success: true,
      message: `${accounts.length}개 계좌 중 ${updatedCount}개 계좌의 잔액이 수정되었습니다`,
      results: recalculationResults,
    })
  } catch (error: unknown) {
    console.error('Balance recalculation error:', error)
    return NextResponse.json(
      { error: '잔액 재계산 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
