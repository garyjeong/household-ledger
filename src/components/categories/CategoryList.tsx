'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit2, Trash2, Sparkles } from 'lucide-react'
import { 
  transactionTypeIcons, 
  transactionTypeLabels,
  getCategoryBackgroundColor,
  getCategoryTextColor,
  isSystemCategory,
  groupCategoriesByDefault,
  type TransactionType 
} from '@/lib/utils/category'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string | null
  isDefault: boolean
  ownerType: 'USER' | 'GROUP'
  ownerId: string
}

interface CategoryListProps {
  categories: Category[]
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
  isLoading?: boolean
  selectedType?: TransactionType
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
  isLoading = false,
  selectedType
}: CategoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 타입별 필터링
  const filteredCategories = selectedType 
    ? categories.filter(cat => cat.type === selectedType)
    : categories

  // 기본/커스텀 그룹핑
  const { default: defaultCategories, custom: customCategories } = groupCategoriesByDefault(filteredCategories)

  // 삭제 핸들러
  const handleDelete = async (category: Category) => {
    if (!onDelete) return
    
    const confirmed = window.confirm(`'${category.name}' 카테고리를 삭제하시겠습니까?`)
    if (!confirmed) return

    setDeletingId(category.id)
    try {
      await onDelete(category)
    } catch (error) {
      console.error('카테고리 삭제 중 오류:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // 카테고리 카드 렌더링
  const renderCategoryCard = (category: Category, isSystemCategory: boolean) => {
    const TypeIcon = transactionTypeIcons[category.type]
    const backgroundColor = getCategoryBackgroundColor(category.color, 0.1)
    const textColor = getCategoryTextColor(category.color)
    const isDeleting = deletingId === category.id

    return (
      <Card
        key={category.id}
        className={`
          transition-all duration-200 hover:shadow-sm
          ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* 카테고리 색상 및 아이콘 */}
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: category.color || '#6B7280' }}
              />
              <TypeIcon className="h-4 w-4 text-gray-500" />
            </div>

            {/* 카테고리 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {category.name}
                </h3>
                {isSystemCategory && (
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    기본
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {transactionTypeLabels[category.type]}
              </p>
            </div>

            {/* 미리보기 태그 */}
            <div
              className="px-2 py-1 rounded-md border text-sm font-medium"
              style={{
                backgroundColor,
                color: textColor,
                borderColor: category.color || '#D1D5DB',
              }}
            >
              {category.name}
            </div>

            {/* 액션 메뉴 (커스텀 카테고리만) */}
            {!isSystemCategory && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={isDeleting}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">메뉴 열기</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(category)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                  )}
                  
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(category)}
                        className="text-red-600 focus:text-red-600"
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 빈 상태 표시
  if (filteredCategories.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {selectedType ? `${transactionTypeLabels[selectedType]} 카테고리가 없습니다` : '카테고리가 없습니다'}
        </h3>
        <p className="text-gray-500 mb-4">첫 번째 카테고리를 추가해보세요.</p>
      </div>
    )
  }

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex gap-2">
                  <div className="h-4 w-4 bg-gray-200 rounded-full" />
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 기본 카테고리 섹션 */}
      {defaultCategories.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">기본 카테고리</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {defaultCategories.length}개
            </Badge>
          </div>
          <div className="space-y-2">
            {defaultCategories.map((category) => 
              renderCategoryCard(category, true)
            )}
          </div>
        </div>
      )}

      {/* 커스텀 카테고리 섹션 */}
      {customCategories.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">내 카테고리</h3>
            <Badge variant="secondary">
              {customCategories.length}개
            </Badge>
          </div>
          <div className="space-y-2">
            {customCategories.map((category) => 
              renderCategoryCard(category, false)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
