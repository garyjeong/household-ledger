/**
 * Enhanced Transaction Form with React Hook Form + Zod
 * T-019 요구사항에 맞는 거래 입력 폼
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Calendar,
  DollarSign,
  Tag,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Globe,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCurrencyConverter, useExchangeRates } from '@/hooks/use-exchange-rates'
import { SUPPORTED_CURRENCIES, formatCurrency } from '@/lib/currency-api'
import { useAlert } from '@/contexts/alert-context'

// Zod 스키마 정의
const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z
    .number()
    .positive('금액은 0보다 커야 합니다')
    .max(999999999, '금액이 너무 큽니다'),
  currency: z.string().min(3, '통화를 선택해주세요').max(3),
  convertedAmount: z.number().optional(),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  description: z
    .string()
    .min(1, '거래 내용을 입력해주세요')
    .max(100, '거래 내용은 100자 이하로 입력해주세요'),
  memo: z.string().max(500, '메모는 500자 이하로 입력해주세요').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  tags: z.array(z.string()).optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionFormData) => Promise<void>
  initialData?: Partial<TransactionFormData>
  categories: Array<{
    id: string
    name: string
    type: string
    color?: string | null
  }>
  isEdit?: boolean
}

interface CurrencyDisplayProps {
  amount: number
  fromCurrency: string
  toCurrency: string
  convertedAmount?: number | null
}

// 통화 변환 표시 컴포넌트
function CurrencyDisplay({
  amount,
  fromCurrency,
  toCurrency,
  convertedAmount,
}: CurrencyDisplayProps) {
  if (fromCurrency === toCurrency || !convertedAmount) {
    return <div className='text-sm text-gray-600'>{formatCurrency(amount, fromCurrency)}</div>
  }

  return (
    <div className='space-y-1'>
      <div className='text-sm font-medium'>{formatCurrency(amount, fromCurrency)}</div>
      <div className='text-xs text-gray-500 flex items-center gap-1'>
        <Globe className='h-3 w-3' />≈ {formatCurrency(convertedAmount, toCurrency)}
      </div>
    </div>
  )
}

export function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  isEdit = false,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const { showSuccess, showError } = useAlert()

  // 환율 관련 hooks
  const { convert, isLoading: ratesLoading, error: ratesError } = useCurrencyConverter()
  const { refetch: refreshRates } = useExchangeRates()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      currency: 'KRW',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      ...initialData,
    },
    mode: 'onChange',
  })

  // 폼 필드 감시
  const watchedValues = watch(['amount', 'currency', 'type'])
  const [amount, currency, type] = watchedValues

  // 환율 변환 계산
  useEffect(() => {
    if (amount && currency && currency !== 'KRW') {
      const convertedAmount = convert(amount, currency, 'KRW')
      if (convertedAmount) {
        setValue('convertedAmount', convertedAmount)
      }
    } else {
      setValue('convertedAmount', undefined)
    }
  }, [amount, currency, convert, setValue])

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        type: 'EXPENSE',
        currency: 'KRW',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        ...initialData,
      })
    }
  }, [initialData, isOpen, reset])

  // 폼 제출 처리
  const handleFormSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      showSuccess(isEdit ? '거래가 수정되었습니다' : '거래가 추가되었습니다')
      reset()
      onClose()
    } catch (error) {
      console.error('Transaction submit error:', error)
      showError(isEdit ? '거래 수정에 실패했습니다' : '거래 추가에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 태그 추가
  const handleAddTag = () => {
    if (!tagInput.trim()) return

    const currentTags = watch('tags') || []
    if (!currentTags.includes(tagInput.trim())) {
      setValue('tags', [...currentTags, tagInput.trim()])
      setTagInput('')
    }
  }

  // 태그 제거
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = watch('tags') || []
    setValue(
      'tags',
      currentTags.filter(tag => tag !== tagToRemove)
    )
  }

  // 환율 새로고침
  const handleRefreshRates = async () => {
    try {
      await refreshRates()
      showSuccess('환율 정보가 업데이트되었습니다')
    } catch (error) {
      showError('환율 정보 업데이트에 실패했습니다')
    }
  }

  // 유형별 카테고리 필터링
  const filteredCategories = categories.filter(cat => cat.type === type || cat.type === 'TRANSFER')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            {isEdit ? '거래 수정' : '새 거래 추가'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '거래 정보를 수정하세요' : '새로운 수입 또는 지출을 기록하세요'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
          {/* 거래 타입 */}
          <div className='space-y-2'>
            <Label htmlFor='type'>거래 타입 *</Label>
            <Controller
              name='type'
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder='거래 타입을 선택하세요' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='EXPENSE'>지출</SelectItem>
                    <SelectItem value='INCOME'>수입</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className='text-sm text-red-600 flex items-center gap-1'>
                <AlertCircle className='h-4 w-4' />
                {errors.type.message}
              </p>
            )}
          </div>

          {/* 금액 및 통화 */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='amount'>금액 *</Label>
              <Controller
                name='amount'
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type='number'
                    placeholder='0'
                    onChange={e => field.onChange(Number(e.target.value))}
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                )}
              />
              {errors.amount && <p className='text-sm text-red-600'>{errors.amount.message}</p>}
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Label htmlFor='currency'>통화 *</Label>
                {currency !== 'KRW' && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleRefreshRates}
                    className='h-6 px-2'
                    disabled={ratesLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${ratesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
              <Controller
                name='currency'
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>
                          <div className='flex items-center gap-2'>
                            <span>{curr.symbol}</span>
                            <span>{curr.code}</span>
                            <span className='text-xs text-gray-500'>{curr.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.currency && <p className='text-sm text-red-600'>{errors.currency.message}</p>}
            </div>
          </div>

          {/* 환율 변환 표시 */}
          {amount && currency && (
            <Card className='bg-gray-50'>
              <CardContent className='p-3'>
                <CurrencyDisplay
                  amount={amount}
                  fromCurrency={currency}
                  toCurrency='KRW'
                  convertedAmount={watch('convertedAmount')}
                />
                {ratesError && (
                  <p className='text-xs text-red-600 mt-1'>환율 정보를 불러올 수 없습니다</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 카테고리 */}
          <div className='space-y-2'>
            <Label htmlFor='categoryId'>카테고리 *</Label>
            <Controller
              name='categoryId'
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder='카테고리를 선택하세요' />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className='flex items-center gap-2'>
                          {category.color && (
                            <div
                              className='w-3 h-3 rounded-full'
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className='text-sm text-red-600'>{errors.categoryId.message}</p>
            )}
          </div>

          {/* 거래 내용 */}
          <div className='space-y-2'>
            <Label htmlFor='description'>거래 내용 *</Label>
            <Controller
              name='description'
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder='거래 내용을 입력하세요'
                  className={errors.description ? 'border-red-500' : ''}
                />
              )}
            />
            {errors.description && (
              <p className='text-sm text-red-600'>{errors.description.message}</p>
            )}
          </div>

          {/* 날짜 */}
          <div className='space-y-2'>
            <Label htmlFor='date' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              거래 날짜 *
            </Label>
            <Controller
              name='date'
              control={control}
              render={({ field }) => (
                <Input {...field} type='date' className={errors.date ? 'border-red-500' : ''} />
              )}
            />
            {errors.date && <p className='text-sm text-red-600'>{errors.date.message}</p>}
          </div>

          {/* 메모 */}
          <div className='space-y-2'>
            <Label htmlFor='memo'>메모 (선택사항)</Label>
            <Controller
              name='memo'
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder='메모를 입력하세요...'
                  className='h-20 resize-none'
                />
              )}
            />
            {errors.memo && <p className='text-sm text-red-600'>{errors.memo.message}</p>}
          </div>

          {/* 태그 */}
          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Tag className='h-4 w-4' />
              태그 (선택사항)
            </Label>
            <div className='flex gap-2'>
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder='태그 입력 후 Enter'
                className='flex-1'
              />
              <Button
                type='button'
                variant='outline'
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                추가
              </Button>
            </div>

            {/* 태그 목록 */}
            {watch('tags') && watch('tags')!.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {watch('tags')!.map(tag => (
                  <Badge
                    key={tag}
                    variant='secondary'
                    className='cursor-pointer hover:bg-gray-200'
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              취소
            </Button>
            <Button type='submit' disabled={!isValid || isSubmitting} className='min-w-24'>
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  {isEdit ? '수정' : '추가'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
