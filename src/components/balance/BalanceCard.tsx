'use client'

import { useState, useEffect } from 'react'
import { Wallet, Eye, EyeOff, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { type BalanceResponse } from '@/lib/schemas/balance'

interface BalanceCardProps {
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  showProjection?: boolean
  className?: string
}

export function BalanceCard({
  ownerType,
  ownerId,
  showProjection = false,
  className = '',
}: BalanceCardProps) {
  const { toast } = useToast()

  // 상태 관리
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 잔액 데이터 로드
  const loadBalance = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        ownerType,
        ownerId,
        includeProjection: showProjection.toString(),
        projectionMonths: '3',
      })

      const response = await fetch(`/api/balance?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch balance')
      }

      const data = await response.json()
      setBalanceData(data)
    } catch (error) {
      console.error('Balance loading error:', error)
      setError(error instanceof Error ? error.message : '잔액을 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // 잔액 새로고침
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadBalance(false)
    toast({
      title: '잔액 새로고침 완료',
      description: '최신 잔액 정보를 불러왔습니다.',
    })
  }

  // 초기 로드
  useEffect(() => {
    loadBalance()
  }, [ownerType, ownerId, showProjection])

  // 잔액 포맷팅
  const formatCurrency = (amount: number, currency = 'KRW'): string => {
    if (currency === 'KRW') {
      return `${amount.toLocaleString()}원`
    }
    return `${amount.toLocaleString()} ${currency}`
  }

  // 잔액 변화 추세 계산
  const getBalanceTrend = (): { trend: 'up' | 'down' | 'neutral'; amount: number } | null => {
    if (!balanceData?.projection?.months?.length) return null

    const firstMonth = balanceData.projection.months[0]
    const endBalance = balanceData.projection.endBalance
    const currentBalance = balanceData.totalBalance
    const change = endBalance - currentBalance

    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      amount: Math.abs(change),
    }
  }

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className='p-6'>
          <div className='animate-pulse'>
            <div className='flex items-center space-x-4'>
              <div className='h-10 w-10 bg-slate-200 rounded-full'></div>
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-slate-200 rounded w-3/4'></div>
                <div className='h-6 bg-slate-200 rounded w-1/2'></div>
              </div>
            </div>
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
            <AlertCircle className='h-5 w-5' />
            <div>
              <h3 className='font-medium'>잔액 로드 실패</h3>
              <p className='text-sm text-red-500'>{error}</p>
            </div>
          </div>
          <Button variant='outline' size='sm' onClick={() => loadBalance()} className='mt-3'>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!balanceData) return null

  const trend = getBalanceTrend()
  const activeAccounts = balanceData.accountBalances.filter(account => account.isActive)

  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Wallet className='h-5 w-5' />
            전체 잔액
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowBalance(!showBalance)}
              className='h-8 w-8 p-0'
            >
              {showBalance ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleRefresh}
              disabled={isRefreshing}
              className='h-8 w-8 p-0'
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='space-y-4'>
          {/* 전체 잔액 */}
          <div className='text-center'>
            <div className='text-3xl font-bold text-slate-900'>
              {showBalance
                ? formatCurrency(balanceData.totalBalance, balanceData.currency)
                : '••••••••'}
            </div>
            <div className='flex items-center justify-center gap-2 mt-2'>
              <Badge variant='outline' className='text-xs'>
                {activeAccounts.length}개 계좌
              </Badge>
              {trend && showProjection && (
                <Badge
                  variant={trend.trend === 'down' ? 'destructive' : 'default'}
                  className='text-xs'
                >
                  {trend.trend === 'up' ? (
                    <TrendingUp className='h-3 w-3 mr-1' />
                  ) : trend.trend === 'down' ? (
                    <TrendingDown className='h-3 w-3 mr-1' />
                  ) : null}
                  3개월 후 {trend.trend === 'down' ? '-' : '+'}
                  {formatCurrency(trend.amount)}
                </Badge>
              )}
            </div>
          </div>

          {/* 고정 지출 요약 */}
          {showProjection && balanceData.recurringExpenses && (
            <div className='border-t pt-4'>
              <div className='text-sm text-gray-600 mb-2'>월 고정 지출</div>
              <div className='flex items-center justify-between'>
                <span className='text-lg font-semibold text-red-600'>
                  -{formatCurrency(balanceData.recurringExpenses.total)}
                </span>
                <Badge variant='outline' className='text-xs'>
                  {balanceData.recurringExpenses.items.length}개 항목
                </Badge>
              </div>
            </div>
          )}

          {/* 업데이트 시간 */}
          <div className='text-xs text-gray-500 text-center'>
            최종 업데이트: {new Date(balanceData.lastUpdated).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
