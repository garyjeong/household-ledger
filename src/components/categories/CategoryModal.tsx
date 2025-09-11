/**
 * 카테고리 추가/편집 모달 컴포넌트
 * T-022: 카테고리 관리 페이지 구현
 */

'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Loader2, Tag, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  useCreateCategory,
  useUpdateCategory,
  Category,
} from '@/hooks/use-categories'
import { CreateCategoryData, UpdateCategoryData } from '@/lib/schemas/category'
import { useToast } from '@/hooks/use-toast'
import { useGroup } from '@/contexts/group-context'

// 폼 스키마
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, '카테고리 이름을 입력해주세요')
    .max(20, '카테고리 이름은 20자 이하로 입력해주세요')
    .trim(),
  type: z.enum(['INCOME', 'EXPENSE'], {
    message: '카테고리 유형을 선택해주세요',
  }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 선택해주세요'),
})

type CategoryFormData = z.infer<typeof categoryFormSchema>

// 기본 색상 옵션
const colorOptions = [
  '#EF4444', // red-500
  '#F97316', // orange-500  
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#06B6D4', // cyan-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#6B7280', // gray-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5A2B', // brown-600
  '#059669', // emerald-600
  '#0D9488', // teal-600
  '#7C3AED', // violet-600
  '#DB2777', // pink-600
]

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  mode: 'create' | 'edit'
  category?: Category | null
}

export function CategoryModal({ isOpen, onClose, onSuccess, mode, category }: CategoryModalProps) {
  const { toast } = useToast()
  const { currentGroup } = useGroup()

  // API hooks
  const { createCategory: createCategoryFn, loading: createLoading, error: createError } = useCreateCategory()
  const { updateCategory: updateCategoryFn, loading: updateLoading, error: updateError } = useUpdateCategory()

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
        color: category.color || '#6B7280',
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
    if (!currentGroup?.id) {
      toast({
        title: '그룹 정보 없음',
        description: '그룹에 가입한 후 카테고리를 관리할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    try {
      if (mode === 'create') {
        const createData: CreateCategoryData = {
          ...data,
          groupId: parseInt(currentGroup.id, 10),
        }
        await createCategoryFn(createData)
        toast({
          title: '카테고리 생성 완료',
          description: `"${data.name}" 카테고리가 생성되었습니다.`,
        })
      } else if (mode === 'edit' && category) {
        const updateData: UpdateCategoryData = {
          ...data,
        }
        await updateCategoryFn(category.id, updateData)
        toast({
          title: '카테고리 수정 완료',
          description: `"${data.name}" 카테고리가 수정되었습니다.`,
        })
      }

      onSuccess?.()
      handleClose()
    } catch (error) {
      toast({
        title: mode === 'create' ? '카테고리 생성 실패' : '카테고리 수정 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const isLoading = createLoading || updateLoading

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className='max-w-lg p-0'>
        {/* 헤더 */}
        <div className='p-6 border-b border-slate-200'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg'>
                <Tag className='h-5 w-5 text-blue-600' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-slate-900'>
                  {mode === 'create' ? '새 카테고리 추가' : '카테고리 편집'}
                </h2>
              </div>
            </div>
            <Button variant='ghost' size='sm' onClick={handleClose} className='h-8 w-8 p-0'>
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='p-6 space-y-6'>
          {/* 카테고리 이름 */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg'>
                <span className='text-lg'>📝</span>
              </div>
              <h3 className='text-base font-bold text-slate-900'>카테고리 이름</h3>
            </div>
            <Input
              placeholder='예: 식비, 교통비, 용돈 등'
              {...register('name')}
              disabled={isLoading}
              className='h-12 text-base'
            />
            {errors.name && <p className='text-sm text-red-600 mt-1'>{errors.name.message}</p>}
          </div>

          {/* 카테고리 유형 */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg'>
                <span className='text-lg'>🏷️</span>
              </div>
              <h3 className='text-base font-bold text-slate-900'>카테고리 유형</h3>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <Button
                type='button'
                variant={selectedType === 'EXPENSE' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'EXPENSE')}
                disabled={isLoading}
                className='h-12 flex items-center justify-center'
              >
                지출
              </Button>
              <Button
                type='button'
                variant={selectedType === 'INCOME' ? 'default' : 'outline'}
                onClick={() => setValue('type', 'INCOME')}
                disabled={isLoading}
                className='h-12 flex items-center justify-center'
              >
                수입
              </Button>
            </div>
          </div>

          {/* 색상 선택 */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-lg'>
                <span className='text-lg'>🎨</span>
              </div>
              <h3 className='text-base font-bold text-slate-900'>색상 선택</h3>
            </div>
            <div className='grid grid-cols-8 gap-3'>
              {colorOptions.map(color => (
                <button
                  key={color}
                  type='button'
                  className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-110 ${
                    selectedColor === color
                      ? 'border-slate-900 scale-110 shadow-lg'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                  disabled={isLoading}
                />
              ))}
            </div>
            {errors.color && <p className='text-sm text-red-600 mt-1'>{errors.color.message}</p>}
          </div>

          {/* 미리보기 */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-lg'>
                <span className='text-lg'>👀</span>
              </div>
              <h3 className='text-base font-bold text-slate-900'>미리보기</h3>
            </div>
            <div className='p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200'>
              <div className='flex items-center space-x-3'>
                <div
                  className='w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0'
                  style={{ backgroundColor: selectedColor }}
                />
                <span className='font-semibold text-slate-900'>{watch('name') || '카테고리 이름'}</span>
                <div className='flex items-center'>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    selectedType === 'INCOME' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedType === 'INCOME' ? '수입' : '지출'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className='flex gap-3 pt-6 border-t border-slate-200'>
            <Button 
              type='button' 
              variant='outline' 
              onClick={handleClose} 
              disabled={isLoading}
              className='flex-1 h-12'
            >
              취소
            </Button>
            <Button 
              type='submit' 
              disabled={isLoading} 
              className='flex-1 h-12 gap-2'
            >
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