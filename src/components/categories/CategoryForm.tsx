'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  createCategorySchema, 
  updateCategorySchema,
  type CreateCategoryData,
  type UpdateCategoryData 
} from '@/lib/schemas/category'
import { 
  transactionTypeLabels, 
  transactionTypeIcons,
  transactionTypeColors,
  type TransactionType 
} from '@/lib/utils/category'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { useGroup } from '@/contexts/group-context'

// 폼 데이터 타입 (UI용) - 현재 사용하지 않음
// type CategoryFormData = {
//   name: string
//   type: TransactionType
//   color?: string
//   ownerType: 'USER' | 'GROUP'
//   ownerId: number
// }

interface CategoryFormProps {
  mode: 'create' | 'edit'
  initialData?: {
    id?: string
    name: string
    type: TransactionType
    color?: string | null
    ownerType: 'USER' | 'GROUP'
    ownerId: string
    isDefault: boolean
  }
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function CategoryForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: CategoryFormProps) {
  const { currentGroup } = useGroup()
  
  // 스키마 선택
  const schema = mode === 'create' ? createCategorySchema : updateCategorySchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'EXPENSE',
      color: initialData?.color || '#6B7280',
      ownerType: initialData?.ownerType || 'GROUP',
      ownerId: initialData?.ownerId ? parseInt(initialData.ownerId) : (currentGroup ? parseInt(currentGroup.id) : 1),
    },
  })

  const selectedType = watch('type')
  const selectedColor = watch('color')

  // 색상 변경 핸들러
  const handleColorChange = (color: string) => {
    setValue('color', color)
  }

  // 폼 제출 처리
  const onFormSubmit = async (data: Record<string, unknown>) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('카테고리 저장 중 오류:', error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? '새 카테고리 추가' : '카테고리 정보 수정'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* 카테고리명 */}
          <div className="space-y-2">
            <Label htmlFor="name">카테고리명</Label>
            <Input
              id="name"
              placeholder="예: 식비, 교통비"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* 거래 타입 */}
          <div className="space-y-2">
            <Label>거래 타입</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(transactionTypeLabels).map(([type, label]) => {
                const Icon = transactionTypeIcons[type as TransactionType]
                const colors = transactionTypeColors[type as TransactionType]
                const isSelected = selectedType === type
                
                return (
                  <label
                    key={type}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
                      ${isSelected 
                        ? `${colors.border} ${colors.bg} ${colors.text}` 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('type')}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <Icon className={`h-5 w-5 ${isSelected ? colors.icon : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                )
              })}
            </div>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* 색상 선택 */}
          <div className="space-y-2">
            <ColorPicker
              label="카테고리 색상"
              value={selectedColor}
              onChange={handleColorChange}
            />
            {errors.color && (
              <p className="text-sm text-red-600">{errors.color.message}</p>
            )}
          </div>

          {/* 미리보기 */}
          {selectedColor && (
            <div className="space-y-2">
              <Label>미리보기</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="font-medium">
                  {watch('name') || '카테고리명'}
                </span>
                <span className="text-sm text-gray-500">
                  ({transactionTypeLabels[selectedType || 'EXPENSE']})
                </span>
              </div>
            </div>
          )}

          {/* 숨겨진 필드들 */}
          <input type="hidden" {...register('ownerType')} />
          <input type="hidden" {...register('ownerId')} />

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {mode === 'create' ? '추가 중...' : '수정 중...'}
                </>
              ) : (
                mode === 'create' ? '카테고리 추가' : '수정 완료'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
