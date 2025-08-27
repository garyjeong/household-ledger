'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  accountTypeIcons,
  accountTypeColors,
  accountTypeLabels,
  formatCurrency,
  getBalanceColorClass,
  type AccountType,
} from '@/lib/utils/account'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: string
  balance: string
  isActive: boolean
  ownerType: 'USER' | 'GROUP'
  ownerId: string
}

interface AccountListProps {
  accounts: Account[]
  onEdit?: (account: Account) => void
  onDelete?: (account: Account) => void
  onToggleActive?: (account: Account) => void
  isLoading?: boolean
}

export function AccountList({
  accounts,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false,
}: AccountListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // 삭제 핸들러
  const handleDelete = async (account: Account) => {
    if (!onDelete) return

    const confirmed = window.confirm(`'${account.name}' 계좌를 삭제하시겠습니까?`)
    if (!confirmed) return

    setDeletingId(account.id)
    try {
      await onDelete(account)
    } catch (error) {
      console.error('계좌 삭제 중 오류:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // 활성화 토글 핸들러
  const handleToggleActive = async (account: Account) => {
    if (!onToggleActive) return

    setTogglingId(account.id)
    try {
      await onToggleActive(account)
    } catch (error) {
      console.error('계좌 상태 변경 중 오류:', error)
    } finally {
      setTogglingId(null)
    }
  }

  // 빈 상태 표시
  if (accounts.length === 0 && !isLoading) {
    return (
      <div className='text-center py-12'>
        <div className='mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
          <accountTypeIcons.BANK className='h-8 w-8 text-gray-400' />
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>계좌가 없습니다</h3>
        <p className='text-gray-500 mb-4'>첫 번째 계좌를 추가해보세요.</p>
      </div>
    )
  }

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, index) => (
          <Card key={index} className='animate-pulse'>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-4'>
                <div className='h-10 w-10 bg-gray-200 rounded-lg' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-1/3' />
                  <div className='h-3 bg-gray-200 rounded w-1/4' />
                </div>
                <div className='h-4 bg-gray-200 rounded w-20' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {accounts.map(account => {
        const Icon = accountTypeIcons[account.type]
        const colors = accountTypeColors[account.type]
        const balanceColor = getBalanceColorClass(account.balance)
        const isDeleting = deletingId === account.id
        const isToggling = togglingId === account.id

        return (
          <Card
            key={account.id}
            className={`
              transition-all duration-200
              ${
                account.isActive
                  ? 'border-stroke-200 hover:border-stroke-300'
                  : 'border-gray-200 bg-gray-50 opacity-75'
              }
              ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <CardContent className='p-4'>
              <div className='flex items-center gap-4'>
                {/* 계좌 타입 아이콘 */}
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-lg
                  ${colors.bg} ${colors.border} border
                `}
                >
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>

                {/* 계좌 정보 */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h3 className='font-medium text-gray-900 truncate'>{account.name}</h3>
                    {!account.isActive && (
                      <Badge variant='secondary' className='text-xs'>
                        비활성
                      </Badge>
                    )}
                  </div>
                  <p className='text-sm text-gray-500'>
                    {accountTypeLabels[account.type]} • {account.currency}
                  </p>
                </div>

                {/* 잔액 */}
                <div className='text-right'>
                  <p className={`font-semibold ${balanceColor}`}>
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>

                {/* 액션 메뉴 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      disabled={isDeleting || isToggling}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                      <span className='sr-only'>메뉴 열기</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(account)}>
                        <Edit2 className='mr-2 h-4 w-4' />
                        수정
                      </DropdownMenuItem>
                    )}

                    {onToggleActive && (
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(account)}
                        disabled={isToggling}
                      >
                        {account.isActive ? (
                          <>
                            <EyeOff className='mr-2 h-4 w-4' />
                            비활성화
                          </>
                        ) : (
                          <>
                            <Eye className='mr-2 h-4 w-4' />
                            활성화
                          </>
                        )}
                      </DropdownMenuItem>
                    )}

                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(account)}
                          className='text-red-600 focus:text-red-600'
                          disabled={isDeleting}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          삭제
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
