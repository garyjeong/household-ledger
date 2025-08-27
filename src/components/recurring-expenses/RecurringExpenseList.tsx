'use client'

import { useState } from 'react'
import {
  Clock,
  Calendar,
  DollarSign,
  Building,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Filter,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export interface RecurringExpense {
  id: string
  startDate: string
  frequency: 'MONTHLY' | 'WEEKLY'
  dayRule: string
  amount: number
  accountId: string
  categoryId?: string
  merchant?: string
  memo?: string
  isActive: boolean
  account?: {
    id: string
    name: string
    type: string
  }
  category?: {
    id: string
    name: string
    color?: string
    type: string
  }
}

interface RecurringExpenseListProps {
  expenses: RecurringExpense[]
  isLoading?: boolean
  onEdit: (expense: RecurringExpense) => void
  onDelete: (expenseId: string) => void
  onToggleActive: (expenseId: string, isActive: boolean) => void
}

// 반복 주기 라벨
const frequencyLabels = {
  MONTHLY: '매월',
  WEEKLY: '매주',
}

// 날짜 규칙 라벨 변환
const formatDayRule = (dayRule: string, frequency: string): string => {
  if (frequency === 'MONTHLY') {
    const day = dayRule.replace('D', '')
    return `${day}일`
  } else {
    const dayLabels: { [key: string]: string } = {
      MON: '월요일',
      TUE: '화요일',
      WED: '수요일',
      THU: '목요일',
      FRI: '금요일',
      SAT: '토요일',
      SUN: '일요일',
    }
    return dayLabels[dayRule] || dayRule
  }
}

export function RecurringExpenseList({
  expenses,
  isLoading = false,
  onEdit,
  onDelete,
  onToggleActive,
}: RecurringExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFrequency, setFilterFrequency] = useState<'ALL' | 'MONTHLY' | 'WEEKLY'>('ALL')
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // 필터링된 고정 지출 목록
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch =
      expense.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.memo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.account?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFrequency = filterFrequency === 'ALL' || expense.frequency === filterFrequency

    const matchesActive =
      filterActive === 'ALL' ||
      (filterActive === 'ACTIVE' && expense.isActive) ||
      (filterActive === 'INACTIVE' && !expense.isActive)

    return matchesSearch && matchesFrequency && matchesActive
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='space-y-4'>
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

  return (
    <div className='space-y-4'>
      {/* 검색 및 필터 */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* 검색 */}
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='상점명, 메모, 계좌, 카테고리로 검색...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            {/* 필터 */}
            <div className='flex gap-2'>
              <Select
                value={filterFrequency}
                onValueChange={(value: any) => setFilterFrequency(value)}
              >
                <SelectTrigger className='w-32'>
                  <Filter className='h-4 w-4 mr-2' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>모든 주기</SelectItem>
                  <SelectItem value='MONTHLY'>매월</SelectItem>
                  <SelectItem value='WEEKLY'>매주</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterActive} onValueChange={(value: any) => setFilterActive(value)}>
                <SelectTrigger className='w-32'>
                  <Filter className='h-4 w-4 mr-2' />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>모든 상태</SelectItem>
                  <SelectItem value='ACTIVE'>활성</SelectItem>
                  <SelectItem value='INACTIVE'>비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 고정 지출 목록 */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <Clock className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {expenses.length === 0 ? '등록된 고정 지출이 없습니다' : '검색 결과가 없습니다'}
            </h3>
            <p className='text-gray-600'>
              {expenses.length === 0
                ? '새로운 고정 지출을 추가해보세요'
                : '다른 검색어나 필터를 시도해보세요'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {filteredExpenses.map(expense => (
            <Card key={expense.id} className={!expense.isActive ? 'opacity-60' : ''}>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    {/* 첫 번째 줄: 기본 정보 */}
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4 text-gray-500' />
                        <Badge variant={expense.frequency === 'MONTHLY' ? 'default' : 'secondary'}>
                          {frequencyLabels[expense.frequency]}{' '}
                          {formatDayRule(expense.dayRule, expense.frequency)}
                        </Badge>
                      </div>

                      <div className='flex items-center gap-2 font-medium'>
                        <DollarSign className='h-4 w-4 text-green-600' />
                        <span className='text-lg font-semibold'>
                          {expense.amount.toLocaleString()}원
                        </span>
                      </div>

                      <div className='flex items-center gap-1'>
                        {expense.isActive ? (
                          <ToggleRight className='h-4 w-4 text-green-600' />
                        ) : (
                          <ToggleLeft className='h-4 w-4 text-gray-400' />
                        )}
                        <span
                          className={`text-xs ${expense.isActive ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {expense.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>

                    {/* 두 번째 줄: 상세 정보 */}
                    <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                      {expense.merchant && (
                        <div className='flex items-center gap-1'>
                          <Building className='h-3 w-3' />
                          <span>{expense.merchant}</span>
                        </div>
                      )}

                      {expense.account && (
                        <div className='flex items-center gap-1'>
                          <Building className='h-3 w-3' />
                          <span>{expense.account.name}</span>
                        </div>
                      )}

                      {expense.category && (
                        <div className='flex items-center gap-1'>
                          <Tag className='h-3 w-3' />
                          <div className='flex items-center gap-1'>
                            {expense.category.color && (
                              <div
                                className='w-2 h-2 rounded-full'
                                style={{ backgroundColor: expense.category.color }}
                              />
                            )}
                            <span>{expense.category.name}</span>
                          </div>
                        </div>
                      )}

                      <div className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        <span>시작: {new Date(expense.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* 세 번째 줄: 메모 */}
                    {expense.memo && (
                      <div className='mt-2 text-sm text-gray-600 bg-gray-50 rounded px-2 py-1'>
                        {expense.memo}
                      </div>
                    )}
                  </div>

                  {/* 액션 메뉴 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Edit className='h-4 w-4 mr-2' />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onToggleActive(expense.id, !expense.isActive)}
                      >
                        {expense.isActive ? (
                          <>
                            <ToggleLeft className='h-4 w-4 mr-2' />
                            비활성화
                          </>
                        ) : (
                          <>
                            <ToggleRight className='h-4 w-4 mr-2' />
                            활성화
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(expense.id)}
                        className='text-red-600'
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 결과 요약 */}
      {filteredExpenses.length > 0 && (
        <div className='text-center text-sm text-gray-600'>
          총 {filteredExpenses.length}개의 고정 지출
          {searchQuery && ` (검색: "${searchQuery}")`}
        </div>
      )}
    </div>
  )
}
