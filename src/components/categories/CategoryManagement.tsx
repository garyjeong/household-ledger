/**
 * 카테고리 관리 컴포넌트
 * T-022: 카테고리 관리 페이지 구현
 */

'use client'

import React, { useState } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Tag,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCategories, useDeleteCategory, Category, CategoryFilters } from '@/hooks/use-categories'
import { useToast } from '@/hooks/use-toast'
import { useGroup } from '@/contexts/group-context'
import { CategoryModal } from './CategoryModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface CategoryManagementProps {
  className?: string
}

/**
 * 카테고리 아이콘 렌더링
 */
const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'INCOME':
      return <TrendingUp className='h-4 w-4 text-green-600' />
    case 'EXPENSE':
      return <TrendingDown className='h-4 w-4 text-red-600' />
    default:
      return <Tag className='h-4 w-4 text-gray-600' />
  }
}

/**
 * 카테고리 타입별 색상
 */
const getTypeColor = (type: string) => {
  switch (type) {
    case 'INCOME':
      return 'bg-green-100 text-green-800'
    case 'EXPENSE':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function CategoryManagement({ className }: CategoryManagementProps) {
  const { toast } = useToast()
  const { currentGroup } = useGroup()

  // 상태 관리
  const [selectedTab, setSelectedTab] = useState<'all' | 'income' | 'expense'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)

  // API hooks - currentGroup이 있을 때만 호출
  const filters: CategoryFilters | null = React.useMemo(() => {
    if (!currentGroup?.id) return null
    
    return {
      ownerType: 'GROUP',
      ownerId: currentGroup.id,
      ...(selectedTab !== 'all' && { type: selectedTab.toUpperCase() as 'INCOME' | 'EXPENSE' }),
    }
  }, [currentGroup?.id, selectedTab])

  // currentGroup이 로드되기 전에는 API 호출하지 않음
  const shouldFetchCategories = !!filters
  const { data: categoriesData, isLoading, error } = useCategories(
    shouldFetchCategories ? filters : null
  )
  const { deleteCategory: deleteCategoryFn, loading: deleteLoading, error: deleteError } = useDeleteCategory()

  // 카테고리 목록 필터링
  const filteredCategories = React.useMemo(() => {
    if (!shouldFetchCategories || !categoriesData?.categories) return []

    return categoriesData.categories.filter((category: Category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [shouldFetchCategories, categoriesData?.categories, searchQuery])

  // 새 카테고리 추가
  const handleAddCategory = () => {
    setModalMode('create')
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  // 카테고리 편집
  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      toast({
        title: '편집 불가',
        description: '기본 카테고리는 편집할 수 없습니다.',
        variant: 'destructive',
      })
      return
    }

    setModalMode('edit')
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  // 카테고리 삭제 확인
  const handleDeleteClick = (category: Category) => {
    if (category.isDefault) {
      toast({
        title: '삭제 불가',
        description: '기본 카테고리는 삭제할 수 없습니다.',
        variant: 'destructive',
      })
      return
    }

    setDeleteCategory(category)
  }

  // 카테고리 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!deleteCategory) return

    try {
      await deleteCategoryFn(deleteCategory.id)
      toast({
        title: '카테고리 삭제 완료',
        description: `"${deleteCategory.name}" 카테고리가 삭제되었습니다.`,
      })
      setDeleteCategory(null)
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 컴팩트한 카테고리 아이템 렌더링
  const renderCategoryItem = (category: Category) => (
    <div
      key={category.id}
      className='group flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200'
    >
      <div className='flex items-center space-x-3 flex-1 min-w-0'>
        {/* 카테고리 색상 원 */}
        <div
          className='w-4 h-4 rounded-full border border-white shadow-sm flex-shrink-0'
          style={{ backgroundColor: category.color || '#6B7280' }}
        />

        {/* 카테고리 정보 */}
        <div className='flex items-center space-x-3 flex-1 min-w-0'>
          <div className='flex items-center space-x-2 flex-1 min-w-0'>
            <span className='font-medium text-gray-900 truncate'>{category.name}</span>
            {category.isDefault && (
              <Badge variant='secondary' className='text-xs py-0 px-2 h-5'>
                기본
              </Badge>
            )}
          </div>

          {/* 타입 표시 */}
          <div className='flex items-center space-x-1 flex-shrink-0'>
            {getCategoryIcon(category.type)}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(category.type)}`}>
              {category.type === 'INCOME' ? '수입' : '지출'}
            </span>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className={`flex items-center space-x-1 transition-opacity flex-shrink-0 ml-3 ${
        category.isDefault ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => handleEditCategory(category)}
          disabled={category.isDefault}
          className='h-7 w-7 p-0 hover:bg-blue-100 disabled:hover:bg-transparent disabled:cursor-not-allowed'
          title={category.isDefault ? '기본 카테고리는 편집할 수 없습니다' : '편집'}
        >
          <Edit2 className='h-3.5 w-3.5' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => handleDeleteClick(category)}
          disabled={category.isDefault}
          className='h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed'
          title={category.isDefault ? '기본 카테고리는 삭제할 수 없습니다' : '삭제'}
        >
          <Trash2 className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  )

  // 그룹이 없는 상태 처리
  if (!currentGroup) {
    return (
      <div className='text-center py-6'>
        <p className='text-gray-600 text-sm'>그룹에 가입하거나 생성한 후 카테고리를 관리할 수 있습니다.</p>
        <p className='text-xs text-gray-500 mt-1'>
          먼저 그룹 페이지에서 그룹을 생성하거나 초대 코드로 가입해주세요.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center py-6'>
        <p className='text-red-600 text-sm'>카테고리를 불러오는 중 오류가 발생했습니다.</p>
        <p className='text-xs text-gray-500 mt-1'>
          {error || '알 수 없는 오류'}
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* 헤더 */}
      <div className='sticky top-0 z-10 bg-white pb-4 mb-4 border-b border-gray-100'>
        <div className='pt-4 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>카테고리 관리</h1>
            <p className='text-slate-600 mt-1'>수입과 지출 카테고리를 관리하세요</p>
          </div>
          <Button onClick={handleAddCategory} className='gap-2 h-9'>
            <Plus className='h-4 w-4' />새 카테고리
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className='flex items-center justify-between mb-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            placeholder='카테고리 검색...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-10 h-9'
          />
        </div>
        
        {/* 카테고리 수 표시 */}
        {!isLoading && filteredCategories.length > 0 && (
          <div className='text-sm text-gray-500 ml-4'>
            총 {filteredCategories.length}개
          </div>
        )}
      </div>

      {/* 탭 */}
      <Tabs value={selectedTab} onValueChange={value => setSelectedTab(value as any)}>
        <TabsList className='mb-4'>
          <TabsTrigger value='all'>전체</TabsTrigger>
          <TabsTrigger value='expense'>지출</TabsTrigger>
          <TabsTrigger value='income'>수입</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-5 w-5 animate-spin' />
              <span className='ml-2 text-sm'>카테고리 목록을 불러오는 중...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className='text-center py-8'>
              <Tag className='h-10 w-10 text-gray-400 mx-auto mb-3' />
              <h3 className='text-base font-medium text-gray-900 mb-2'>
                {searchQuery ? '검색 결과가 없습니다' : '카테고리가 없습니다'}
              </h3>
              <p className='text-sm text-gray-600 mb-4'>
                {searchQuery ? '다른 검색어로 시도해보세요' : '새로운 카테고리를 추가해보세요'}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddCategory} className='gap-2 h-9'>
                  <Plus className='h-4 w-4' />첫 번째 카테고리 추가
                </Button>
              )}
            </div>
          ) : (
            <div className='space-y-2'>
              {filteredCategories.map(renderCategoryItem)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 모달 */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        category={editingCategory}
      />

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDeleteConfirm}
        categoryName={deleteCategory?.name || ''}
        isLoading={deleteLoading}
      />
    </div>
  )
}
