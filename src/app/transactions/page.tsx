'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Calendar,
  ArrowUpDown,
  Plus,
  Minus,
  Edit,
  Trash2,
  Download,
  RefreshCw,
} from 'lucide-react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Transaction } from '@/types/couple-ledger'
import { QuickAddModal } from '@/components/couple-ledger/QuickAddModal'
import { defaultCategories } from '@/components/couple-ledger/CategoryPicker'

interface TransactionFilters {
  search: string
  category: string
  type: 'all' | 'income' | 'expense'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  person: 'all' | 'me' | 'partner' | 'shared'
}

// 더미 거래 데이터
const dummyTransactions: Transaction[] = [
  {
    id: '1',
    amount: 15000,
    categoryId: '1',
    description: '점심 식사',
    date: new Date('2025-01-08'),
    type: 'expense',
    person: 'me',
    paymentMethod: 'card',
    createdAt: new Date('2025-01-08T12:30:00'),
    updatedAt: new Date('2025-01-08T12:30:00'),
  },
  {
    id: '2',
    amount: 50000,
    categoryId: '2',
    description: '지하철 정기권',
    date: new Date('2025-01-07'),
    type: 'expense',
    person: 'shared',
    paymentMethod: 'card',
    createdAt: new Date('2025-01-07T09:15:00'),
    updatedAt: new Date('2025-01-07T09:15:00'),
  },
  {
    id: '3',
    amount: 3500000,
    categoryId: '6',
    description: '월급',
    date: new Date('2025-01-05'),
    type: 'income',
    person: 'me',
    paymentMethod: 'bank',
    createdAt: new Date('2025-01-05T10:00:00'),
    updatedAt: new Date('2025-01-05T10:00:00'),
  },
  {
    id: '4',
    amount: 25000,
    categoryId: '3',
    description: '세제 구매',
    date: new Date('2025-01-04'),
    type: 'expense',
    person: 'partner',
    paymentMethod: 'cash',
    createdAt: new Date('2025-01-04T14:20:00'),
    updatedAt: new Date('2025-01-04T14:20:00'),
  },
  {
    id: '5',
    amount: 8500,
    categoryId: '4',
    description: '아메리카노',
    date: new Date('2025-01-03'),
    type: 'expense',
    person: 'me',
    paymentMethod: 'card',
    createdAt: new Date('2025-01-03T15:45:00'),
    updatedAt: new Date('2025-01-03T15:45:00'),
  },
]

/**
 * 거래내역 페이지
 *
 * 기능:
 * - 거래 목록 표시
 * - 검색 및 필터링
 * - 정렬 기능
 * - 거래 편집/삭제
 * - 데이터 내보내기
 */
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(dummyTransactions)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(dummyTransactions)
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    category: 'all',
    type: 'all',
    dateRange: 'month',
    person: 'all',
  })
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // 필터링 로직
  useEffect(() => {
    let filtered = [...transactions]

    // 검색 필터
    if (filters.search) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // 카테고리 필터
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.categoryId === filters.category)
    }

    // 타입 필터
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type)
    }

    // 사람 필터
    if (filters.person !== 'all') {
      filtered = filtered.filter(t => t.person === filters.person)
    }

    // 날짜 필터
    const now = new Date()
    if (filters.dateRange !== 'all') {
      const ranges = {
        today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getFullYear(), now.getMonth(), 1),
        year: new Date(now.getFullYear(), 0, 1),
      }

      const rangeStart = ranges[filters.dateRange as keyof typeof ranges]
      filtered = filtered.filter(t => t.date >= rangeStart)
    }

    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'category':
          comparison = a.categoryId.localeCompare(b.categoryId)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredTransactions(filtered)
  }, [transactions, filters, sortBy, sortOrder])

  // 필터 업데이트
  const updateFilter = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 정렬 변경
  const handleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // 거래 삭제
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  // 새 거래 저장
  const handleSaveTransaction = async (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setTransactions(prev => [newTransaction, ...prev])
    return Promise.resolve()
  }

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId: string) => {
    const category = defaultCategories.find(c => c.id === categoryId)
    return category?.name || '기타'
  }

  // 카테고리 색상 가져오기
  const getCategoryColor = (categoryId: string) => {
    const category = defaultCategories.find(c => c.id === categoryId)
    return category?.color || '#6B7280'
  }

  // 금액 포맷팅
  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const formatted = amount.toLocaleString('ko-KR')
    return type === 'income' ? `+${formatted}원` : `-${formatted}원`
  }

  // 사람 표시 이름
  const getPersonName = (person: 'me' | 'partner' | 'shared') => {
    switch (person) {
      case 'me':
        return '나'
      case 'partner':
        return '배우자'
      case 'shared':
        return '공동'
    }
  }

  return (
    <>
      <ResponsiveLayout onQuickAddClick={() => setIsQuickAddOpen(true)}>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          {/* 헤더 */}
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>거래내역</h1>
              <p className='text-gray-500'>모든 수입과 지출을 확인하세요</p>
            </div>

            <div className='flex gap-2'>
              <Button variant='outline' className='gap-2' onClick={() => setIsQuickAddOpen(true)}>
                <Plus className='h-4 w-4' />
                거래 추가
              </Button>
              <Button variant='outline' className='gap-2'>
                <Download className='h-4 w-4' />
                내보내기
              </Button>
              <Button variant='outline' className='gap-2'>
                <RefreshCw className='h-4 w-4' />
                새로고침
              </Button>
            </div>
          </div>

          {/* 필터 영역 */}
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Filter className='h-5 w-5' />
                필터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
                {/* 검색 */}
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='거래 검색...'
                    value={filters.search}
                    onChange={e => updateFilter('search', e.target.value)}
                    className='pl-10'
                  />
                </div>

                {/* 타입 필터 */}
                <select
                  value={filters.type}
                  onChange={e => updateFilter('type', e.target.value)}
                  className='px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm'
                >
                  <option value='all'>모든 거래</option>
                  <option value='income'>수입</option>
                  <option value='expense'>지출</option>
                </select>

                {/* 카테고리 필터 */}
                <select
                  value={filters.category}
                  onChange={e => updateFilter('category', e.target.value)}
                  className='px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm'
                >
                  <option value='all'>모든 카테고리</option>
                  {defaultCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* 기간 필터 */}
                <select
                  value={filters.dateRange}
                  onChange={e => updateFilter('dateRange', e.target.value)}
                  className='px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm'
                >
                  <option value='all'>전체 기간</option>
                  <option value='today'>오늘</option>
                  <option value='week'>지난 7일</option>
                  <option value='month'>이번 달</option>
                  <option value='year'>올해</option>
                </select>

                {/* 사람 필터 */}
                <select
                  value={filters.person}
                  onChange={e => updateFilter('person', e.target.value)}
                  className='px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm'
                >
                  <option value='all'>모든 사람</option>
                  <option value='me'>나</option>
                  <option value='partner'>배우자</option>
                  <option value='shared'>공동</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 거래 목록 */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>
                  거래 목록 ({filteredTransactions.length}건)
                </CardTitle>

                {/* 정렬 버튼 */}
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleSort('date')}
                    className='gap-1'
                  >
                    <Calendar className='h-4 w-4' />
                    날짜
                    <ArrowUpDown className='h-3 w-3' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleSort('amount')}
                    className='gap-1'
                  >
                    금액
                    <ArrowUpDown className='h-3 w-3' />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className='text-center py-12'>
                  <div className='text-gray-400 mb-2'>
                    <Search className='h-12 w-12 mx-auto mb-4' />
                    거래 내역이 없습니다
                  </div>
                  <p className='text-gray-500 mb-4'>필터를 조정하거나 새로운 거래를 추가해보세요</p>
                  <Button onClick={() => setIsQuickAddOpen(true)}>
                    <Plus className='h-4 w-4 mr-2' />첫 거래 추가하기
                  </Button>
                </div>
              ) : (
                <div className='space-y-2'>
                  {filteredTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className='flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors'
                    >
                      <div className='flex items-center gap-4 flex-1'>
                        {/* 카테고리 아이콘 */}
                        <div
                          className='w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold'
                          style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                        >
                          {getCategoryName(transaction.categoryId)[0]}
                        </div>

                        {/* 거래 정보 */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h3 className='font-medium text-gray-900 truncate'>
                              {transaction.description}
                            </h3>
                            <Badge
                              variant='secondary'
                              className='text-xs'
                              style={{
                                backgroundColor: getCategoryColor(transaction.categoryId) + '20',
                                color: getCategoryColor(transaction.categoryId),
                              }}
                            >
                              {getCategoryName(transaction.categoryId)}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-4 text-sm text-gray-500'>
                            <span>{transaction.date.toLocaleDateString('ko-KR')}</span>
                            <span>{getPersonName(transaction.person)}</span>
                            <span>
                              {transaction.paymentMethod === 'card'
                                ? '카드'
                                : transaction.paymentMethod === 'cash'
                                  ? '현금'
                                  : '계좌이체'}
                            </span>
                          </div>
                        </div>

                        {/* 금액 */}
                        <div className='text-right'>
                          <div
                            className={`text-lg font-bold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatAmount(transaction.amount, transaction.type)}
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className='flex items-center gap-1 ml-4'>
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ResponsiveLayout>

      {/* 빠른입력 모달 */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleSaveTransaction}
        categories={defaultCategories}
        templates={[]}
      />
    </>
  )
}
