'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryList, type Category } from '@/components/categories/CategoryList'
import { CategoryDialog } from '@/components/categories/CategoryDialog'
import { type CreateCategoryData, type UpdateCategoryData } from '@/lib/schemas/category'
import { useGroup } from '@/contexts/group-context'
import { useAuth } from '@/contexts/auth-context'
import { useAlert } from '@/contexts/alert-context'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()

  const { currentGroup } = useGroup()
  const { user } = useAuth()
  const { showSuccess, showError } = useAlert()

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      if (!currentGroup) return

      setIsLoading(true)
      try {
        const response = await apiGet(`/api/categories?ownerType=GROUP&ownerId=${currentGroup.id}`)

        if (response.ok) {
          setCategories(response.data?.categories || [])
        } else {
          throw new Error(response.error || '카테고리 목록을 가져오는데 실패했습니다')
        }
      } catch (error) {
        console.error('카테고리 목록 로드 중 오류:', error)
        showError('카테고리 목록을 가져오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [currentGroup])

  // 카테고리 추가
  const handleCreate = () => {
    setDialogMode('create')
    setSelectedCategory(undefined)
    setIsDialogOpen(true)
  }

  // 카테고리 편집
  const handleEdit = (category: Category) => {
    setDialogMode('edit')
    setSelectedCategory(category)
    setIsDialogOpen(true)
  }

  // 카테고리 삭제
  const handleDelete = async (category: Category) => {
    try {
      const response = await apiDelete(`/api/categories/${category.id}`)

      if (response.ok) {
        setCategories(prev => prev.filter(c => c.id !== category.id))
        showSuccess('카테고리가 삭제되었습니다.')
      } else {
        throw new Error(response.error || '카테고리 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('카테고리 삭제 중 오류:', error)
      showError(error instanceof Error ? error.message : '카테고리 삭제 중 오류가 발생했습니다.')
    }
  }

  // 카테고리 저장 (생성/수정)
  const handleSave = async (data: CreateCategoryData | UpdateCategoryData) => {
    if (!currentGroup) {
      throw new Error('그룹을 선택해주세요')
    }

    try {
      if (dialogMode === 'create') {
        // 카테고리 생성
        const createData = {
          ...data,
          ownerType: 'GROUP' as const,
          ownerId: parseInt(currentGroup.id),
        }

        const response = await apiPost('/api/categories', createData)

        if (response.ok) {
          setCategories(prev => [...prev, response.data?.category])
          showSuccess('카테고리가 추가되었습니다.')
        } else {
          throw new Error(response.error || '카테고리 생성에 실패했습니다')
        }
      } else {
        // 카테고리 수정
        if (!selectedCategory) {
          throw new Error('수정할 카테고리가 선택되지 않았습니다')
        }

        const response = await apiPut(`/api/categories/${selectedCategory.id}`, data)

        if (response.ok) {
          setCategories(prev =>
            prev.map(c => (c.id === selectedCategory.id ? response.data?.category : c))
          )
          showSuccess('카테고리가 수정되었습니다.')
        } else {
          throw new Error(response.error || '카테고리 수정에 실패했습니다')
        }
      }
    } catch (error) {
      console.error('카테고리 저장 중 오류:', error)
      throw error
    }
  }

  return (
    <div className='space-y-6'>
      {/* 페이지 헤더 */}
      <div>
        <h2 className='text-2xl font-bold text-text-900'>카테고리 관리</h2>
        <p className='text-text-600 mt-1'>
          거래 유형별 카테고리를 관리하고 커스텀 카테고리를 추가할 수 있습니다.
        </p>
      </div>

      {/* 카테고리 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>카테고리 목록</span>
            <Button onClick={handleCreate}>
              <Plus className='h-4 w-4 mr-2' />
              카테고리 추가
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 카테고리 목록 */}
          <CategoryList
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* 카테고리 추가/편집 Dialog */}
      <CategoryDialog
        mode={dialogMode}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={selectedCategory}
        onSubmit={handleSave}
      />
    </div>
  )
}
