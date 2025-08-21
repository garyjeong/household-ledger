'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CategoryForm } from './CategoryForm'
import { type Category } from './CategoryList'
import { type CreateCategoryData, type UpdateCategoryData } from '@/lib/schemas/category'

interface CategoryDialogProps {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => Promise<void>
}

export function CategoryDialog({
  mode,
  open,
  onOpenChange,
  category,
  onSubmit
}: CategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateCategoryData | UpdateCategoryData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error('카테고리 저장 중 오류:', error)
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '새 카테고리 추가' : '카테고리 정보 수정'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="-mt-6"> {/* Dialog header와의 간격 조정 */}
          <CategoryForm
            mode={mode}
            initialData={category ? {
              id: category.id,
              name: category.name,
              type: category.type,
              color: category.color,
              ownerType: category.ownerType,
              ownerId: category.ownerId,
              isDefault: category.isDefault,
            } : undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
