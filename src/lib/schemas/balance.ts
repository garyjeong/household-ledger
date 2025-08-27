import { z } from 'zod'

// 잔액 조회 쿼리 스키마
export const balanceQuerySchema = z.object({
  ownerType: z.enum(['USER', 'GROUP']).optional(),
  ownerId: z.string().optional(),
  accountId: z.string().optional(), // 특정 계좌 잔액 조회
  includeProjection: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default(false), // 고정 지출을 고려한 예상 잔액 포함 여부
  projectionMonths: z
    .string()
    .optional()
    .default('3')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 12, '예상 기간은 1-12개월 사이여야 합니다'),
})

// 계좌별 잔액 정보
export interface AccountBalance {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  isActive: boolean
}

// 고정 지출 항목
export interface RecurringExpenseItem {
  id: string
  amount: number
  frequency: 'MONTHLY' | 'WEEKLY'
  dayRule: string
  merchant?: string
  isActive: boolean
}

// 월별 예상 지출
export interface MonthlyProjection {
  month: string // YYYY-MM 형식
  recurringExpenses: number
  projectedBalance: number
}

// 잔액 조회 응답
export interface BalanceResponse {
  totalBalance: number
  accountBalances: AccountBalance[]
  currency: string
  recurringExpenses?: {
    monthly: number
    weekly: number
    total: number
    items: RecurringExpenseItem[]
  }
  projection?: {
    months: MonthlyProjection[]
    endBalance: number
  }
  lastUpdated: string
}

// 응답 포맷터
export function formatBalanceResponse(data: {
  accounts: any[]
  recurringExpenses?: any[]
  includeProjection?: boolean
  projectionMonths?: number
}): BalanceResponse {
  const { accounts, recurringExpenses = [], includeProjection = false, projectionMonths = 3 } = data

  // 계좌별 잔액 정보
  const accountBalances: AccountBalance[] = accounts.map(account => ({
    id: account.id.toString(),
    name: account.name,
    type: account.type,
    currency: account.currency,
    balance: Number(account.balance),
    isActive: account.isActive,
  }))

  // 전체 잔액 계산 (활성 계좌만)
  const totalBalance = accountBalances
    .filter(account => account.isActive)
    .reduce((sum, account) => sum + account.balance, 0)

  // 기본 응답
  const response: BalanceResponse = {
    totalBalance,
    accountBalances,
    currency: accounts[0]?.currency || 'KRW',
    lastUpdated: new Date().toISOString(),
  }

  // 고정 지출 정보 추가
  if (includeProjection && recurringExpenses.length > 0) {
    const activeRecurringExpenses = recurringExpenses.filter(expense => expense.isActive)

    // 월별/주별 고정 지출 계산
    const monthlyTotal = activeRecurringExpenses
      .filter(expense => expense.frequency === 'MONTHLY')
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    const weeklyTotal = activeRecurringExpenses
      .filter(expense => expense.frequency === 'WEEKLY')
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    const monthlyFromWeekly = (weeklyTotal * 52) / 12 // 주별을 월별로 환산

    response.recurringExpenses = {
      monthly: monthlyTotal,
      weekly: weeklyTotal,
      total: monthlyTotal + monthlyFromWeekly,
      items: activeRecurringExpenses.map(expense => ({
        id: expense.id.toString(),
        amount: Number(expense.amount),
        frequency: expense.frequency,
        dayRule: expense.dayRule,
        merchant: expense.merchant,
        isActive: expense.isActive,
      })),
    }

    // 월별 예상 잔액 계산
    const projections: MonthlyProjection[] = []
    let currentBalance = totalBalance

    for (let i = 1; i <= projectionMonths; i++) {
      const projectionDate = new Date()
      projectionDate.setMonth(projectionDate.getMonth() + i)
      const monthStr = projectionDate.toISOString().slice(0, 7) // YYYY-MM

      const monthlyExpense = response.recurringExpenses.total
      currentBalance -= monthlyExpense

      projections.push({
        month: monthStr,
        recurringExpenses: monthlyExpense,
        projectedBalance: currentBalance,
      })
    }

    response.projection = {
      months: projections,
      endBalance: currentBalance,
    }
  }

  return response
}

export type BalanceQueryRequest = z.infer<typeof balanceQuerySchema>
