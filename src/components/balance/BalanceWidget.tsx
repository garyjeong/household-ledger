'use client'

import React, { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiGet } from '@/lib/api-client'

interface BalanceWidgetProps {
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  showProjection?: boolean
  compact?: boolean
  className?: string
}

interface BalanceData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  projectedBalance?: number
  currency: string
}

export function BalanceWidget({
  ownerType,
  ownerId,
  showProjection = false,
  compact = false,
  className = '',
}: BalanceWidgetProps) {
  const [balanceData, setBalanceData] = useState<BalanceData>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    projectedBalance: 0,
    currency: 'KRW',
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadBalanceData = async () => {
      if (!ownerId) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/balance?ownerType=${ownerType}&ownerId=${ownerId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch balance data')
        }

        const data = await response.json()
        setBalanceData({
          totalBalance: data.totalBalance || 0,
          monthlyIncome: data.monthlyIncome || 0,
          monthlyExpense: data.monthlyExpense || 0,
          projectedBalance: data.projectedBalance || 0,
          currency: data.currency || 'KRW',
        })
      } catch (error) {
        console.error('Failed to load balance data:', error)
        // Fallback to zero values on error
        setBalanceData({
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpense: 0,
          projectedBalance: 0,
          currency: 'KRW',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBalanceData()
  }, [ownerType, ownerId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: balanceData.currency,
    }).format(amount)
  }

  const isPositive = balanceData.totalBalance >= 0

  if (compact) {
    return (
      <Card className={`${className}`}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-xs sm:text-sm font-medium text-slate-700'>잔액</CardTitle>
          <Wallet
            className={`h-4 w-4 sm:h-5 sm:w-5 ${isPositive ? 'text-blue-600' : 'text-red-600'}`}
          />
        </CardHeader>
        <CardContent className='pb-3 sm:pb-6'>
          {isLoading ? (
            <div className='space-y-2'>
              <div className='h-6 bg-slate-200 rounded animate-pulse'></div>
              <div className='h-3 bg-slate-200 rounded animate-pulse w-3/4'></div>
            </div>
          ) : (
            <>
              <div
                className={`text-xl sm:text-2xl font-bold ${isPositive ? 'text-blue-900' : 'text-red-900'}`}
              >
                {formatCurrency(balanceData.totalBalance)}
              </div>
              <p className='text-xs text-slate-600 mt-1'>사용 가능 금액</p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-white border-slate-200 shadow-sm ${className}`}>
      <CardHeader className='border-b border-slate-100 pb-4'>
        <CardTitle className='text-lg font-semibold text-slate-900 flex items-center gap-2'>
          <Wallet className='h-5 w-5 text-slate-600' />
          잔액 현황
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-6'>
        {isLoading ? (
          <div className='space-y-4'>
            <div className='h-8 bg-slate-200 rounded animate-pulse'></div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='h-16 bg-slate-200 rounded animate-pulse'></div>
              <div className='h-16 bg-slate-200 rounded animate-pulse'></div>
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Total Balance */}
            <div className='text-center'>
              <div
                className={`text-3xl font-bold ${isPositive ? 'text-slate-900' : 'text-red-600'}`}
              >
                {formatCurrency(balanceData.totalBalance)}
              </div>
              <p className='text-sm text-slate-500 mt-1'>총 잔액</p>
            </div>

            {/* Monthly Summary */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='text-center p-3 bg-green-50 rounded-lg'>
                <TrendingUp className='h-5 w-5 text-green-600 mx-auto mb-2' />
                <div className='text-lg font-semibold text-green-900'>
                  {formatCurrency(balanceData.monthlyIncome)}
                </div>
                <p className='text-xs text-green-600'>이번 달 수입</p>
              </div>

              <div className='text-center p-3 bg-red-50 rounded-lg'>
                <TrendingDown className='h-5 w-5 text-red-600 mx-auto mb-2' />
                <div className='text-lg font-semibold text-red-900'>
                  {formatCurrency(balanceData.monthlyExpense)}
                </div>
                <p className='text-xs text-red-600'>이번 달 지출</p>
              </div>
            </div>

            {/* Projection (if enabled) */}
            {showProjection && balanceData.projectedBalance !== undefined && (
              <div className='border-t pt-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-600'>월말 예상 잔액</span>
                  <div
                    className={`text-lg font-semibold ${
                      balanceData.projectedBalance >= 0 ? 'text-slate-900' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(balanceData.projectedBalance)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BalanceWidget
