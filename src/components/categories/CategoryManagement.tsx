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
  Loader2,
  ArrowUpDown,
  Settings,
  Check,
  MoreVertical,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCategories, useDeleteCategory, Category, CategoryFilters } from '@/hooks/use-categories'
import { useToast } from '@/hooks/use-toast'
import { useGroup } from '@/contexts/group-context'
import { isDefaultCategory } from '@/lib/seed-categories'
import { CategoryModal } from './CategoryModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface CategoryManagementProps {
  className?: string
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
    case 'TRANSFER':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function CategoryManagement({ className }: CategoryManagementProps) {
  const { toast } = useToast()
  const { currentGroup } = useGroup()

  // 상태 관리
  const [selectedTab, setSelectedTab] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'default' | 'name-asc' | 'name-desc' | 'type'>('default')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  
  // 다중 선택 관련 상태
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  


  // API hooks - 기본 카테고리는 항상 로딩, 그룹 카테고리는 조건부 로딩
  const filters: CategoryFilters | undefined = React.useMemo(() => {
    const baseFilter = {
      ...(selectedTab !== 'all' && { type: selectedTab.toUpperCase() as 'INCOME' | 'EXPENSE' | 'TRANSFER' }),
    }
    
    // 그룹이 있으면 그룹 필터 추가, 없으면 기본 카테고리만 로딩
    if (currentGroup?.id) {
      return {
        ...baseFilter,
        groupId: currentGroup.id,
      }
    }
    
    // 그룹이 없어도 기본 카테고리는 로딩
    return baseFilter
  }, [currentGroup?.id, selectedTab])

  // 필터가 정의되면 API 호출 (null이 아닌 undefined 사용)
  const { data: categoriesData, isLoading, error, refetch } = useCategories(filters)
  const { deleteCategory: deleteCategoryFn, loading: deleteLoading, error: deleteError } = useDeleteCategory()

  // 카테고리 목록 필터링 및 정렬
  const filteredCategories = React.useMemo(() => {
    if (!categoriesData?.categories) return []

    // 검색 필터링
    let filtered = categoriesData.categories.filter((category: Category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 정렬 적용
    switch (sortOrder) {
      case 'name-asc':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        break
      case 'name-desc':
        filtered = filtered.sort((a, b) => b.name.localeCompare(a.name, 'ko'))
        break
      case 'type':
        filtered = filtered.sort((a, b) => {
          // 타입별 정렬 (수입 > 지출 > 기타)
          const typeOrder = { INCOME: 0, EXPENSE: 1, TRANSFER: 2 }
          const typeCompare = typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder]
          return typeCompare !== 0 ? typeCompare : a.name.localeCompare(b.name, 'ko')
        })
        break
      case 'default':
      default:
        // 기본 정렬 유지 (API에서 반환되는 순서)
        break
    }

    return filtered
  }, [categoriesData?.categories, searchQuery, sortOrder])

  // 새 카테고리 추가
  const handleAddCategory = () => {
    setModalMode('create')
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  // 카테고리 편집
  const handleEditCategory = (category: Category) => {
    if (isDefaultCategory(category)) {
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
    if (isDefaultCategory(category)) {
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
      refetch?.() // 삭제 후 리스트 새로고침
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 카테고리 생성/수정 성공 후 콜백
  const handleCategorySuccess = React.useCallback(() => {
    refetch?.() // 리스트 새로고침
  }, [refetch])

  // 정렬 토글 핸들러
  const toggleSortOrder = () => {
    const sortSequence: Array<typeof sortOrder> = ['default', 'name-asc', 'name-desc', 'type']
    const currentIndex = sortSequence.indexOf(sortOrder)
    const nextIndex = (currentIndex + 1) % sortSequence.length
    setSortOrder(sortSequence[nextIndex])
  }

  // 정렬 순서 라벨 가져오기
  const getSortOrderLabel = () => {
    switch (sortOrder) {
      case 'default':
        return '기본'
      case 'name-asc':
        return '가나다'
      case 'name-desc':
        return '다나가'
      case 'type':
        return '타입별'
      default:
        return '기본'
    }
  }

  // 다중 선택 관련 핸들러들
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedCategories(new Set())
  }

  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
    } else {
      newSelected.add(categoryId)
    }
    setSelectedCategories(newSelected)
  }

  const selectAllCategories = () => {
    const selectableCategories = filteredCategories.filter(cat => !isDefaultCategory(cat))
    setSelectedCategories(new Set(selectableCategories.map(cat => cat.id)))
  }

  const clearSelection = () => {
    setSelectedCategories(new Set())
  }

  // 다중 삭제 핸들러
  const handleMultipleDelete = async () => {
    if (selectedCategories.size === 0) return

    const categoriesToDelete = filteredCategories.filter(cat => 
      selectedCategories.has(cat.id) && !cat.isDefault
    )

    if (categoriesToDelete.length === 0) {
      toast({
        title: '삭제 불가',
        description: '기본 카테고리는 삭제할 수 없습니다.',
        variant: 'destructive',
      })
      return
    }

    try {
      // 각 카테고리를 순차적으로 삭제
      for (const category of categoriesToDelete) {
        await deleteCategoryFn(category.id)
      }

      toast({
        title: '카테고리 삭제 완료',
        description: `${categoriesToDelete.length}개의 카테고리가 삭제되었습니다.`,
      })
      
      setSelectedCategories(new Set())
      setIsSelectionMode(false)
      refetch?.()
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }





  // 카드 형태의 카테고리 아이템 렌더링
  const renderCategoryItem = (category: Category) => {
    // 편집/삭제 가능 여부 확인 (기본 카테고리가 아닌 경우만)
    const canEdit = !isDefaultCategory(category)

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // 선택 모드일 때만 카드 클릭으로 선택/해제
      if (isSelectionMode && canEdit) {
        e.preventDefault()
        e.stopPropagation()
        toggleCategorySelection(category.id)
      }
    }

    const handleSettingsClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // 설정 메뉴 드롭다운을 여기서 처리 (나중에 DropdownMenu로 구현 가능)
    }

    return (
      <Card
        key={category.id}
        className={`group hover:shadow-md transition-all duration-200 hover:border-blue-300 relative ${
          selectedCategories.has(category.id) ? 'ring-2 ring-blue-500 border-blue-500' : ''
        } ${
          isSelectionMode && canEdit ? 'cursor-pointer' : 'cursor-default'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className='p-3'>
          <div className='flex items-center justify-between w-full'>
            {/* 좌측: 체크박스 + 색상 + 카테고리명 */}
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              {/* 체크박스 (선택 모드일 때만) */}
              {isSelectionMode && canEdit && (
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedCategories.has(category.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 hover:border-blue-400'
                }`}>
                  {selectedCategories.has(category.id) && (
                    <Check className='h-3 w-3 text-white' />
                  )}
                </div>
              )}
              
              {/* 색상 원 */}
              <div
                className='w-5 h-5 rounded-full border border-white shadow-sm flex-shrink-0'
                style={{ backgroundColor: category.color || '#6B7280' }}
              />
              
              {/* 카테고리명 */}
              <h3 className='font-semibold text-gray-900 truncate text-sm flex-1'>
                {category.name}
              </h3>
            </div>

            {/* 우측: 타입 배지 + 설정 버튼 */}
            <div className='flex items-center gap-2 flex-shrink-0'>
              {/* 타입 배지 */}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(category.type)}`}>
                {category.type === 'INCOME' ? '수입' : '지출'}
              </span>
              
              {/* 설정 버튼 (커스텀 카테고리만, 선택 모드가 아닐 때만) */}
              {canEdit && !isSelectionMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={(e) => e.stopPropagation()}
                      title='카테고리 설정'
                    >
                      <Settings className='h-4 w-4 text-gray-400 hover:text-gray-600' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-32'>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCategory(category)
                      }}
                      className='flex items-center gap-2'
                    >
                      <Edit2 className='h-4 w-4' />
                      편집
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(category)
                      }}
                      className='flex items-center gap-2 text-red-600 focus:text-red-600'
                    >
                      <Trash2 className='h-4 w-4' />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 그룹 없을 때 알림 컴포넌트
  const NoGroupAlert = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-blue-600" />
        <h4 className="font-medium text-blue-900">그룹에 참여하지 않았습니다</h4>
      </div>
      <p className="text-sm text-blue-700">
        현재 기본 카테고리만 표시됩니다. 그룹을 생성하거나 참여하여 더 많은 기능을 사용해보세요.
      </p>
    </div>
  )

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
    <div className={`space-y-4 ${className || ''}`}>
      {/* 헤더 */}
      <div className='sticky top-0 z-20 bg-white mb-2'>
        <div className='pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>카테고리 관리</h1>
            <p className='text-slate-600 mt-1'>
              {isSelectionMode 
                ? `${selectedCategories.size}개 선택됨`
                : '수입과 지출 카테고리를 관리하세요'
              }
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {isSelectionMode ? (
              <>
                {selectedCategories.size > 0 && (
                  <>
                    <Button 
                      variant='outline' 
                      size='sm' 
                      onClick={selectAllCategories}
                      className='gap-2 h-9'
                    >
                      전체 선택
                    </Button>
                    <Button 
                      variant='outline' 
                      size='sm' 
                      onClick={clearSelection}
                      className='gap-2 h-9'
                    >
                      선택 해제
                    </Button>
                    <Button 
                      variant='destructive' 
                      size='sm' 
                      onClick={handleMultipleDelete}
                      className='gap-2 h-9'
                      disabled={deleteLoading}
                    >
                      <Trash2 className='h-4 w-4' />
                      {selectedCategories.size}개 삭제
                    </Button>
                  </>
                )}
                <Button 
                  variant='outline' 
                  onClick={toggleSelectionMode}
                  className='gap-2 h-9'
                >
                  완료
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant='outline' 
                  onClick={toggleSelectionMode}
                  className='gap-2 h-9'
                >
                  선택
                </Button>
                <Button onClick={handleAddCategory} className='gap-2 h-9'>
                  <Plus className='h-4 w-4' />새 카테고리
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className='space-y-6'>
        {/* 그룹 없을 때 알림 */}
        {!currentGroup && <NoGroupAlert />}

        {/* 검색 및 필터 */}
        <div className='space-y-3'>
        {/* 상단: 검색과 정렬 */}
        <div className='flex items-center justify-between'>
          {/* 좌측: 검색 */}
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <Input
              placeholder='카테고리 검색...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 h-9'
            />
          </div>
          
          {/* 우측: 정렬 토글 버튼 */}
          <div className='flex items-center'>
            <Button
              variant='outline'
              size='sm'
              onClick={toggleSortOrder}
              className='flex items-center gap-2 h-9'
              title={`현재: ${getSortOrderLabel()} 순서`}
            >
              <ArrowUpDown className='h-4 w-4' />
              {getSortOrderLabel()}
            </Button>
          </div>
        </div>
      </div>

      {/* 탭과 카운트 */}
      <Tabs value={selectedTab} onValueChange={value => setSelectedTab(value as any)}>
        <div className='flex items-center justify-between'>
          {/* 좌측: 카테고리 수 표시 */}
          {!isLoading && filteredCategories.length > 0 && (
            <div className='text-sm text-gray-600 font-medium'>
              총 {filteredCategories.length}개
            </div>
          )}
          
          {/* 우측: 탭 */}
          <TabsList>
            <TabsTrigger value='all'>전체</TabsTrigger>
            <TabsTrigger value='expense'>지출</TabsTrigger>
            <TabsTrigger value='income'>수입</TabsTrigger>
            <TabsTrigger value='transfer'>이체</TabsTrigger>
          </TabsList>
        </div>

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
              <p className='text-sm text-gray-600'>
                {searchQuery ? '다른 검색어로 시도해보세요' : '새로운 카테고리를 추가해보세요'}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddCategory} className='gap-2 h-9'>
                  <Plus className='h-4 w-4' />첫 번째 카테고리 추가
                </Button>
              )}
            </div>
          ) : (
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'>
              {filteredCategories.map(renderCategoryItem)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 모달 */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCategorySuccess}
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
    </div>
  )
}
