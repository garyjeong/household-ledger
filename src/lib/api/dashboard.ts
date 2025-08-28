/**
 * 대시보드 관련 API 클라이언트 함수들
 */

import { MonthlyStats } from '@/types/couple-ledger'

/**
 * 월별 통계 데이터를 가져오는 API 호출
 */
export async function fetchMonthlyStats(period: string, groupId?: string): Promise<MonthlyStats> {
  const params = new URLSearchParams({ period })
  if (groupId) {
    params.set('groupId', groupId)
  }

  const response = await fetch(`/api/dashboard/monthly-stats?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 쿠키 포함
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch monthly stats')
  }

  const result = await response.json()
  return result.data
}

/**
 * 실시간 잔액 정보를 가져오는 API 호출
 */
export async function fetchRealTimeBalance(groupId?: string): Promise<{
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  savingsRate: number
}> {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const stats = await fetchMonthlyStats(currentMonth, groupId)

  const totalBalance = stats.totalIncome - stats.totalExpense
  const savingsRate = stats.totalIncome > 0 ? (totalBalance / stats.totalIncome) * 100 : 0

  return {
    totalBalance,
    monthlyIncome: stats.totalIncome,
    monthlyExpense: stats.totalExpense,
    savingsRate,
  }
}
