'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryList, type Category } from '@/components/categories/CategoryList'
import { CategoryDialog } from '@/components/categories/CategoryDialog'
import { transactionTypeLabels, type TransactionType } from '@/lib/utils/category'
import { defaultCategories } from '@/lib/schemas/category'
import { type CreateCategoryData, type UpdateCategoryData } from '@/lib/schemas/category'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL')
  const [filterDefault, setFilterDefault] = useState<'ALL' | 'DEFAULT' | 'CUSTOM'>('ALL')
  
  // Dialog 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>()

  // Mock 데이터 로드 (실제로는 API 호출)
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      try {
        // TODO: 실제 API 호출로 대체
        await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션
        
        // 기본 카테고리를 시스템 카테고리로 변환
        const systemCategories: Category[] = defaultCategories.map((cat, index) => ({
          id: `system-${index}`,
          name: cat.name,
          type: cat.type,
          color: cat.color,
          isDefault: true,
          ownerType: 'USER' as const,
          ownerId: '0', // 시스템 카테고리
        }))

        // 커스텀 카테고리 예시
        const customCategories: Category[] = [
          {
            id: 'custom-1',
            name: '반려동물',
            type: 'EXPENSE',
            color: '#F59E0B',
            isDefault: false,
            ownerType: 'USER',
            ownerId: '1',
          },
          {
            id: 'custom-2',
            name: '부업',
            type: 'INCOME',
            color: '#10B981',
            isDefault: false,
            ownerType: 'USER',
            ownerId: '1',
          },
        ]
        
        setCategories([...systemCategories, ...customCategories])
      } catch (error) {
        console.error('카테고리 목록 로드 중 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  // 필터링된 카테고리 목록
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'ALL' || category.type === filterType
    const matchesDefault = filterDefault === 'ALL' || 
      (filterDefault === 'DEFAULT' && category.isDefault) ||
      (filterDefault === 'CUSTOM' && !category.isDefault)
    
    return matchesSearch && matchesType && matchesDefault
  })

  // 통계 계산
  const stats = {
    total: categories.length,
    default: categories.filter(c => c.isDefault).length,
    custom: categories.filter(c => !c.isDefault).length,
    expense: categories.filter(c => c.type === 'EXPENSE').length,
    income: categories.filter(c => c.type === 'INCOME').length,
    transfer: categories.filter(c => c.type === 'TRANSFER').length,
  }

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
      // TODO: 실제 API 호출로 대체
      console.log('카테고리 삭제:', category.id)
      
      setCategories(prev => prev.filter(c => c.id !== category.id))
    } catch (error) {
      console.error('카테고리 삭제 중 오류:', error)
    }
  }

  // 카테고리 저장 (생성/수정)
  const handleSave = async (data: CreateCategoryData | UpdateCategoryData) => {
    try {
      if (dialogMode === 'create') {
        // TODO: 실제 API 호출로 대체
        console.log('카테고리 생성:', data)
        
        const newCategory: Category = {
          id: Date.now().toString(),
          name: data.name || '',
          type: data.type || 'EXPENSE',
          color: data.color || '#6B7280',
          isDefault: false,
          ownerType: ('ownerType' in data ? data.ownerType : 'USER') || 'USER',
          ownerId: (('ownerId' in data ? data.ownerId : 1) || 1).toString(),
        }
        
        setCategories(prev => [...prev, newCategory])
      } else {
        // TODO: 실제 API 호출로 대체
        console.log('카테고리 수정:', selectedCategory?.id, data)
        
        setCategories(prev => prev.map(c => 
          c.id === selectedCategory?.id 
            ? { 
                ...c, 
                name: data.name || c.name,
                type: data.type || c.type,
                color: data.color || c.color,
              }
            : c
        ))
      }
    } catch (error) {
      console.error('카테고리 저장 중 오류:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-text-900">카테고리 관리</h2>
        <p className="text-text-600 mt-1">
          거래 유형별 카테고리를 관리하고 커스텀 카테고리를 추가할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-text-900">{stats.total}</div>
            <div className="text-sm text-text-600">전체</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.default}</div>
            <div className="text-sm text-text-600">기본</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.expense}</div>
            <div className="text-sm text-text-600">지출</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.income}</div>
            <div className="text-sm text-text-600">수입</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.transfer}</div>
            <div className="text-sm text-text-600">이체</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>카테고리 목록</span>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              카테고리 추가
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="카테고리명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 타입 필터 */}
            <Select value={filterType} onValueChange={(value: TransactionType | 'ALL') => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">모든 타입</SelectItem>
                {Object.entries(transactionTypeLabels).map(([type, label]) => (
                  <SelectItem key={type} value={type}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 기본/커스텀 필터 */}
            <Select value={filterDefault} onValueChange={(value: 'ALL' | 'DEFAULT' | 'CUSTOM') => setFilterDefault(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="DEFAULT">기본</SelectItem>
                <SelectItem value="CUSTOM">커스텀</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 목록 */}
          <CategoryList
            categories={filteredCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
            selectedType={filterType === 'ALL' ? undefined : filterType}
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
