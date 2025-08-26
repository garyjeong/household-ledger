'use client'

import React, { useState } from 'react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Edit,
  Trash2,
  Tag,
  Search,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react'
import { QuickAddModal } from '@/components/couple-ledger/QuickAddModal'
import { defaultCategories, Category } from '@/components/couple-ledger/CategoryPicker'

interface CategoryStats {
  id: string
  totalAmount: number
  transactionCount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  lastUsed: Date
}

interface CategoryFormData {
  name: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
  description: string
}

// 더미 카테고리 통계
const dummyCategoryStats: CategoryStats[] = [
  {
    id: '1',
    totalAmount: 650000,
    transactionCount: 23,
    percentage: 26.5,
    trend: 'up',
    lastUsed: new Date('2025-01-08')
  },
  {
    id: '2',
    totalAmount: 420000,
    transactionCount: 12,
    percentage: 17.1,
    trend: 'down',
    lastUsed: new Date('2025-01-07')
  }
]

// 색상 팔레트
const colorPalette = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', 
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
]

/**
 * 카테고리 관리 페이지
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [categoryStats] = useState<CategoryStats[]>(dummyCategoryStats)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    icon: '🏷️',
    color: '#3B82F6',
    type: 'expense',
    description: ''
  })
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // 필터된 카테고리
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || category.type === selectedType || category.type === 'both'
    return matchesSearch && matchesType
  })

  // 카테고리 통계 가져오기
  const getCategoryStats = (categoryId: string) => {
    return categoryStats.find(stat => stat.id === categoryId)
  }

  // 새 카테고리 생성
  const handleCreateCategory = () => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      type: formData.type as 'income' | 'expense',
      isDefault: false
    }

    setCategories(prev => [...prev, newCategory])
    resetForm()
    setIsCreating(false)
  }

  // 카테고리 삭제
  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (category?.isDefault) {
      alert('기본 카테고리는 삭제할 수 없습니다.')
      return
    }
    
    setCategories(prev => prev.filter(cat => cat.id !== categoryId))
  }

  // 편집 시작
  const startEditing = (category: Category) => {
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      description: ''
    })
    setEditingId(category.id)
    setIsCreating(false)
  }

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      name: '',
      icon: '🏷️',
      color: '#3B82F6',
      type: 'expense',
      description: ''
    })
  }

  // 편집/생성 취소
  const handleCancel = () => {
    resetForm()
    setIsCreating(false)
    setEditingId(null)
  }

  // 트렌드 아이콘
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'stable': return <BarChart3 className="h-4 w-4 text-gray-400" />
    }
  }

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원'
  }

  return (
    <>
      <ResponsiveLayout onQuickAddClick={() => setIsQuickAddOpen(true)}>
        <div className="w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          {/* 헤더 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
              <p className="text-gray-500">수입과 지출 카테고리를 관리하세요</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreating(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                카테고리 추가
              </Button>
            </div>
          </div>

          {/* 필터 및 검색 */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 검색 */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="카테고리 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* 타입 필터 */}
                <div className="flex gap-2">
                  <Button
                    variant={selectedType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('all')}
                  >
                    전체
                  </Button>
                  <Button
                    variant={selectedType === 'income' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('income')}
                  >
                    수입
                  </Button>
                  <Button
                    variant={selectedType === 'expense' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('expense')}
                  >
                    지출
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* 카테고리 생성/편집 폼 */}
              {(isCreating || editingId) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {isCreating ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                      {isCreating ? '새 카테고리 추가' : '카테고리 편집'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 카테고리 이름 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          카테고리 이름 *
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="카테고리 이름을 입력하세요"
                        />
                      </div>

                      {/* 타입 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          타입 *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                        >
                          <option value="expense">지출</option>
                          <option value="income">수입</option>
                          <option value="both">수입/지출</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 아이콘 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          아이콘
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                            {formData.icon}
                          </div>
                          <Input
                            value={formData.icon}
                            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                            placeholder="이모지를 입력하세요"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      {/* 색상 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          색상
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-10 h-10 rounded-lg border-2 border-gray-200"
                              style={{ backgroundColor: formData.color }}
                            />
                            <Input
                              type="color"
                              value={formData.color}
                              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                              className="w-20 h-10 p-1 border-gray-200"
                            />
                          </div>
                          
                          {/* 색상 팔레트 */}
                          <div className="grid grid-cols-8 gap-1">
                            {colorPalette.map((color, index) => (
                              <button
                                key={index}
                                className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                                style={{ 
                                  backgroundColor: color,
                                  borderColor: formData.color === color ? '#374151' : 'transparent'
                                }}
                                onClick={() => setFormData(prev => ({ ...prev, color }))}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleCreateCategory}
                        disabled={!formData.name.trim()}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isCreating ? '생성' : '저장'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        취소
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 카테고리 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    카테고리 목록 ({filteredCategories.length}개)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredCategories.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        카테고리가 없습니다
                      </h3>
                      <p className="text-gray-500 mb-4">
                        새로운 카테고리를 추가해보세요
                      </p>
                      <Button onClick={() => setIsCreating(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        첫 카테고리 추가하기
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCategories.map((category) => {
                        const stats = getCategoryStats(category.id)
                        return (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {/* 카테고리 아이콘 */}
                              <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.icon}
                              </div>
                              
                              {/* 카테고리 정보 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-gray-900">
                                    {category.name}
                                  </h3>
                                  <Badge 
                                    variant={category.type === 'income' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {category.type === 'income' ? '수입' : '지출'}
                                  </Badge>
                                  {category.isDefault && (
                                    <Badge variant="outline" className="text-xs">기본</Badge>
                                  )}
                                </div>
                                
                                {stats && (
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>{formatAmount(stats.totalAmount)}</span>
                                    <span>{stats.transactionCount}건</span>
                                    <span>{stats.percentage.toFixed(1)}%</span>
                                    <div className="flex items-center gap-1">
                                      {getTrendIcon(stats.trend)}
                                      <span className="text-xs">
                                        {stats.lastUsed.toLocaleDateString('ko-KR')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditing(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!category.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteCategory(category.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* 사용 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">사용 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {categories.length}개
                      </div>
                      <div className="text-sm text-gray-500">전체 카테고리</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-bold text-green-600">
                          {categories.filter(c => c.type === 'income').length}
                        </div>
                        <div className="text-xs text-gray-500">수입</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="font-bold text-red-600">
                          {categories.filter(c => c.type === 'expense').length}
                        </div>
                        <div className="text-xs text-gray-500">지출</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ResponsiveLayout>

      {/* 빠른입력 모달 */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={async () => {}}
        categories={categories}
        templates={[]}
      />
    </>
  )
}
