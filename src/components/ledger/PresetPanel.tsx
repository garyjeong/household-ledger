'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Edit3,
  Trash2,
  Star,
  Zap,
  Settings,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Copy,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { useLedgerStore } from '@/stores/ledger-store'
import { fetchLegacyData, showUndoToast } from '@/lib/adapters/context-bridge'
import { Preset, TransactionType } from '@/types/ledger'
import { formatAmount } from '@/lib/schemas/transaction'

// Preset form validation schema
const presetSchema = z.object({
  name: z.string().min(1, '프리셋 이름을 입력해주세요').max(50, '이름은 50자 이하로 입력해주세요'),
  emoji: z.string().min(1, '이모지를 선택해주세요').max(5, '이모지는 5자 이하로 입력해주세요'),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'] as const),
  amount: z.string().min(1, '금액을 입력해주세요').regex(/^\d+$/, '숫자만 입력해주세요'),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  accountId: z.string().min(1, '계좌를 선택해주세요'),
  shortcut: z.number().int().min(1).max(9).optional(),
})

type PresetFormData = z.infer<typeof presetSchema>

interface PresetPanelProps {
  className?: string
  onApplyPreset?: (presetData: any) => void
  compact?: boolean
}

export function PresetPanel({ className = '', onApplyPreset, compact = false }: PresetPanelProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState<TransactionType>('EXPENSE')

  const { presets, addPreset, deletePreset, applyPreset, addTransaction, undoLastAction } =
    useLedgerStore()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<PresetFormData>({
    resolver: zodResolver(presetSchema),
    defaultValues: {
      name: '',
      emoji: '💰',
      type: 'EXPENSE',
      amount: '',
      categoryId: '',
      accountId: '',
    },
  })

  const watchedType = watch('type')

  // Load accounts and categories
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchLegacyData()
      setAccounts(data.accounts.filter(acc => acc.isActive))
      setCategories(data.categories)
    }
    loadData()
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = parseInt(e.key)
      if (key >= 1 && key <= 9) {
        const preset = presets.find(p => p.shortcut === key)
        if (preset) {
          e.preventDefault()
          handleApplyPreset(preset)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [presets])

  const handleApplyPreset = async (preset: Preset) => {
    const presetData = applyPreset(preset.id)
    if (presetData) {
      if (onApplyPreset) {
        // Pass data to parent component (QuickAddBar)
        onApplyPreset(presetData)
      } else {
        // Apply directly as a new transaction
        await addTransaction(presetData)
        showUndoToast('프리셋 적용', () => undoLastAction())
      }
    }
  }

  const handleSavePreset = async (data: PresetFormData) => {
    try {
      if (editingPreset) {
        // Update existing preset
        deletePreset(editingPreset.id)
      }

      addPreset({
        ...data,
        amount: parseInt(data.amount, 10),
      })

      reset()
      setShowDialog(false)
      setEditingPreset(null)
      showUndoToast(editingPreset ? '프리셋 수정' : '프리셋 추가', () => undoLastAction())
    } catch (error) {
      console.error('Preset save error:', error)
    }
  }

  const handleEditPreset = (preset: Preset) => {
    setEditingPreset(preset)
    reset({
      name: preset.name,
      emoji: preset.emoji,
      type: preset.type,
      amount: preset.amount.toString(),
      categoryId: preset.categoryId,
      accountId: preset.accountId,
      shortcut: preset.shortcut,
    })
    setShowDialog(true)
  }

  const handleDeletePreset = (preset: Preset) => {
    deletePreset(preset.id)
    showUndoToast('프리셋 삭제', () => undoLastAction())
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingPreset(null)
    reset()
  }

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'EXPENSE':
        return <TrendingDown className='h-3 w-3 text-red-600' />
      case 'INCOME':
        return <TrendingUp className='h-3 w-3 text-blue-600' />
      case 'TRANSFER':
        return <ArrowRightLeft className='h-3 w-3 text-purple-600' />
    }
  }

  const filteredCategories = categories.filter(cat => cat.type === watchedType)

  const popularEmojis = [
    '💰',
    '🍚',
    '☕',
    '🚌',
    '🏠',
    '📱',
    '⛽',
    '💊',
    '👕',
    '🎬',
    '🛒',
    '🍺',
    '📚',
    '💄',
    '🎮',
    '🏋️',
    '🚗',
    '✈️',
    '🏥',
    '🎵',
  ]

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className='flex items-center gap-2 mb-3'>
          <Star className='h-4 w-4 text-brand-600' />
          <span className='font-medium text-sm text-text-900'>빠른 입력</span>
          <Button variant='ghost' size='sm' onClick={() => setShowDialog(true)}>
            <Plus className='h-3 w-3' />
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          {presets.slice(0, 4).map(preset => (
            <Button
              key={preset.id}
              variant='outline'
              size='sm'
              className='h-auto p-2 justify-start text-left'
              onClick={() => handleApplyPreset(preset)}
            >
              <div className='flex items-center gap-2 min-w-0'>
                <span className='text-base'>{preset.emoji}</span>
                <div className='min-w-0 flex-1'>
                  <div className='text-xs font-medium truncate'>{preset.name}</div>
                  <div className='text-xs text-text-500'>{formatAmount(preset.amount)}</div>
                </div>
                {preset.shortcut && (
                  <Badge
                    variant='outline'
                    className='text-xs h-5 w-5 p-0 flex items-center justify-center'
                  >
                    {preset.shortcut}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>

        {presets.length === 0 && (
          <div className='text-center py-4 text-sm text-text-500'>
            자주 사용하는 거래를 프리셋으로 저장하세요
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Zap className='h-5 w-5 text-brand-600' />
              프리셋
            </CardTitle>
            <Button variant='outline' size='sm' onClick={() => setShowDialog(true)}>
              <Plus className='h-4 w-4 mr-1' />
              추가
            </Button>
          </div>

          {presets.length > 0 && (
            <p className='text-sm text-text-600'>숫자키 1-9로 빠른 적용 가능</p>
          )}
        </CardHeader>

        <CardContent>
          {presets.length === 0 ? (
            <div className='text-center py-8 space-y-3'>
              <div className='h-12 w-12 bg-surface-page rounded-full flex items-center justify-center mx-auto'>
                <Star className='h-6 w-6 text-text-400' />
              </div>
              <div>
                <h3 className='font-medium text-text-900'>프리셋이 없습니다</h3>
                <p className='text-sm text-text-600 mt-1'>
                  자주 사용하는 거래를 프리셋으로 저장해보세요
                </p>
              </div>
            </div>
          ) : (
            <div className='grid gap-3'>
              {presets.map(preset => (
                <div
                  key={preset.id}
                  className='flex items-center gap-3 p-3 rounded-lg border border-stroke-200 hover:border-brand-300 transition-colors group'
                >
                  {/* Preset info */}
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <div className='text-2xl'>{preset.emoji}</div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h4 className='font-medium text-text-900 truncate'>{preset.name}</h4>
                        {getTypeIcon(preset.type)}
                      </div>

                      <div className='flex items-center gap-2 text-sm text-text-600'>
                        <span className='font-semibold text-brand-600'>
                          {formatAmount(preset.amount)}
                        </span>
                        <span>·</span>
                        <span className='truncate'>
                          {categories.find(c => c.id === preset.categoryId)?.name}
                        </span>
                        <span>·</span>
                        <span className='truncate'>
                          {accounts.find(a => a.id === preset.accountId)?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shortcut badge */}
                  {preset.shortcut && (
                    <Badge
                      variant='outline'
                      className='h-6 w-6 p-0 flex items-center justify-center text-xs font-medium'
                    >
                      {preset.shortcut}
                    </Badge>
                  )}

                  {/* Action buttons */}
                  <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleApplyPreset(preset)}
                      className='h-8 w-8 p-0'
                      title='프리셋 적용'
                    >
                      <Copy className='h-3 w-3' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleEditPreset(preset)}
                      className='h-8 w-8 p-0'
                      title='편집'
                    >
                      <Edit3 className='h-3 w-3' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDeletePreset(preset)}
                      className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                      title='삭제'
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </div>

                  {/* Apply button */}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleApplyPreset(preset)}
                    className='ml-2'
                  >
                    적용
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{editingPreset ? '프리셋 수정' : '새 프리셋 추가'}</DialogTitle>
            <DialogDescription>
              자주 사용하는 거래를 프리셋으로 저장하여 빠르게 입력할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleSavePreset)} className='space-y-4'>
            {/* Name and Emoji */}
            <div className='grid grid-cols-4 gap-3'>
              <div className='col-span-3'>
                <Label htmlFor='name'>프리셋 이름</Label>
                <Controller
                  control={control}
                  name='name'
                  render={({ field }) => (
                    <div className='space-y-1'>
                      <Input id='name' placeholder='예: 커피, 점심, 교통비' {...field} />
                      {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
                    </div>
                  )}
                />
              </div>

              <div>
                <Label htmlFor='emoji'>이모지</Label>
                <Controller
                  control={control}
                  name='emoji'
                  render={({ field }) => (
                    <div className='space-y-2'>
                      <Input id='emoji' className='text-center text-lg' maxLength={5} {...field} />
                      <div className='grid grid-cols-5 gap-1'>
                        {popularEmojis.slice(0, 10).map(emoji => (
                          <Button
                            key={emoji}
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 text-base hover:bg-brand-50'
                            onClick={() => field.onChange(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Type and Amount */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label htmlFor='type'>거래 타입</Label>
                <Controller
                  control={control}
                  name='type'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <div className='flex items-center gap-2'>
                          {getTypeIcon(field.value)}
                          {field.value === 'EXPENSE' && '지출'}
                          {field.value === 'INCOME' && '수입'}
                          {field.value === 'TRANSFER' && '이체'}
                        </div>
                      </SelectTrigger>
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
              </div>

              <div>
                <Label htmlFor='amount'>기본 금액</Label>
                <Controller
                  control={control}
                  name='amount'
                  render={({ field }) => (
                    <div className='space-y-1'>
                      <div className='relative'>
                        <Input
                          id='amount'
                          placeholder='10000'
                          inputMode='numeric'
                          className='pr-8'
                          value={
                            field.value
                              ? formatAmount(field.value.toString()).replace('원', '')
                              : ''
                          }
                          onChange={e => {
                            const rawValue = e.target.value.replace(/[^\d]/g, '')
                            field.onChange(rawValue)
                          }}
                        />
                        <span className='absolute right-2 top-1/2 -translate-y-1/2 text-sm text-text-500'>
                          원
                        </span>
                      </div>
                      {errors.amount && (
                        <p className='text-sm text-red-500'>{errors.amount.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Category and Account */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label htmlFor='categoryId'>카테고리</Label>
                <Controller
                  control={control}
                  name='categoryId'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        {field.value
                          ? categories.find(c => c.id === field.value)?.name
                          : '카테고리 선택'}
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
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor='accountId'>계좌</Label>
                <Controller
                  control={control}
                  name='accountId'
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        {field.value ? accounts.find(a => a.id === field.value)?.name : '계좌 선택'}
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
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
            </div>

            {/* Shortcut key */}
            <div>
              <Label htmlFor='shortcut'>단축키 (선택사항)</Label>
              <Controller
                control={control}
                name='shortcut'
                render={({ field }) => (
                  <div className='flex gap-2'>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <Button
                        key={num}
                        type='button'
                        variant={field.value === num ? 'default' : 'outline'}
                        size='sm'
                        className='w-8 h-8 p-0'
                        onClick={() => field.onChange(field.value === num ? undefined : num)}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                )}
              />
              <p className='text-xs text-text-500 mt-1'>
                숫자키를 눌러서 빠르게 프리셋을 적용할 수 있습니다
              </p>
            </div>

            {/* Form errors */}
            {Object.keys(errors).length > 0 && (
              <div className='text-sm text-red-600'>{Object.values(errors)[0]?.message}</div>
            )}

            {/* Actions */}
            <DialogFooter>
              <Button type='button' variant='ghost' onClick={handleCloseDialog}>
                취소
              </Button>
              <Button type='submit' disabled={!isValid}>
                {editingPreset ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
