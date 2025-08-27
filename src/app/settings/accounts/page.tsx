'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AccountList, type Account } from '@/components/accounts/AccountList'
import { AccountDialog } from '@/components/accounts/AccountDialog'
import { accountTypeLabels, type AccountType } from '@/lib/utils/account'
import { type CreateAccountData, type UpdateAccountData } from '@/lib/schemas/account'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<AccountType | 'ALL'>('ALL')
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Dialog 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>()

  // Mock 데이터 로드 (실제로는 API 호출)
  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoading(true)
      try {
        // TODO: 실제 API 호출로 대체
        await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션

        const mockAccounts: Account[] = [
          {
            id: '1',
            name: '신한은행 주거래',
            type: 'BANK',
            currency: 'KRW',
            balance: '1500000',
            isActive: true,
            ownerType: 'USER',
            ownerId: '1',
          },
          {
            id: '2',
            name: '현금',
            type: 'CASH',
            currency: 'KRW',
            balance: '50000',
            isActive: true,
            ownerType: 'USER',
            ownerId: '1',
          },
          {
            id: '3',
            name: '신한카드',
            type: 'CARD',
            currency: 'KRW',
            balance: '-120000',
            isActive: true,
            ownerType: 'USER',
            ownerId: '1',
          },
          {
            id: '4',
            name: '비상금 통장',
            type: 'BANK',
            currency: 'KRW',
            balance: '500000',
            isActive: false,
            ownerType: 'USER',
            ownerId: '1',
          },
        ]

        setAccounts(mockAccounts)
      } catch (error) {
        console.error('계좌 목록 로드 중 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [])

  // 필터링된 계좌 목록
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'ALL' || account.type === filterType
    const matchesActive =
      filterActive === 'ALL' ||
      (filterActive === 'ACTIVE' && account.isActive) ||
      (filterActive === 'INACTIVE' && !account.isActive)

    return matchesSearch && matchesType && matchesActive
  })

  // 계좌 추가
  const handleCreate = () => {
    setDialogMode('create')
    setSelectedAccount(undefined)
    setIsDialogOpen(true)
  }

  // 계좌 편집
  const handleEdit = (account: Account) => {
    setDialogMode('edit')
    setSelectedAccount(account)
    setIsDialogOpen(true)
  }

  // 계좌 삭제
  const handleDelete = async (account: Account) => {
    try {
      // TODO: 실제 API 호출로 대체
      console.log('계좌 삭제:', account.id)

      setAccounts(prev => prev.filter(a => a.id !== account.id))
    } catch (error) {
      console.error('계좌 삭제 중 오류:', error)
    }
  }

  // 계좌 활성화 토글
  const handleToggleActive = async (account: Account) => {
    try {
      // TODO: 실제 API 호출로 대체
      console.log('계좌 상태 변경:', account.id, !account.isActive)

      setAccounts(prev =>
        prev.map(a => (a.id === account.id ? { ...a, isActive: !a.isActive } : a))
      )
    } catch (error) {
      console.error('계좌 상태 변경 중 오류:', error)
    }
  }

  // 계좌 저장 (생성/수정)
  const handleSave = async (data: CreateAccountData | UpdateAccountData) => {
    try {
      if (dialogMode === 'create') {
        // TODO: 실제 API 호출로 대체
        console.log('계좌 생성:', data)

        const newAccount: Account = {
          id: Date.now().toString(),
          name: data.name || '',
          type: data.type || 'BANK',
          currency: data.currency || 'KRW',
          balance: data.balance?.toString() || '0',
          isActive: true,
          ownerType: ('ownerType' in data ? data.ownerType : 'USER') || 'USER',
          ownerId: (('ownerId' in data ? data.ownerId : 1) || 1).toString(),
        }

        setAccounts(prev => [...prev, newAccount])
      } else {
        // TODO: 실제 API 호출로 대체
        console.log('계좌 수정:', selectedAccount?.id, data)

        setAccounts(prev =>
          prev.map(a =>
            a.id === selectedAccount?.id
              ? {
                  ...a,
                  name: data.name || a.name,
                  type: data.type || a.type,
                  currency: data.currency || a.currency,
                  balance: data.balance?.toString() || a.balance,
                }
              : a
          )
        )
      }
    } catch (error) {
      console.error('계좌 저장 중 오류:', error)
      throw error
    }
  }

  return (
    <div className='space-y-6'>
      {/* 페이지 헤더 */}
      <div>
        <h2 className='text-2xl font-bold text-text-900'>계좌 관리</h2>
        <p className='text-text-600 mt-1'>개인 및 그룹 계좌를 추가하고 관리할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-text-900'>
              {accounts.filter(a => a.isActive).length}
            </div>
            <div className='text-sm text-text-600'>활성 계좌</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-emerald-600'>
              {accounts
                .filter(a => a.isActive && parseInt(a.balance) > 0)
                .reduce((sum, a) => sum + parseInt(a.balance), 0)
                .toLocaleString()}
              원
            </div>
            <div className='text-sm text-text-600'>총 자산</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-red-600'>
              {Math.abs(
                accounts
                  .filter(a => a.isActive && parseInt(a.balance) < 0)
                  .reduce((sum, a) => sum + parseInt(a.balance), 0)
              ).toLocaleString()}
              원
            </div>
            <div className='text-sm text-text-600'>총 부채</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>계좌 목록</span>
            <Button onClick={handleCreate}>
              <Plus className='h-4 w-4 mr-2' />
              계좌 추가
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* 검색 */}
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='계좌명으로 검색...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            {/* 타입 필터 */}
            <Select
              value={filterType}
              onValueChange={(value: AccountType | 'ALL') => setFilterType(value)}
            >
              <SelectTrigger className='w-full sm:w-40'>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>모든 타입</SelectItem>
                {Object.entries(accountTypeLabels).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 상태 필터 */}
            <Select
              value={filterActive}
              onValueChange={(value: 'ALL' | 'ACTIVE' | 'INACTIVE') => setFilterActive(value)}
            >
              <SelectTrigger className='w-full sm:w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>전체</SelectItem>
                <SelectItem value='ACTIVE'>활성</SelectItem>
                <SelectItem value='INACTIVE'>비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 계좌 목록 */}
          <AccountList
            accounts={filteredAccounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* 계좌 추가/편집 Dialog */}
      <AccountDialog
        mode={dialogMode}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        account={selectedAccount}
        onSubmit={handleSave}
      />
    </div>
  )
}
