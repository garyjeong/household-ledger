'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createAccountSchema,
  updateAccountSchema,
  type CreateAccountData,
  type UpdateAccountData,
} from '@/lib/schemas/account'
import {
  accountTypeLabels,
  accountTypeIcons,
  formatNumberInput,
  parseNumberInput,
  type AccountType,
} from '@/lib/utils/account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 폼 데이터 타입 (UI용)
// type AccountFormData = {
//   name: string
//   type: AccountType
//   currency: string
//   balance: string // UI에서는 문자열로 처리
//   ownerType: 'USER' | 'GROUP'
//   ownerId: number
// }

interface AccountFormProps {
  mode: 'create' | 'edit'
  initialData?: {
    id?: string
    name: string
    type: AccountType
    currency: string
    balance: string
    ownerType: 'USER' | 'GROUP'
    ownerId: string
    isActive: boolean
  }
  onSubmit: (data: CreateAccountData | UpdateAccountData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function AccountForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AccountFormProps) {
  const [balanceInput, setBalanceInput] = useState(
    initialData?.balance ? formatNumberInput(initialData.balance) : '0'
  )

  // 스키마 선택
  const schema = mode === 'create' ? createAccountSchema : updateAccountSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'CASH',
      currency: initialData?.currency || 'KRW',
      balance: parseInt(initialData?.balance || '0'),
      ownerType: initialData?.ownerType || 'USER',
      ownerId: initialData?.ownerId ? parseInt(initialData.ownerId) : 1, // TODO: 실제 사용자 ID
    },
  })

  const selectedType = watch('type')

  // 잔액 입력 처리
  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value)
    setBalanceInput(formatted)

    const numericValue = parseNumberInput(formatted)
    setValue('balance', numericValue)
  }

  // 폼 제출 처리
  const onFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const submitData = {
        ...data,
        balance: parseNumberInput(balanceInput),
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('계좌 저장 중 오류:', error)
    }
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>{mode === 'create' ? '새 계좌 추가' : '계좌 정보 수정'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-4'>
          {/* 계좌명 */}
          <div className='space-y-2'>
            <Label htmlFor='name'>계좌명</Label>
            <Input
              id='name'
              placeholder='예: 신한은행 주거래'
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && <p className='text-sm text-red-600'>{errors.name.message}</p>}
          </div>

          {/* 계좌 타입 */}
          <div className='space-y-2'>
            <Label>계좌 타입</Label>
            <div className='grid grid-cols-2 gap-2'>
              {Object.entries(accountTypeLabels).map(([type, label]) => {
                const Icon = accountTypeIcons[type as AccountType]
                const isSelected = selectedType === type

                return (
                  <label
                    key={type}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
                      ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type='radio'
                      value={type}
                      {...register('type')}
                      className='sr-only'
                      disabled={isLoading}
                    />
                    <Icon
                      className={`h-4 w-4 ${isSelected ? 'text-brand-600' : 'text-gray-500'}`}
                    />
                    <span className='text-sm font-medium'>{label}</span>
                  </label>
                )
              })}
            </div>
            {errors.type && <p className='text-sm text-red-600'>{errors.type.message}</p>}
          </div>

          {/* 통화 */}
          <div className='space-y-2'>
            <Label htmlFor='currency'>통화</Label>
            <Input
              id='currency'
              {...register('currency')}
              disabled={isLoading}
              readOnly
              className='bg-gray-50'
            />
            {errors.currency && <p className='text-sm text-red-600'>{errors.currency.message}</p>}
          </div>

          {/* 초기 잔액 */}
          <div className='space-y-2'>
            <Label htmlFor='balance'>{mode === 'create' ? '초기 잔액' : '현재 잔액'}</Label>
            <div className='relative'>
              <Input
                id='balance'
                value={balanceInput}
                onChange={handleBalanceChange}
                placeholder='0'
                disabled={isLoading}
                className='pr-8'
              />
              <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500'>
                원
              </span>
            </div>
            {errors.balance && <p className='text-sm text-red-600'>{errors.balance.message}</p>}
          </div>

          {/* 숨겨진 필드들 */}
          <input type='hidden' {...register('ownerType')} />
          <input type='hidden' {...register('ownerId')} />

          {/* 버튼 */}
          <div className='flex gap-2 pt-4'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isLoading}
                className='flex-1'
              >
                취소
              </Button>
            )}
            <Button type='submit' disabled={isLoading} className='flex-1'>
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                  {mode === 'create' ? '추가 중...' : '수정 중...'}
                </>
              ) : mode === 'create' ? (
                '계좌 추가'
              ) : (
                '수정 완료'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
