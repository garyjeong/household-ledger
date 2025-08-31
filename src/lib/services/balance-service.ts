import { prisma } from '@/lib/prisma'
import { TransactionType } from '@prisma/client'

/**
 * 잔액 계산 서비스
 * - 계좌 없이 거래 내역의 합계로 실시간 잔액 계산
 * - 개인/그룹별 잔액 관리
 * - 예상 잔액 계산 (반복 거래 포함)
 */
export class BalanceService {
  /**
   * 사용자/그룹의 현재 잔액 계산 (실시간)
   * INCOME은 양수, EXPENSE는 음수로 저장되어 있어서 직접 합산
   */
  static async calculateBalance(params: {
    userId?: string
    groupId?: string
    startDate?: Date
    endDate?: Date
    categoryId?: string
  }): Promise<number> {
    const { userId, groupId, startDate, endDate, categoryId } = params

    const whereCondition: any = {}

    if (userId) {
      whereCondition.ownerUserId = BigInt(userId)
    }

    if (groupId) {
      whereCondition.groupId = BigInt(groupId)
    }

    if (startDate) {
      whereCondition.date = { ...whereCondition.date, gte: startDate }
    }

    if (endDate) {
      whereCondition.date = { ...whereCondition.date, lte: endDate }
    }

    if (categoryId) {
      whereCondition.categoryId = BigInt(categoryId)
    }

    const result = await prisma.transaction.aggregate({
      where: whereCondition,
      _sum: {
        amount: true, // INCOME(+) + EXPENSE(-) = 실제 잔액
      },
    })

    return Number(result._sum.amount || 0)
  }

  /**
   * 거래 유형별 합계 계산
   */
  static async getAmountByType(params: {
    userId?: string
    groupId?: string
    type: TransactionType
    startDate?: Date
    endDate?: Date
  }): Promise<number> {
    const { userId, groupId, type, startDate, endDate } = params

    const whereCondition: any = { type }

    if (userId) {
      whereCondition.ownerUserId = BigInt(userId)
    }

    if (groupId) {
      whereCondition.groupId = BigInt(groupId)
    }

    if (startDate) {
      whereCondition.date = { ...whereCondition.date, gte: startDate }
    }

    if (endDate) {
      whereCondition.date = { ...whereCondition.date, lte: endDate }
    }

    const result = await prisma.transaction.aggregate({
      where: whereCondition,
      _sum: {
        amount: true,
      },
    })

    // 절댓값으로 반환 (EXPENSE는 음수로 저장되지만 표시할 때는 양수)
    return Math.abs(Number(result._sum.amount || 0))
  }

  /**
   * 카테고리별 지출/수입 합계
   */
  static async getCategoryTotals(params: {
    userId?: string
    groupId?: string
    type: TransactionType
    startDate?: Date
    endDate?: Date
  }): Promise<Array<{ categoryId: string | null; total: number; categoryName: string | null }>> {
    const { userId, groupId, type, startDate, endDate } = params

    const whereCondition: any = { type }

    if (userId) {
      whereCondition.ownerUserId = BigInt(userId)
    }

    if (groupId) {
      whereCondition.groupId = BigInt(groupId)
    }

    if (startDate) {
      whereCondition.date = { ...whereCondition.date, gte: startDate }
    }

    if (endDate) {
      whereCondition.date = { ...whereCondition.date, lte: endDate }
    }

    const results = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: whereCondition,
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    })

    // 카테고리 정보 조회
    const categoryIds = results
      .map(r => r.categoryId)
      .filter(id => id !== null)
      .map(id => BigInt(id!))

    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
      },
    })

    const categoryMap = new Map(categories.map(cat => [cat.id.toString(), cat.name]))

    return results.map(result => ({
      categoryId: result.categoryId?.toString() || null,
      total: Math.abs(Number(result._sum.amount || 0)),
      categoryName: result.categoryId
        ? categoryMap.get(result.categoryId.toString()) || null
        : null,
    }))
  }

  /**
   * 월별 잔액 변화 추이
   */
  static async getMonthlyTrend(params: {
    userId?: string
    groupId?: string
    months: number
  }): Promise<Array<{ month: string; balance: number; income: number; expense: number }>> {
    const { userId, groupId, months } = params

    const results: Array<{ month: string; balance: number; income: number; expense: number }> = []

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      // 해당 월까지의 누적 잔액
      const balance = await this.calculateBalance({
        userId,
        groupId,
        endDate,
      })

      // 해당 월의 수입
      const income = await this.getAmountByType({
        userId,
        groupId,
        type: 'INCOME',
        startDate,
        endDate,
      })

      // 해당 월의 지출
      const expense = await this.getAmountByType({
        userId,
        groupId,
        type: 'EXPENSE',
        startDate,
        endDate,
      })

      results.push({
        month: monthStr,
        balance,
        income,
        expense,
      })
    }

    return results
  }

  /**
   * 예상 잔액 계산 (반복 거래 포함)
   */
  static async calculateProjectedBalance(params: {
    userId?: string
    groupId?: string
    months: number
  }): Promise<number> {
    const { userId, groupId, months } = params

    // 현재 잔액
    const currentBalance = await this.calculateBalance({ userId, groupId })

    // 반복 거래 규칙 조회
    const ownerType = groupId ? 'GROUP' : 'USER'
    const ownerId = BigInt(groupId || userId!)

    const recurringRules = await prisma.recurringRule.findMany({
      where: {
        ownerType,
        ownerId,
        isActive: true,
      },
    })

    // 향후 months개월 동안의 반복 거래 합계 계산
    let projectedAmount = 0

    for (const rule of recurringRules) {
      let frequency = 0

      switch (rule.frequency) {
        case 'MONTHLY':
          frequency = months
          break
        case 'WEEKLY':
          frequency = months * 4 // 대략적으로 한 달에 4주
          break
        case 'DAILY':
          frequency = months * 30 // 대략적으로 한 달에 30일
          break
      }

      projectedAmount += Number(rule.amount) * frequency
    }

    return currentBalance + projectedAmount
  }

  /**
   * 예산 대비 지출 현황
   */
  static async getBudgetStatus(params: {
    userId?: string
    groupId?: string
    period: string // YYYY-MM
  }): Promise<{
    totalBudget: number
    totalSpent: number
    remainingBudget: number
    usagePercent: number
    categoryBreakdown: Array<{
      categoryId: string
      categoryName: string
      budget: number
      spent: number
      remaining: number
      usagePercent: number
    }>
  }> {
    const { userId, groupId, period } = params

    const ownerType = groupId ? 'GROUP' : 'USER'
    const ownerId = BigInt(groupId || userId!)

    // 해당 기간의 시작/끝 날짜
    const [year, month] = period.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // 월별 총 예산 조회
    const budget = await prisma.budget.findUnique({
      where: {
        ownerType_ownerId_period: {
          ownerType,
          ownerId,
          period,
        },
      },
    })

    const totalBudget = Number(budget?.totalAmount || 0)

    // 해당 기간의 총 지출
    const totalSpent = await this.getAmountByType({
      userId,
      groupId,
      type: 'EXPENSE',
      startDate,
      endDate,
    })

    // 카테고리별 예산 대비 지출
    const categories = await prisma.category.findMany({
      where: {
        ownerType,
        ownerId,
        budgetAmount: { gt: 0 },
      },
      include: {
        transactions: {
          where: {
            type: 'EXPENSE',
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            amount: true,
          },
        },
      },
    })

    const categoryBreakdown = categories.map(category => {
      const budget = Number(category.budgetAmount || 0)
      const spent = category.transactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
      const remaining = budget - spent
      const usagePercent = budget > 0 ? (spent / budget) * 100 : 0

      return {
        categoryId: category.id.toString(),
        categoryName: category.name,
        budget,
        spent,
        remaining,
        usagePercent,
      }
    })

    return {
      totalBudget,
      totalSpent,
      remainingBudget: totalBudget - totalSpent,
      usagePercent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      categoryBreakdown,
    }
  }
}
