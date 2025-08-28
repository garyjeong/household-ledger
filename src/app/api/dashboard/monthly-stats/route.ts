import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'
import { MonthlyStats } from '@/types/couple-ledger'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyAccessToken(accessToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 쿼리 파라미터에서 년월 가져오기
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') // YYYY-MM 형식
    const groupId = searchParams.get('groupId')

    if (!period) {
      return NextResponse.json({ error: 'Period is required' }, { status: 400 })
    }

    // 해당 월의 시작일과 종료일 계산
    const [year, month] = period.split('-')
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

    // 현재 사용자의 그룹 확인
    let groupFilter = {}
    if (groupId) {
      groupFilter = { groupId }
    } else {
      // 그룹이 지정되지 않은 경우, 사용자의 기본 그룹이나 개인 거래만 조회
      groupFilter = {
        OR: [{ groupId: null }, { userId: user.id }],
      }
    }

    // 해당 기간의 거래 데이터 조회
    const transactions = await prisma.transaction.findMany({
      where: {
        ...groupFilter,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        user: true,
      },
    })

    // 카테고리별 지출 집계
    const categoryBreakdown = new Map()
    let totalExpense = 0
    let totalIncome = 0
    let myExpense = 0
    let partnerExpense = 0
    let sharedExpense = 0

    // 거래 데이터 집계
    transactions.forEach(transaction => {
      const amount = transaction.amount

      if (transaction.type === 'EXPENSE') {
        totalExpense += amount

        // 개인별 지출 분류
        if (transaction.userId === user.id) {
          myExpense += amount
        } else if (transaction.isShared) {
          sharedExpense += amount
        } else {
          partnerExpense += amount
        }

        // 카테고리별 집계
        const categoryId = transaction.categoryId
        const categoryName = transaction.category?.name || '기타'
        const categoryColor = transaction.category?.color || '#8B5CF6'
        const categoryIcon = transaction.category?.icon || 'other'

        if (categoryBreakdown.has(categoryId)) {
          categoryBreakdown.get(categoryId).amount += amount
        } else {
          categoryBreakdown.set(categoryId, {
            categoryId,
            categoryName,
            amount,
            percentage: 0,
            color: categoryColor,
            icon: categoryIcon,
          })
        }
      } else if (transaction.type === 'INCOME') {
        totalIncome += amount
      }
    })

    // 카테고리별 퍼센트 계산 및 TOP 5 선택
    const categoryArray = Array.from(categoryBreakdown.values())
      .map(category => ({
        ...category,
        percentage: totalExpense > 0 ? (category.amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // 일별 트렌드 데이터 생성 (간단한 버전)
    const dailyTrend = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce(
        (acc, transaction) => {
          const date = transaction.date.toISOString().split('T')[0]
          const existing = acc.find(item => item.date === date)

          if (existing) {
            existing.amount += transaction.amount
          } else {
            acc.push({
              date,
              amount: transaction.amount,
              type: 'expense' as const,
            })
          }

          return acc
        },
        [] as Array<{ date: string; amount: number; type: 'expense' }>
      )
      .sort((a, b) => a.date.localeCompare(b.date))

    // 예산 비교 데이터 (임시로 빈 배열, 실제로는 예산 테이블과 조인 필요)
    const budgetComparison: Array<{
      categoryId: string
      budgeted: number
      spent: number
      remaining: number
      percentage: number
    }> = []

    const monthlyStats: MonthlyStats = {
      period,
      totalExpense,
      totalIncome,
      myExpense,
      partnerExpense,
      sharedExpense,
      categoryBreakdown: categoryArray,
      dailyTrend,
      budgetComparison,
    }

    return NextResponse.json({
      success: true,
      data: monthlyStats,
    })
  } catch (error) {
    console.error('Monthly stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
