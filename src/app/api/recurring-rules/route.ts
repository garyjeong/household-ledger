import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, verifyResourceOwnership } from '@/lib/auth'
import {
  createRecurringRuleSchema,
  recurringRuleQuerySchema,
  formatRecurringRuleForResponse,
} from '@/lib/schemas/recurring-rule'

/**
 * GET /api/recurring-rules
 * 고정 지출 목록 조회 (사용자 또는 그룹별 필터링, 페이지네이션)
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

    const validationResult = recurringRuleQuerySchema.safeParse(queryParams)
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

    const { ownerType, ownerId, frequency, isActive, page, limit } = validationResult.data

    // 기본 where 조건 구성
    const whereCondition: any = {}

    // 소유권 필터링
    if (ownerType && ownerId) {
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
      whereCondition.ownerType = ownerType
      whereCondition.ownerId = BigInt(ownerId)
    } else {
      // 파라미터가 없으면 사용자 소유 규칙만 조회
      whereCondition.ownerType = 'USER'
      whereCondition.ownerId = BigInt(user.userId)
    }

    // 필터 조건 추가
    if (frequency) {
      whereCondition.frequency = frequency
    }

    if (isActive !== undefined) {
      whereCondition.isActive = isActive
    }

    // 페이지네이션 계산
    const skip = (page - 1) * limit

    // 데이터 조회
    const [recurringRules, totalCount] = await Promise.all([
      prisma.recurringRule.findMany({
        where: whereCondition,
        include: {
          account: {
            select: { id: true, name: true, type: true },
          },
          category: {
            select: { id: true, name: true, color: true, type: true },
          },
        },
        orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.recurringRule.count({ where: whereCondition }),
    ])

    // 응답 형태로 변환
    const formattedRules = recurringRules.map(formatRecurringRuleForResponse)

    return NextResponse.json({
      success: true,
      recurringRules: formattedRules,
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
    console.error('Recurring rules fetch error:', error)
    return NextResponse.json(
      { error: '고정 지출 목록을 가져오는 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recurring-rules
 * 새 고정 지출 생성
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
    const validationResult = createRecurringRuleSchema.safeParse({
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
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

    const ruleData = validationResult.data

    // 소유권 검증
    const ownershipResult = await verifyResourceOwnership(
      user.userId,
      ruleData.ownerType,
      ruleData.ownerId
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        {
          error: ownershipResult.error || '접근 권한이 없습니다',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      )
    }

    // 계좌 존재 확인
    const account = await prisma.account.findUnique({
      where: { id: BigInt(ruleData.accountId) },
    })

    if (!account) {
      return NextResponse.json(
        { error: '계좌를 찾을 수 없습니다', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 계좌 소유권 확인
    if (
      account.ownerType !== ruleData.ownerType ||
      account.ownerId.toString() !== ruleData.ownerId
    ) {
      return NextResponse.json(
        { error: '계좌에 대한 접근 권한이 없습니다', code: 'ACCOUNT_ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 카테고리 확인 (선택적)
    if (ruleData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: BigInt(ruleData.categoryId) },
      })

      if (!category) {
        return NextResponse.json(
          { error: '카테고리를 찾을 수 없습니다', code: 'CATEGORY_NOT_FOUND' },
          { status: 404 }
        )
      }

      // 카테고리 소유권 확인
      if (
        category.ownerType !== ruleData.ownerType ||
        category.ownerId.toString() !== ruleData.ownerId
      ) {
        return NextResponse.json(
          { error: '카테고리에 대한 접근 권한이 없습니다', code: 'CATEGORY_ACCESS_DENIED' },
          { status: 403 }
        )
      }
    }

    // 고정 지출 규칙 생성
    const newRecurringRule = await prisma.recurringRule.create({
      data: {
        ownerType: ruleData.ownerType,
        ownerId: BigInt(ruleData.ownerId),
        startDate: ruleData.startDate,
        frequency: ruleData.frequency,
        dayRule: ruleData.dayRule,
        amount: BigInt(ruleData.amount),
        accountId: BigInt(ruleData.accountId),
        categoryId: ruleData.categoryId ? BigInt(ruleData.categoryId) : null,
        merchant: ruleData.merchant || null,
        memo: ruleData.memo || null,
        isActive: ruleData.isActive,
      },
      include: {
        account: {
          select: { id: true, name: true, type: true },
        },
        category: {
          select: { id: true, name: true, color: true, type: true },
        },
      },
    })

    // 응답 형태로 변환
    const formattedRule = formatRecurringRuleForResponse(newRecurringRule)

    return NextResponse.json(
      {
        success: true,
        recurringRule: formattedRule,
        message: '고정 지출이 성공적으로 추가되었습니다',
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Recurring rule creation error:', error)
    return NextResponse.json(
      { error: '고정 지출 생성 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
