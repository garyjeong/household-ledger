'use client'

import { useState, useEffect } from 'react'
import {
  Building,
  CreditCard,
  PiggyBank,
  Wallet2,
  MoreVertical,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type AccountBalance } from '@/lib/schemas/balance'

interface AccountBalanceListProps {
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  showInactive?: boolean
  onAccountClick?: (accountId: string) => void
  className?: string
}

// 계좌 타입별 아이콘
const getAccountIcon = (type: string) => {
  switch (type) {
    case 'BANK':
      return Building
    case 'CARD':
      return CreditCard
    case 'CASH':
      return Wallet2
    default:
      return PiggyBank
  }
}

// 계좌 타입별 라벨
const getAccountTypeLabel = (type: string): string => {
  switch (type) {
    case 'BANK':
      return '은행'
    case 'CARD':
      return '카드'
    case 'CASH':
      return '현금'
    default:
      return '기타'
  }
}

export function AccountBalanceList({
  ownerType,
  ownerId,
  showInactive = false,
  onAccountClick,
  className = '',
}: AccountBalanceListProps) {
  // 상태 관리
  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBalances, setShowBalances] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 계좌 데이터 로드
  const loadAccounts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        ownerType,
        ownerId,
      })

      const response = await fetch(`/api/balance?${params}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data.accountBalances || [])
    } catch (error) {
      console.error('Accounts loading error:', error)
      setError(error instanceof Error ? error.message : '계좌 정보를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadAccounts()
  }, [ownerType, ownerId])

  // 잔액 포맷팅
  const formatCurrency = (amount: number, currency = 'KRW'): string => {
    if (currency === 'KRW') {
      return `${amount.toLocaleString()}원`
    }
    return `${amount.toLocaleString()} ${currency}`
  }

  // 잔액 상태 확인
  const getBalanceStatus = (balance: number): 'positive' | 'negative' | 'zero' => {
    if (balance > 0) return 'positive'
    if (balance < 0) return 'negative'
    return 'zero'
  }

  // 필터링된 계좌 목록
  const filteredAccounts = showInactive ? accounts : accounts.filter(account => account.isActive)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>계좌별 잔액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='animate-pulse'>
                <div className='flex items-center space-x-4'>
                  <div className='h-10 w-10 bg-slate-200 rounded-full'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-slate-200 rounded w-3/4'></div>
                    <div className='h-3 bg-slate-200 rounded w-1/2'></div>
                  </div>
                </div>
              </div>
            ))}
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
              <h3 className='font-medium'>계좌 정보 로드 실패</h3>
              <p className='text-sm text-red-500'>{error}</p>
            </div>
          </div>
          <Button variant='outline' size='sm' onClick={loadAccounts} className='mt-3'>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (filteredAccounts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>계좌별 잔액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <Wallet2 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>계좌가 없습니다</h3>
            <p className='text-gray-600'>계좌를 추가해서 잔액을 관리해보세요</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>계좌별 잔액</CardTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowBalances(!showBalances)}
              className='h-8 w-8 p-0'
            >
              {showBalances ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-3'>
          {filteredAccounts.map(account => {
            const IconComponent = getAccountIcon(account.type)
            const balanceStatus = getBalanceStatus(account.balance)

            return (
              <div
                key={account.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-colors
                  ${account.isActive ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 opacity-60'}
                  ${onAccountClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onAccountClick?.(account.id)}
              >
                <div className='flex items-center gap-3'>
                  <div
                    className={`
                    p-2 rounded-full
                    ${account.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}
                  `}
                  >
                    <IconComponent className='h-4 w-4' />
                  </div>

                  <div>
                    <div className='flex items-center gap-2'>
                      <h4 className='font-medium text-gray-900'>{account.name}</h4>
                      <Badge variant='outline' className='text-xs'>
                        {getAccountTypeLabel(account.type)}
                      </Badge>
                      {!account.isActive && (
                        <Badge variant='secondary' className='text-xs'>
                          비활성
                        </Badge>
                      )}
                    </div>
                    <p className='text-sm text-gray-600'>{account.currency}</p>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <div className='text-right'>
                    <div
                      className={`
                      font-semibold
                      ${
                        balanceStatus === 'positive'
                          ? 'text-green-600'
                          : balanceStatus === 'negative'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }
                    `}
                    >
                      {showBalances ? formatCurrency(account.balance, account.currency) : '••••••'}
                    </div>

                    {balanceStatus === 'negative' && showBalances && (
                      <div className='flex items-center gap-1 text-red-500 text-xs'>
                        <TrendingDown className='h-3 w-3' />
                        <span>마이너스</span>
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => onAccountClick?.(account.id)}>
                        <Building className='h-4 w-4 mr-2' />
                        상세 보기
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {}}>
                        <TrendingUp className='h-4 w-4 mr-2' />
                        거래 내역
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>

        {/* 요약 정보 */}
        <div className='mt-4 pt-4 border-t'>
          <div className='flex justify-between text-sm text-gray-600'>
            <span>총 {filteredAccounts.length}개 계좌</span>
            <span>활성: {filteredAccounts.filter(acc => acc.isActive).length}개</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
