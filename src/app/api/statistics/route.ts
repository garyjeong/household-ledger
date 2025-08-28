import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyCookieToken } from '@/lib/auth'

// 통계 쿼리 스키마
const statisticsQuerySchema = z.object({
  period: z.string().default('current-month'), // current-month, last-month, last-3-months, last-6-months, year
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupId: z.string().optional(),
})

interface CategoryStatistics {
  categoryId: string
  categoryName: string
  totalAmount: number
  transactionCount: number
  percentage: number
  color: string
}

interface MonthlyComparison {
  period: string
  totalIncome: number
  totalExpense: number
  netAmount: number
}

interface StatisticsResponse {
  period: string
  dateRange: {
    startDate: string
    endDate: string
  }
  summary: {
    totalIncome: number
    totalExpense: number
    netAmount: number
    transactionCount: number
  }
  categoryBreakdown: {
    income: CategoryStatistics[]
    expense: CategoryStatistics[]
  }
  monthlyComparison: MonthlyComparison[]
  dailyTrend: {
    date: string
    income: number
    expense: number
    netAmount: number
  }[]
}

/**
 * GET /api/statistics
 * 통계 데이터 조회 (카테고리별, 기간별)
 */
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = verifyCookieToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 쿼리 파라미터 검증
    const { searchParams } = new URL(request.url)
    const queryResult = statisticsQuerySchema.safeParse({
      period: searchParams.get('period'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      groupId: searchParams.get('groupId'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: '잘못된 쿼리 파라미터입니다',
          code: 'INVALID_QUERY',
          details: queryResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { period, startDate, endDate, groupId } = queryResult.data

    // 기간 계산
    const dateRange = calculateDateRange(period, startDate, endDate)

    // 거래 데이터 조회 (기본 필터)
    const baseTransactionQuery = {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      ...(groupId && {
        OR: [{ groupId: BigInt(groupId) }, { userId: BigInt(user.userId) }],
      }),
      ...(!groupId && {
        userId: BigInt(user.userId),
      }),
    }

    // 1. 요약 통계
    const [transactions, incomeSum, expenseSum] = await Promise.all([
      // 전체 거래 수
      prisma.transaction.count({
        where: baseTransactionQuery,
      }),
      // 수입 합계
      prisma.transaction.aggregate({
        where: {
          ...baseTransactionQuery,
          type: 'INCOME',
        },
        _sum: {
          amount: true,
        },
      }),
      // 지출 합계
      prisma.transaction.aggregate({
        where: {
          ...baseTransactionQuery,
          type: 'EXPENSE',
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    const totalIncome = Number(incomeSum._sum.amount || 0)
    const totalExpense = Number(expenseSum._sum.amount || 0)
    const netAmount = totalIncome - totalExpense

    // 2. 카테고리별 통계
    const [incomeByCategory, expenseByCategory] = await Promise.all([
      // 수입 카테고리별
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          ...baseTransactionQuery,
          type: 'INCOME',
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
      // 지출 카테고리별
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          ...baseTransactionQuery,
          type: 'EXPENSE',
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
    ])

    // 카테고리 정보 조회
    const categoryIds = [
      ...incomeByCategory.map(item => item.categoryId),
      ...expenseByCategory.map(item => item.categoryId),
    ].filter(Boolean)

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds.map(id => BigInt(id!)),
        },
      },
    })

    const categoryMap = new Map(categories.map(cat => [cat.id.toString(), cat]))

    // 카테고리별 통계 포맷팅
    const formatCategoryStats = (
      data: typeof incomeByCategory,
      totalAmount: number
    ): CategoryStatistics[] => {
      return data
        .map(item => {
          const category = categoryMap.get(item.categoryId?.toString() || '')
          if (!category) return null

          const amount = Number(item._sum.amount || 0)
          return {
            categoryId: category.id.toString(),
            categoryName: category.name,
            totalAmount: amount,
            transactionCount: item._count.id,
            percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
            color: category.color,
          }
        })
        .filter(Boolean) as CategoryStatistics[]
    }

    const incomeCategories = formatCategoryStats(incomeByCategory, totalIncome)
    const expenseCategories = formatCategoryStats(expenseByCategory, totalExpense)

    // 3. 일별 트렌드 (최근 30일)
    const dailyStats = await prisma.$queryRaw<
      {
        date: string
        income: bigint
        expense: bigint
      }[]
    >`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as expense
      FROM transactions 
      WHERE created_at >= ${dateRange.startDate}
        AND created_at <= ${dateRange.endDate}
        ${groupId ? prisma.$queryRaw`AND (group_id = ${BigInt(groupId)} OR user_id = ${BigInt(user.userId)})` : prisma.$queryRaw`AND user_id = ${BigInt(user.userId)}`}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    const dailyTrend = dailyStats.map(day => ({
      date: day.date,
      income: Number(day.income),
      expense: Number(day.expense),
      netAmount: Number(day.income) - Number(day.expense),
    }))

    // 4. 월별 비교 (최근 6개월)
    const monthlyComparison = await getMonthlyComparison(user.userId, groupId)

    const response: StatisticsResponse = {
      period,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      },
      summary: {
        totalIncome,
        totalExpense,
        netAmount,
        transactionCount: transactions,
      },
      categoryBreakdown: {
        income: incomeCategories.sort((a, b) => b.totalAmount - a.totalAmount),
        expense: expenseCategories.sort((a, b) => b.totalAmount - a.totalAmount),
      },
      monthlyComparison,
      dailyTrend,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('통계 조회 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * 기간 계산 함수
 */
function calculateDateRange(
  period: string,
  startDate?: string,
  endDate?: string
): { startDate: Date; endDate: Date } {
  const now = new Date()

  if (startDate && endDate) {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    }
  }

  switch (period) {
    case 'current-month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { startDate: startOfMonth, endDate: endOfMonth }
    }
    case 'last-month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return { startDate: startOfLastMonth, endDate: endOfLastMonth }
    }
    case 'last-3-months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { startDate: start, endDate: end }
    }
    case 'last-6-months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { startDate: start, endDate: end }
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      return { startDate: startOfYear, endDate: endOfYear }
    }
    default:
      // 기본값: 현재 월
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { startDate: startOfMonth, endDate: endOfMonth }
  }
}

/**
 * 월별 비교 데이터 조회
 */
async function getMonthlyComparison(
  userId: string,
  groupId?: string
): Promise<MonthlyComparison[]> {
  const now = new Date()
  const months = []

  // 최근 6개월 데이터
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)

    const [incomeSum, expenseSum] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          type: 'INCOME',
          ...(groupId
            ? {
                OR: [{ groupId: BigInt(groupId) }, { userId: BigInt(userId) }],
              }
            : {
                userId: BigInt(userId),
              }),
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          type: 'EXPENSE',
          ...(groupId
            ? {
                OR: [{ groupId: BigInt(groupId) }, { userId: BigInt(userId) }],
              }
            : {
                userId: BigInt(userId),
              }),
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    const totalIncome = Number(incomeSum._sum.amount || 0)
    const totalExpense = Number(expenseSum._sum.amount || 0)

    months.push({
      period: monthDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
    })
  }

  return months
}
