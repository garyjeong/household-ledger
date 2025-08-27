'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Calendar, TrendingDown, TrendingUp, ArrowRightLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { useLedgerStore } from '@/stores/ledger-store'
import { fetchLegacyData, DataMapper, showUndoToast } from '@/lib/adapters/context-bridge'
import { TransactionType, QuickAddFormData } from '@/types/ledger'

// Form validation schema
const quickAddSchema = z.object({
  date: z.date().max(new Date(), '미래 날짜는 입력할 수 없습니다'),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'] as const, {
    message: '거래 타입을 선택해주세요',
  }),
  amount: z
    .string()
    .min(1, '금액을 입력해주세요')
    .regex(/^\d+$/, '숫자만 입력해주세요')
    .refine(val => parseInt(val) > 0, '금액은 0보다 커야 합니다')
    .refine(val => parseInt(val) <= 999999999, '금액이 너무 큽니다'),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  accountId: z.string().min(1, '계좌를 선택해주세요'),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해주세요').optional(),
})

type FormData = z.infer<typeof quickAddSchema>

interface QuickAddBarProps {
  className?: string
  position?: 'top' | 'bottom'
  autoFocus?: boolean
}

export function QuickAddBar({
  className = '',
  position = 'top',
  autoFocus = true,
}: QuickAddBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [dataMapper, setDataMapper] = useState<DataMapper | null>(null)
  const [accountSearch, setAccountSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const amountInputRef = useRef<HTMLInputElement>(null)
  const { addTransaction, isLoading, suggestCategory } = useLedgerStore()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      date: new Date(),
      type: 'EXPENSE',
      amount: '',
      categoryId: '',
      accountId: '',
      memo: '',
    },
  })

  const watchedType = watch('type')
  const watchedMemo = watch('memo')

  // Load accounts and categories
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchLegacyData()
      setAccounts(data.accounts.filter(acc => acc.isActive))
      setCategories(data.categories)
      setDataMapper(new DataMapper(data.accounts, data.categories))
    }
    loadData()
  }, [])

  // Auto-suggest category based on memo
  useEffect(() => {
    if (watchedMemo && watchedMemo.length > 2) {
      const suggestion = suggestCategory(watchedMemo)
      if (suggestion && suggestion.confidence > 0.7) {
        const category = categories.find(c => c.id === suggestion.categoryId)
        if (category) {
          setSuggestion(`"${category.name}" 카테고리로 자동 분류하시겠어요?`)
        }
      }
    } else {
      setSuggestion(null)
    }
  }, [watchedMemo, suggestCategory, categories])

  // Handle form submission
  const onSubmit = async (data: FormData, continueAdding = false) => {
    try {
      const formData: QuickAddFormData = {
        date: data.date,
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        accountId: data.accountId,
        memo: data.memo,
      }

      await addTransaction(formData)

      // Show success toast with undo option
      showUndoToast('거래 추가', () => {
        // Undo logic would be handled by the store
      })

      if (continueAdding) {
        // Reset form but keep type, category, account for faster entry
        setValue('amount', '')
        setValue('memo', '')
        if (amountInputRef.current) {
          amountInputRef.current.focus()
        }
      } else {
        reset()
        setIsExpanded(false)
      }
    } catch (error) {
      console.error('Transaction add error:', error)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && isValid) {
      e.preventDefault()
      handleSubmit(data => onSubmit(data, false))()
    } else if (e.key === 'Enter' && e.shiftKey && isValid) {
      e.preventDefault()
      handleSubmit(data => onSubmit(data, true))()
    } else if (e.key === 'Escape') {
      setIsExpanded(false)
      reset()
    }
  }

  // Format amount with thousand separators
  const formatAmount = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const filteredAccounts = accounts.filter(acc =>
    acc.name.toLowerCase().includes(accountSearch.toLowerCase())
  )

  const filteredCategories = categories.filter(cat => {
    const typeMatch = cat.type === watchedType
    const searchMatch = cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    return typeMatch && searchMatch
  })

  const typeIcons = {
    EXPENSE: <TrendingDown className='h-4 w-4 text-red-600' />,
    INCOME: <TrendingUp className='h-4 w-4 text-blue-600' />,
    TRANSFER: <ArrowRightLeft className='h-4 w-4 text-purple-600' />,
  }

  const positionClasses = position === 'top' ? 'top-0 sticky z-50' : 'bottom-0 fixed z-50'

  return (
    <div
      className={`${positionClasses} left-0 right-0 bg-white border-b border-stroke-200 shadow-sm ${className}`}
    >
      <div className='max-w-4xl mx-auto p-4'>
        {!isExpanded ? (
          // Collapsed state - Simple input trigger
          <div
            className='flex items-center gap-2 p-3 bg-surface-page rounded-lg border border-stroke-200 cursor-text hover:border-brand-600 transition-colors'
            onClick={() => setIsExpanded(true)}
          >
            <Plus className='h-5 w-5 text-brand-600' />
            <span className='text-text-700 select-none'>
              거래를 빠르게 추가하세요... (금액, 메모, 카테고리)
            </span>
            <div className='ml-auto flex items-center gap-1 text-xs text-text-500'>
              <kbd className='px-2 py-1 bg-gray-100 rounded text-xs'>Enter</kbd>
              <span>저장</span>
            </div>
          </div>
        ) : (
          // Expanded state - Full form
          <form onSubmit={handleSubmit(data => onSubmit(data, false))} onKeyDown={handleKeyDown}>
            <div className='space-y-4'>
              {/* Main input row */}
              <div className='flex items-center gap-2 flex-wrap'>
                {/* Date */}
                <Controller
                  control={control}
                  name='date'
                  render={({ field }) => (
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-4 w-4 text-text-500' />
                      <Input
                        type='date'
                        value={format(field.value, 'yyyy-MM-dd')}
                        onChange={e => field.onChange(new Date(e.target.value))}
                        className='w-auto text-sm'
                      />
                    </div>
                  )}
                />

                {/* Type selector */}
                <Controller
                  control={control}
                  name='type'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <div className='flex items-center gap-1'>
                        {typeIcons[field.value]}
                        <SelectTrigger className='w-auto text-sm'>
                          {field.value === 'EXPENSE' && '지출'}
                          {field.value === 'INCOME' && '수입'}
                          {field.value === 'TRANSFER' && '이체'}
                        </SelectTrigger>
                      </div>
                      <SelectContent>
                        <SelectItem value='EXPENSE'>
                          <TrendingDown className='h-4 w-4 text-red-600 mr-2' />
                          지출
                        </SelectItem>
                        <SelectItem value='INCOME'>
                          <TrendingUp className='h-4 w-4 text-blue-600 mr-2' />
                          수입
                        </SelectItem>
                        <SelectItem value='TRANSFER'>
                          <ArrowRightLeft className='h-4 w-4 text-purple-600 mr-2' />
                          이체
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {/* Amount */}
                <Controller
                  control={control}
                  name='amount'
                  render={({ field }) => (
                    <div className='flex items-center'>
                      <Input
                        ref={amountInputRef}
                        placeholder='금액'
                        value={formatAmount(field.value)}
                        onChange={e => {
                          const rawValue = e.target.value.replace(/[^\d]/g, '')
                          field.onChange(rawValue)
                        }}
                        inputMode='numeric'
                        className='w-32 text-right'
                        autoFocus={autoFocus}
                      />
                      <span className='ml-1 text-sm text-text-500'>원</span>
                    </div>
                  )}
                />

                {/* Category selector with search */}
                <Controller
                  control={control}
                  name='categoryId'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className='w-40'>
                        <Search className='h-4 w-4 mr-2' />
                        {field.value
                          ? categories.find(c => c.id === field.value)?.name
                          : '카테고리'}
                      </SelectTrigger>
                      <SelectContent>
                        <div className='p-2'>
                          <Input
                            placeholder='카테고리 검색...'
                            value={categorySearch}
                            onChange={e => setCategorySearch(e.target.value)}
                            className='text-sm'
                          />
                        </div>
                        {filteredCategories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className='flex items-center gap-2'>
                              {category.color && (
                                <div
                                  className='w-3 h-3 rounded-full'
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              {category.name}
                              {category.isDefault && (
                                <span className='text-xs text-text-500'>기본</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                {/* Account selector with search */}
                <Controller
                  control={control}
                  name='accountId'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className='w-32'>
                        {field.value ? accounts.find(a => a.id === field.value)?.name : '계좌'}
                      </SelectTrigger>
                      <SelectContent>
                        <div className='p-2'>
                          <Input
                            placeholder='계좌 검색...'
                            value={accountSearch}
                            onChange={e => setAccountSearch(e.target.value)}
                            className='text-sm'
                          />
                        </div>
                        {filteredAccounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className='flex items-center justify-between w-full'>
                              <span>{account.name}</span>
                              <span className='text-xs text-text-500 ml-2'>{account.type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Memo input */}
              <Controller
                control={control}
                name='memo'
                render={({ field }) => (
                  <div className='relative'>
                    <Input
                      placeholder='메모 (선택사항)'
                      value={field.value || ''}
                      onChange={field.onChange}
                      className='pr-20'
                    />
                    {suggestion && (
                      <div className='absolute right-2 top-1/2 -translate-y-1/2'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='text-xs text-brand-600 hover:text-brand-700'
                          onClick={() => {
                            // Apply suggestion logic here
                            setSuggestion(null)
                          }}
                        >
                          자동분류
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              />

              {/* Action buttons */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setIsExpanded(false)
                      reset()
                    }}
                  >
                    취소
                  </Button>

                  {Object.keys(errors).length > 0 && (
                    <div className='text-sm text-red-600'>{Object.values(errors)[0]?.message}</div>
                  )}
                </div>

                <div className='flex items-center gap-2'>
                  <div className='text-xs text-text-500'>
                    <kbd className='px-2 py-1 bg-gray-100 rounded'>Enter</kbd> 저장 ·
                    <kbd className='px-2 py-1 bg-gray-100 rounded ml-1'>Shift+Enter</kbd> 저장 후
                    계속
                  </div>

                  <Button type='submit' disabled={!isValid || isLoading} size='sm'>
                    {isLoading ? '저장중...' : '저장'}
                  </Button>

                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!isValid || isLoading}
                    onClick={handleSubmit(data => onSubmit(data, true))}
                  >
                    저장 후 계속
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {suggestion && (
        <div className='bg-blue-50 border-t border-blue-200 px-4 py-2'>
          <div className='max-w-4xl mx-auto flex items-center justify-between'>
            <span className='text-sm text-blue-800'>{suggestion}</span>
            <div className='flex gap-2'>
              <Button variant='ghost' size='sm' onClick={() => setSuggestion(null)}>
                무시
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  // Apply auto-classification
                  setSuggestion(null)
                }}
              >
                적용
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
