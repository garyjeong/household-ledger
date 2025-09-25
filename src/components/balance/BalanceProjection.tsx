'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingDown, TrendingUp, Calendar, Clock, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  type BalanceResponse,
  type MonthlyProjection,
  type RecurringExpenseItem,
} from '@/lib/schemas/balance'

interface BalanceProjectionProps {
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  months?: number
  className?: string
}

export function BalanceProjection({
  ownerType,
  ownerId,
  months = 6,
  className = '',
}: BalanceProjectionProps) {
  // 상태 관리
  const [projectionData, setProjectionData] = useState<BalanceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 예상 잔액 데이터 로드
  const loadProjection = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        ownerType,
        ownerId,
        includeProjection: 'true',
        projectionMonths: months.toString(),
      })

      const response = await fetch(`/api/balance?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch projection')
      }

      const data = await response.json()
      setProjectionData(data)
    } catch (error) {
      console.error('Projection loading error:', error)
      setError(error instanceof Error ? error.message : '예상 잔액을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [ownerType, ownerId, months])

  // 초기 로드
  useEffect(() => {
    loadProjection()
  }, [loadProjection])

  // 잔액 포맷팅
  const formatCurrency = (amount: number, currency = 'KRW'): string => {
    if (currency === 'KRW') {
      return `${amount.toLocaleString()}원`
    }
    return `${amount.toLocaleString()} ${currency}`
  }

  // 월 이름 포맷팅
  const formatMonth = (monthStr: string): string => {
    const date = new Date(monthStr + '-01')
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
    })
  }

  // 잔액 변화 상태
  const getBalanceChangeStatus = (change: number): 'positive' | 'negative' | 'neutral' => {
    if (change > 0) return 'positive'
    if (change < 0) return 'negative'
    return 'neutral'
  }

  // 반복 지출 빈도 라벨
  const getFrequencyLabel = (frequency: 'MONTHLY' | 'WEEKLY'): string => {
    return frequency === 'MONTHLY' ? '매월' : '매주'
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>예상 잔액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-slate-200 rounded w-3/4'></div>
            <div className='h-20 bg-slate-200 rounded'></div>
            <div className='h-4 bg-slate-200 rounded w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className='p-6'>
          <div className='flex items-center gap-3 text-red-600'>
            <AlertTriangle className='h-5 w-5' />
            <div>
              <h3 className='font-medium'>예상 잔액 로드 실패</h3>
              <p className='text-sm text-red-500'>{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!projectionData?.projection || !projectionData?.recurringExpenses) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>예상 잔액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <Clock className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>고정 지출이 없습니다</h3>
            <p className='text-gray-600'>고정 지출을 등록하면 예상 잔액을 확인할 수 있습니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { projection, recurringExpenses, totalBalance } = projectionData
  const balanceChange = projection.endBalance - totalBalance
  const changeStatus = getBalanceChangeStatus(balanceChange)

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            예상 잔액
          </CardTitle>
          <Badge
            variant={changeStatus === 'negative' ? 'destructive' : 'default'}
            className='text-xs'
          >
            {changeStatus === 'negative' ? (
              <TrendingDown className='h-3 w-3 mr-1' />
            ) : (
              <TrendingUp className='h-3 w-3 mr-1' />
            )}
            {months}개월 후
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* 현재 vs 예상 잔액 */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='text-center'>
              <div className='text-sm text-gray-600 mb-1'>현재 잔액</div>
              <div className='text-xl font-bold text-blue-600'>{formatCurrency(totalBalance)}</div>
            </div>
            <div className='text-center'>
              <div className='text-sm text-gray-600 mb-1'>{months}개월 후</div>
              <div
                className={`text-xl font-bold ${
                  changeStatus === 'negative' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(projection.endBalance)}
              </div>
            </div>
          </div>

          <div className='mt-3 pt-3 border-t border-gray-200'>
            <div className='text-center'>
              <span className='text-sm text-gray-600'>변화: </span>
              <span
                className={`font-semibold ${
                  changeStatus === 'negative' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {balanceChange >= 0 ? '+' : ''}
                {formatCurrency(balanceChange)}
              </span>
            </div>
          </div>
        </div>

        {/* 월별 예상 잔액 */}
        <div>
          <h4 className='font-medium text-gray-900 mb-3'>월별 잔액 변화</h4>
          <div className='space-y-3'>
            {projection.months.map((month, index) => {
              const prevBalance =
                index === 0 ? totalBalance : projection.months[index - 1].projectedBalance
              const change = month.projectedBalance - prevBalance
              const changePercent = prevBalance > 0 ? Math.abs((change / prevBalance) * 100) : 0

              return (
                <div key={month.month} className='border rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-medium text-gray-900'>{formatMonth(month.month)}</span>
                    <span
                      className={`font-semibold ${
                        month.projectedBalance < 0 ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {formatCurrency(month.projectedBalance)}
                    </span>
                  </div>

                  <div className='flex items-center justify-between text-sm text-gray-600'>
                    <span>고정 지출: -{formatCurrency(month.recurringExpenses)}</span>
                    <span className={change < 0 ? 'text-red-600' : 'text-green-600'}>
                      {change >= 0 ? '+' : ''}
                      {formatCurrency(change)}
                    </span>
                  </div>

                  {month.projectedBalance < 0 && (
                    <div className='mt-2 text-xs text-red-600 flex items-center gap-1'>
                      <AlertTriangle className='h-3 w-3' />
                      잔액 부족 예상
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 고정 지출 요약 */}
        <div>
          <h4 className='font-medium text-gray-900 mb-3'>고정 지출 항목</h4>
          <div className='bg-red-50 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-sm text-gray-700'>월 총 고정 지출</span>
              <span className='font-semibold text-red-600'>
                -{formatCurrency(recurringExpenses.total)}
              </span>
            </div>

            <div className='space-y-2'>
              {recurringExpenses.items.slice(0, 3).map(item => (
                <div key={item.id} className='flex items-center justify-between text-sm'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      {getFrequencyLabel(item.frequency)}
                    </Badge>
                    <span className='text-gray-700'>{item.merchant || '고정 지출'}</span>
                  </div>
                  <span className='text-red-600'>-{formatCurrency(item.amount)}</span>
                </div>
              ))}

              {recurringExpenses.items.length > 3 && (
                <div className='text-xs text-gray-500 text-center pt-2'>
                  +{recurringExpenses.items.length - 3}개 항목 더
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 경고 메시지 */}
        {projection.endBalance < 0 && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-red-600 mt-0.5' />
              <div>
                <h4 className='font-medium text-red-800'>잔액 부족 경고</h4>
                <p className='text-sm text-red-700 mt-1'>
                  현재 고정 지출 패턴이 지속되면 {months}개월 후 잔액이 부족할 수 있습니다. 지출을
                  조정하거나 수입을 늘리는 것을 고려해보세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className='flex items-start gap-2 text-xs text-gray-500'>
          <Info className='h-4 w-4 mt-0.5' />
          <span>
            예상 잔액은 현재 등록된 고정 지출을 기준으로 계산됩니다. 실제 지출은 다를 수 있습니다.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
