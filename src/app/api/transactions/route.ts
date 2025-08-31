import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader, verifyAccountOwnership } from '@/lib/auth'
import {
  createTransactionSchema,
  transactionQuerySchema,
  formatTransactionForResponse,
} from '@/lib/schemas/transaction'

/**
 * GET /api/transactions
 * 거래 목록 조회 (검색, 필터링, 페이지네이션)
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

    const validationResult = transactionQuerySchema.safeParse(queryParams)
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

    const { type, startDate, endDate, categoryId, search, page, limit } = validationResult.data

    // 기본 where 조건 (사용자 소유 거래만)
    const whereCondition: any = {
      ownerUserId: BigInt(user.userId),
    }

    // 필터 조건 추가
    if (type) {
      whereCondition.type = type
    }

    if (startDate && endDate) {
      whereCondition.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      whereCondition.date = { gte: new Date(startDate) }
    } else if (endDate) {
      whereCondition.date = { lte: new Date(endDate) }
    }

    if (categoryId) {
      whereCondition.categoryId = BigInt(categoryId)
    }

    if (search) {
      whereCondition.OR = [{ memo: { contains: search } }, { merchant: { contains: search } }]
    }

    // 총 개수 조회
    const totalCount = await prisma.transaction.count({
      where: whereCondition,
    })

    // 거래 목록 조회
    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      include: {
        category: {
          select: { id: true, name: true, color: true, type: true },
        },
        tag: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    })

    // 응답 형태로 변환
    const formattedTransactions = transactions.map(formatTransactionForResponse)

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    })
  } catch (error: unknown) {
    console.error('Transaction list error:', error)
    return NextResponse.json(
      { error: '거래 목록 조회 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * 새 거래 생성
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

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = createTransactionSchema.safeParse({
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const transactionData = validationResult.data

    // 카테고리 소유권 검증 (선택사항)
    if (transactionData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: BigInt(transactionData.categoryId) },
      })

      if (!category) {
        return NextResponse.json(
          { error: '카테고리를 찾을 수 없습니다', code: 'CATEGORY_NOT_FOUND' },
          { status: 404 }
        )
      }

      // 카테고리 타입과 거래 타입 일치 확인
      if (category.type !== transactionData.type) {
        return NextResponse.json(
          { error: '카테고리 타입과 거래 타입이 일치하지 않습니다', code: 'TYPE_MISMATCH' },
          { status: 400 }
        )
      }
    }

    // 거래 생성 (단순화)
    // EXPENSE는 음수, INCOME은 양수로 저장
    const signedAmount =
      transactionData.type === 'EXPENSE'
        ? -BigInt(Math.abs(transactionData.amount))
        : BigInt(Math.abs(transactionData.amount))

    const newTransaction = await prisma.transaction.create({
      data: {
        type: transactionData.type,
        date: transactionData.date,
        amount: signedAmount,
        categoryId: transactionData.categoryId ? BigInt(transactionData.categoryId) : null,
        tagId: transactionData.tagId ? BigInt(transactionData.tagId) : null,
        merchant: transactionData.merchant || null,
        memo: transactionData.memo || null,
        ownerUserId: BigInt(user.userId),
        groupId: transactionData.groupId ? BigInt(transactionData.groupId) : null,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, type: true },
        },
        tag: {
          select: { id: true, name: true },
        },
      },
    })

    // 응답 형태로 변환
    const formattedTransaction = formatTransactionForResponse(newTransaction)

    return NextResponse.json(
      {
        success: true,
        transaction: formattedTransaction,
        message: '거래가 성공적으로 추가되었습니다',
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Transaction creation error:', error)
    return NextResponse.json(
      { error: '거래 생성 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
