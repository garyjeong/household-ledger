import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyToken } from '@/lib/auth'
import { BalanceService } from '@/lib/services/balance-service'
import { createSuccessResponse, ApiErrors } from '@/lib/api-response'

// 잔액 조회 쿼리 스키마
const balanceQuerySchema = z.object({
  groupId: z.coerce.number().positive().optional(),
  includeProjection: z.boolean().default(false),
  projectionMonths: z.coerce.number().positive().max(12).default(3),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(), // YYYY-MM format
})

/**
 * GET /api/balance
 * 실시간 잔액 조회 (거래 내역 합계로 계산)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인 (쿠키 기반)
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return ApiErrors.unauthorized()
    }

    const user = await verifyToken(accessToken)
    if (!user) {
      return ApiErrors.unauthorized('유효하지 않은 토큰입니다')
    }

    // 쿼리 파라미터 파싱
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)

    // Boolean 값 변환
    const processedParams = {
      ...queryParams,
      includeProjection: queryParams.includeProjection === 'true',
    }

    const validationResult = balanceQuerySchema.safeParse(processedParams)
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

    const { groupId, includeProjection, projectionMonths, period } = validationResult.data

    // 현재 잔액 계산
    const currentBalance = await BalanceService.calculateBalance({
      userId: user.userId,
      groupId: groupId?.toString(),
    })

    // 해당 기간의 수입/지출 정보
    let periodData = null
    if (period) {
      const [year, month] = period.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      const income = await BalanceService.getAmountByType({
        userId: user.userId,
        groupId: groupId?.toString(),
        type: 'INCOME',
        startDate,
        endDate,
      })

      const expense = await BalanceService.getAmountByType({
        userId: user.userId,
        groupId: groupId?.toString(),
        type: 'EXPENSE',
        startDate,
        endDate,
      })

      periodData = {
        period,
        income,
        expense,
        netAmount: income - expense,
      }
    }

    // 예상 잔액 계산 (반복 거래 포함)
    let projectedBalance = null
    let monthlyTrend = null

    if (includeProjection) {
      projectedBalance = await BalanceService.calculateProjectedBalance({
        userId: user.userId,
        groupId: groupId?.toString(),
        months: projectionMonths,
      })

      // 월별 트렌드
      monthlyTrend = await BalanceService.getMonthlyTrend({
        userId: user.userId,
        groupId: groupId?.toString(),
        months: Math.min(projectionMonths, 6), // 최대 6개월
      })
    }

    // 응답 데이터 구성 (최적화)
    const responseData = {
      balance: {
        current: currentBalance,
        projected: projectedBalance,
        currency: 'KRW',
      },
      ...(periodData && { periodData }),
      ...(monthlyTrend && { monthlyTrend }),
    }

    return createSuccessResponse(responseData, {
      devInfo: {
        includeProjection,
        projectionMonths,
        lastCalculated: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    console.error('Balance calculation error:', error)
    return ApiErrors.serverError('잔액 계산 중 오류가 발생했습니다')
  }
}

/**
 * POST /api/balance/budget
 * 예산 현황 조회 (카테고리별 예산 대비 지출)
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (쿠키 기반)
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return ApiErrors.unauthorized()
    }

    const user = await verifyToken(accessToken)
    if (!user) {
      return ApiErrors.unauthorized('유효하지 않은 토큰입니다')
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { groupId, period } = body

    // 기본값: 현재 월
    const currentDate = new Date()
    const defaultPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    const finalPeriod = period || defaultPeriod

    // 예산 현황 조회
    const budgetStatus = await BalanceService.getBudgetStatus({
      userId: user.userId,
      groupId: groupId?.toString(),
      period: finalPeriod,
    })

    return createSuccessResponse({
      period: finalPeriod,
      budgetStatus,
    })
  } catch (error: unknown) {
    console.error('Budget status error:', error)
    return ApiErrors.serverError('예산 현황 조회 중 오류가 발생했습니다')
  }
}
