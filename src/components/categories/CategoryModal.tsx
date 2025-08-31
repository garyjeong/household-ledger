/**
 * 카테고리 추가/편집 모달 컴포넌트
 * T-022: 카테고리 관리 페이지 구현
 */

'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Loader2, TrendingUp, TrendingDown, Tag } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  useCreateCategory,
  useUpdateCategory,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from '@/hooks/use-categories'
import { useToast } from '@/hooks/use-toast'
import { useGroup } from '@/contexts/group-context'

// 폼 스키마
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, '카테고리 이름을 입력해주세요')
    .max(20, '카테고리 이름은 20자 이하로 입력해주세요')
    .regex(/^[a-zA-Z0-9가-힣\s\-_]+$/, '특수문자는 사용할 수 없습니다 (- _ 제외)'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().min(1, '색상을 선택해주세요'),
})

type CategoryFormData = z.infer<typeof categoryFormSchema>

// 색상 팔레트
const colorOptions = [
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#F59E0B', // amber-500
  '#EAB308', // yellow-500
  '#84CC16', // lime-500
  '#22C55E', // green-500
  '#10B981', // emerald-500
  '#14B8A6', // teal-500
  '#06B6D4', // cyan-500
  '#3B82F6', // blue-500
  '#6366F1', // indigo-500
  '#8B5CF6', // violet-500
  '#A855F7', // purple-500
  '#D946EF', // fuchsia-500
  '#EC4899', // pink-500
  '#F43F5E', // rose-500
]

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  category?: Category | null
}

export function CategoryModal({ isOpen, onClose, mode, category }: CategoryModalProps) {
  const { toast } = useToast()
  const { currentGroup } = useGroup()

  // API hooks
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  // 폼 관리
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      color: colorOptions[0],
    },
  })

  const selectedColor = watch('color')
  const selectedType = watch('type')

  // 편집 모드일 때 폼 초기화
  useEffect(() => {
    if (mode === 'edit' && category) {
      reset({
        name: category.name,
        type: category.type as 'INCOME' | 'EXPENSE',
        color: category.color,
      })
    } else if (mode === 'create') {
      reset({
        name: '',
        type: 'EXPENSE',
        color: colorOptions[0],
      })
    }
  }, [mode, category, reset])

  // 모달 닫기
  const handleClose = () => {
    reset()
    onClose()
  }

  // 폼 제출
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (mode === 'create') {
        if (!currentGroup) {
          throw new Error('그룹 정보가 없습니다')
        }

        const createData: CreateCategoryData = {
          name: data.name,
          type: data.type,
          color: data.color,
          ownerType: 'GROUP',
          ownerId: parseInt(currentGroup.id),
        }

        await createCategory.mutateAsync(createData)
        toast({
          title: '카테고리 생성 완료',
          description: `"${data.name}" 카테고리가 생성되었습니다.`,
        })
      } else if (mode === 'edit' && category) {
        const updateData: UpdateCategoryData = {
          name: data.name,
          type: data.type,
          color: data.color,
        }

        await updateCategory.mutateAsync({
          id: category.id,
          data: updateData,
        })
        toast({
          title: '카테고리 수정 완료',
          description: `"${data.name}" 카테고리가 수정되었습니다.`,
        })
      }

      handleClose()
    } catch (error) {
      toast({
        title: mode === 'create' ? '카테고리 생성 실패' : '카테고리 수정 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const isLoading = createCategory.isPending || updateCategory.isPending

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && handleClose()}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Tag className='h-5 w-5' />
            {mode === 'create' ? '새 카테고리 추가' : '카테고리 편집'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* 카테고리 이름 */}
          <div className='space-y-2'>
            <Label htmlFor='name'>카테고리 이름</Label>
            <Input
              id='name'
              placeholder='예: 식비, 교통비, 용돈 등'
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && <p className='text-sm text-red-600'>{errors.name.message}</p>}
          </div>

          {/* 카테고리 유형 */}
          <div className='space-y-3'>
            <Label>카테고리 유형</Label>
            <RadioGroup
              value={selectedType}
              onValueChange={value => setValue('type', value as 'INCOME' | 'EXPENSE')}
              disabled={isLoading}
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='EXPENSE' id='expense' />
                <Label htmlFor='expense' className='flex items-center gap-2 cursor-pointer'>
                  <TrendingDown className='h-4 w-4 text-red-600' />
                  지출
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='INCOME' id='income' />
                <Label htmlFor='income' className='flex items-center gap-2 cursor-pointer'>
                  <TrendingUp className='h-4 w-4 text-green-600' />
                  수입
                </Label>
              </div>
            </RadioGroup>
            {errors.type && <p className='text-sm text-red-600'>{errors.type.message}</p>}
          </div>

          {/* 색상 선택 */}
          <div className='space-y-3'>
            <Label>색상</Label>
            <div className='grid grid-cols-8 gap-2'>
              {colorOptions.map(color => (
                <button
                  key={color}
                  type='button'
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                  disabled={isLoading}
                />
              ))}
            </div>
            {errors.color && <p className='text-sm text-red-600'>{errors.color.message}</p>}
          </div>

          {/* 미리보기 */}
          <div className='p-3 bg-gray-50 rounded-lg'>
            <Label className='text-sm text-gray-600 mb-2 block'>미리보기</Label>
            <div className='flex items-center space-x-3'>
              <div
                className='w-6 h-6 rounded-full border-2 border-gray-200'
                style={{ backgroundColor: selectedColor }}
              />
              <span className='font-medium'>{watch('name') || '카테고리 이름'}</span>
              <div className='flex items-center gap-1'>
                {selectedType === 'INCOME' ? (
                  <TrendingUp className='h-4 w-4 text-green-600' />
                ) : (
                  <TrendingDown className='h-4 w-4 text-red-600' />
                )}
                <span className='text-sm text-gray-600'>
                  {selectedType === 'INCOME' ? '수입' : '지출'}
                </span>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={handleClose} disabled={isLoading}>
              취소
            </Button>
            <Button type='submit' disabled={isLoading} className='gap-2'>
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {mode === 'create' ? '생성 중...' : '수정 중...'}
                </>
              ) : (
                <>
                  <Save className='h-4 w-4' />
                  {mode === 'create' ? '생성' : '수정'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
