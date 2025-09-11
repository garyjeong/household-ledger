import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCookieToken } from '@/lib/auth'
import {
  createTransactionSchema,
  transactionQuerySchema,
  formatTransactionForResponse,
} from '@/lib/schemas/transaction'
import { safeConsole } from '@/lib/security-utils'
import {
  PrismaCursorPagination,
  PaginationMigrationHelper,
  type CursorPaginationParams,
} from '@/lib/cursor-pagination'

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

    const user = await verifyCookieToken(accessToken)
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

    // 🔄 페이지네이션 파라미터 처리 (레거시 + 커서 둘 다 지원)
    const cursor = url.searchParams.get('cursor')
    const direction = (url.searchParams.get('direction') as 'forward' | 'backward') || 'forward'

    // 필터 조건 구성
    const filters: any = {}

    if (type) filters.type = type
    if (startDate && endDate) {
      filters.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      filters.date = { gte: new Date(startDate) }
    } else if (endDate) {
      filters.date = { lte: new Date(endDate) }
    }
    if (categoryId) filters.categoryId = BigInt(categoryId)
    if (search) {
      filters.OR = [{ memo: { contains: search } }, { merchant: { contains: search } }]
    }

    // 🚀 커서 페이지네이션 사용 (성능 최적화)
    if (cursor || !page) {
      // 새로운 커서 페이지네이션 사용
      const paginationParams: CursorPaginationParams = {
        cursor: cursor || undefined,
        limit: limit || 20,
        direction,
      }

      const result = await PrismaCursorPagination.getTransactions(prisma, {
        ...paginationParams,
        userId: user.userId,
        filters,
      })

      // 응답 형태로 변환
      const formattedTransactions = result.data.map(formatTransactionForResponse)

      return NextResponse.json({
        transactions: formattedTransactions,
        pagination: {
          hasMore: result.pagination.hasNext,
          nextCursor: result.pagination.nextCursor,
          prevCursor: result.pagination.prevCursor,
          totalCount: result.pagination.totalEstimate,
          // 개발 환경에서만 성능 정보 포함
          ...(process.env.NODE_ENV === 'development' && {
            performance: result.performance,
            meta: {
              optimized: true,
              paginationType: 'cursor',
              queryTime: `${result.performance.queryTime}ms`,
              recommendation: cursor ? undefined : 'cursor 파라미터 사용을 권장합니다',
            },
          }),
        },
      })
    } else {
      // 📊 레거시 오프셋 페이지네이션 (하위 호환성)
      safeConsole.warn('레거시 페이지네이션 사용', {
        userId: user.userId,
        page,
        recommendation: 'cursor 기반 페이지네이션 사용을 권장합니다',
      })

      const legacyParams = PaginationMigrationHelper.convertLegacyParams({ page, limit })

      const result = await PrismaCursorPagination.getTransactions(prisma, {
        ...legacyParams,
        userId: user.userId,
        filters,
      })

      // 레거시 형식으로 변환
      const legacyResult = PaginationMigrationHelper.toLegacyFormat(result, page)
      const formattedTransactions = result.data.map(formatTransactionForResponse)

      return NextResponse.json({
        transactions: formattedTransactions,
        pagination: {
          ...legacyResult.pagination,
          // 개발 환경에서만 성능 정보 포함
          ...(process.env.NODE_ENV === 'development' && {
            meta: {
              optimized: false,
              paginationType: 'offset',
              queryTime: `${result.performance.queryTime}ms`,
              warning: '레거시 페이지네이션은 성능상 권장하지 않습니다',
              recommendation: {
                message: 'cursor 기반 페이지네이션으로 마이그레이션을 권장합니다',
                example: '?cursor=xxxxx&limit=20',
                benefits: ['일정한 성능', '실시간 데이터 변경에 안정적', '깊은 페이지에서도 빠름'],
              },
            },
          }),
        },
      })
    }
  } catch (error: unknown) {
    safeConsole.error('거래 목록 조회 실패', error, {
      endpoint: '/api/transactions',
      method: 'GET',
    })
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

    const user = await verifyCookieToken(accessToken)
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

    // 거래 생성 (트랜잭션 처리)
    // amount는 항상 양수로 저장, type에 따라 계산 시 부호 결정
    const amount = BigInt(Math.abs(transactionData.amount))

    // 트랜잭션으로 데이터 무결성 보장
    const newTransaction = await prisma.$transaction(async tx => {
      // 1. 카테고리 존재 및 권한 확인
      if (transactionData.categoryId) {
        const category = await tx.category.findFirst({
          where: {
            id: BigInt(transactionData.categoryId),
            OR: [
              { createdBy: BigInt(user.userId), groupId: null },
              {
                groupId: transactionData.groupId ? BigInt(transactionData.groupId) : undefined,
              },
            ],
          },
        })

        if (!category) {
          throw new Error('카테고리를 찾을 수 없거나 권한이 없습니다')
        }
      }

      // 2. 그룹 존재 및 멤버십 확인
      if (transactionData.groupId) {
        const userInGroup = await tx.user.findFirst({
          where: {
            id: BigInt(user.userId),
            groupId: BigInt(transactionData.groupId),
          },
        })

        if (!userInGroup) {
          throw new Error('그룹에 대한 권한이 없습니다')
        }
      }

      // 3. 거래 생성
      const transaction = await tx.transaction.create({
        data: {
          type: transactionData.type,
          date: transactionData.date,
          amount: amount,
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

      // 4. 로깅 (성공) - 비활성화
      // safeConsole.log('거래 생성 성공', {
      //   transactionId: transaction.id.toString(),
      //   type: transaction.type,
      //   amount: transaction.amount.toString(),
      //   userId: user.userId,
      //   groupId: transactionData.groupId,
      // })

      return transaction
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
    safeConsole.error('거래 생성 실패', error, {
      endpoint: '/api/transactions',
      method: 'POST',
    })

    // 비즈니스 로직 에러와 시스템 에러 구분
    if (error instanceof Error) {
      const errorMessage = error.message

      // 권한 관련 에러
      if (errorMessage.includes('권한이 없습니다') || errorMessage.includes('찾을 수 없습니다')) {
        return NextResponse.json({ error: errorMessage, code: 'ACCESS_DENIED' }, { status: 403 })
      }

      // 유효성 검증 에러
      if (errorMessage.includes('유효하지 않습니다')) {
        return NextResponse.json({ error: errorMessage, code: 'VALIDATION_ERROR' }, { status: 400 })
      }
    }

    // 기본 서버 에러
    return NextResponse.json(
      { error: '거래 생성 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
