'use client'

import { useState, useEffect } from 'react'
import { 
  Wallet, 
  Eye, 
  EyeOff, 
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type BalanceResponse } from '@/lib/schemas/balance'

interface BalanceWidgetProps {
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  showProjection?: boolean
  compact?: boolean
  onClick?: () => void
  className?: string
}

export function BalanceWidget({ 
  ownerType, 
  ownerId, 
  showProjection = false,
  compact = false,
  onClick,
  className = '' 
}: BalanceWidgetProps) {
  // 상태 관리
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 잔액 데이터 로드
  const loadBalance = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        ownerType,
        ownerId,
        includeProjection: showProjection.toString(),
        projectionMonths: '1',
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
    }
  }

  // 초기 로드
  useEffect(() => {
    loadBalance()
  }, [ownerType, ownerId, showProjection])

  // 잔액 포맷팅
  const formatCurrency = (amount: number, currency = 'KRW', short = false): string => {
    if (short && currency === 'KRW') {
      if (Math.abs(amount) >= 100000000) {
        return `${(amount / 100000000).toFixed(1)}억원`
      } else if (Math.abs(amount) >= 10000) {
        return `${(amount / 10000).toFixed(0)}만원`
      }
    }
    
    if (currency === 'KRW') {
      return `${amount.toLocaleString()}원`
    }
    return `${amount.toLocaleString()} ${currency}`
  }

  // 잔액 상태
  const getBalanceStatus = (balance: number): 'positive' | 'negative' | 'zero' => {
    if (balance > 0) return 'positive'
    if (balance < 0) return 'negative'
    return 'zero'
  }

  if (isLoading) {
    return (
      <Card className={`${className} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}>
        <CardContent className={`${compact ? 'p-4' : 'p-6'}`}>
          <div className="animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-32"></div>
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
        <CardContent className={`${compact ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">잔액 로드 실패</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!balanceData) return null

  const balanceStatus = getBalanceStatus(balanceData.totalBalance)
  const activeAccounts = balanceData.accountBalances.filter(account => account.isActive)
  
  // 다음 달 예상 잔액 변화
  const nextMonthChange = balanceData.projection?.months?.[0] 
    ? balanceData.projection.months[0].projectedBalance - balanceData.totalBalance
    : null

  return (
    <Card 
      className={`${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className={`${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-full
              ${balanceStatus === 'positive' ? 'bg-green-100 text-green-600' : 
                balanceStatus === 'negative' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}
            `}>
              <Wallet className={`${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm text-gray-600 ${compact ? 'text-xs' : ''}`}>
                  전체 잔액
                </span>
                {!compact && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowBalance(!showBalance)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    {showBalance ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              
              <div className={`font-bold ${
                compact ? 'text-lg' : 'text-xl'
              } ${
                balanceStatus === 'positive' ? 'text-green-600' : 
                balanceStatus === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {showBalance ? (
                  formatCurrency(balanceData.totalBalance, balanceData.currency, compact)
                ) : (
                  '••••••••'
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {!compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  loadBalance()
                }}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            
            <Badge variant="outline" className="text-xs">
              {activeAccounts.length}개 계좌
            </Badge>
            
            {/* 다음 달 예상 변화 */}
            {showProjection && nextMonthChange && showBalance && (
              <Badge 
                variant={nextMonthChange < 0 ? 'destructive' : 'default'}
                className="text-xs"
              >
                {nextMonthChange < 0 ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingUp className="h-3 w-3 mr-1" />
                )}
                다음달 {nextMonthChange >= 0 ? '+' : ''}{formatCurrency(nextMonthChange, balanceData.currency, true)}
              </Badge>
            )}
          </div>
        </div>

        {/* 부가 정보 (compact 모드가 아닐 때) */}
        {!compact && balanceData.recurringExpenses && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">월 고정 지출</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(balanceData.recurringExpenses.total, balanceData.currency, true)}
              </span>
            </div>
          </div>
        )}

        {/* 경고 표시 */}
        {balanceStatus === 'negative' && (
          <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>잔액 부족</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
