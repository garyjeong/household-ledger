import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader, verifyAccountOwnership } from '@/lib/auth'
import {
  accountQuerySchema,
  createAccountSchema,
  formatAccountForResponse,
  type AccountResponse,
} from '@/lib/schemas/account'

/**
 * GET /api/accounts
 * 사용자/그룹별 계좌 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 쿼리 파라미터 검증
    const { searchParams } = new URL(request.url)
    const queryResult = accountQuerySchema.safeParse({
      ownerType: searchParams.get('ownerType'),
      ownerId: searchParams.get('ownerId'),
      type: searchParams.get('type'),
      isActive: searchParams.get('isActive'),
      currency: searchParams.get('currency'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: '잘못된 쿼리 파라미터입니다',
          code: 'INVALID_QUERY',
          details: queryResult.error.errors,
        },
        { status: 400 }
      )
    }

    const query = queryResult.data

    // 기본값 설정: ownerType과 ownerId가 없으면 현재 사용자 개인 계좌 조회
    const ownerType = query.ownerType || 'USER'
    const ownerId = query.ownerId || parseInt(user.userId, 10)

    // 소유권 검증
    const ownershipResult = await verifyAccountOwnership(user.userId, ownerType, ownerId.toString())

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        { error: ownershipResult.error || '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // Prisma 쿼리 조건 구성
    const whereCondition: any = {
      ownerType,
      ownerId: BigInt(ownerId),
    }

    if (query.type) {
      whereCondition.type = query.type
    }

    if (query.isActive !== undefined) {
      whereCondition.isActive = query.isActive
    }

    if (query.currency) {
      whereCondition.currency = query.currency
    }

    // 계좌 목록 조회
    const accounts = await prisma.account.findMany({
      where: whereCondition,
      orderBy: [
        { isActive: 'desc' }, // 활성 계좌 먼저
        { name: 'asc' }, // 이름 순
      ],
    })

    // 응답 형태로 변환
    const accountResponses: AccountResponse[] = accounts.map(formatAccountForResponse)

    return NextResponse.json({
      accounts: accountResponses,
      count: accounts.length,
    })
  } catch (error) {
    console.error('계좌 목록 조회 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/accounts
 * 새 계좌 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = createAccountSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const accountData = validationResult.data

    // 소유권 검증
    const ownershipResult = await verifyAccountOwnership(
      user.userId,
      accountData.ownerType,
      accountData.ownerId.toString()
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        { error: ownershipResult.error || '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 중복 이름 검사 (같은 소유자 내에서)
    const existingAccount = await prisma.account.findFirst({
      where: {
        ownerType: accountData.ownerType,
        ownerId: BigInt(accountData.ownerId),
        name: accountData.name,
      },
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: '이미 존재하는 계좌명입니다', code: 'DUPLICATE_NAME' },
        { status: 409 }
      )
    }

    // 계좌 생성
    const newAccount = await prisma.account.create({
      data: {
        ownerType: accountData.ownerType,
        ownerId: BigInt(accountData.ownerId),
        name: accountData.name,
        type: accountData.type,
        currency: accountData.currency || 'KRW',
        balance: BigInt(accountData.balance || 0),
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        message: '계좌가 성공적으로 생성되었습니다',
        account: formatAccountForResponse(newAccount),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('계좌 생성 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
