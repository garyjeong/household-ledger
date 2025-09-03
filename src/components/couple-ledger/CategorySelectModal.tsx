'use client'

import React, { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, Sparkles } from 'lucide-react'
import { CategoryResponse } from '@/lib/schemas/category'

interface CategorySelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (categoryId: string) => void
  categories: CategoryResponse[]
  selectedId?: string
  type?: 'EXPENSE' | 'INCOME' | 'TRANSFER'
}

export function CategorySelectModal({
  isOpen,
  onClose,
  onSelect,
  categories,
  selectedId,
  type = 'EXPENSE',
}: CategorySelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // 타입별 카테고리 필터링
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.type === type)
  }, [categories, type])

  // 검색 필터링
  const searchedCategories = useMemo(() => {
    if (!searchQuery.trim()) return filteredCategories

    const query = searchQuery.toLowerCase()
    return filteredCategories.filter(cat =>
      cat.name.toLowerCase().includes(query)
    )
  }, [filteredCategories, searchQuery])

  // 기본 카테고리와 커스텀 카테고리 분리
  const defaultCategories = useMemo(() => {
    return searchedCategories.filter(cat => cat.isDefault)
  }, [searchedCategories])

  const customCategories = useMemo(() => {
    return searchedCategories.filter(cat => !cat.isDefault)
  }, [searchedCategories])

  const handleCategorySelect = (categoryId: string) => {
    onSelect(categoryId)
    onClose()
  }

  const handleClose = () => {
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-md max-h-[80vh] p-0"
      >
        {/* 헤더 */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              카테고리 선택
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* 검색 입력 */}
        <div className="p-6 pt-4 pb-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="카테고리 검색..."
              className="pl-10 h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 카테고리 목록 */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
          {/* 기본 카테고리 */}
          {defaultCategories.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  기본 카테고리
                </Badge>
                <span className="text-xs text-slate-500">{defaultCategories.length}개</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {defaultCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedId === category.id ? "default" : "outline"}
                    onClick={() => handleCategorySelect(category.id)}
                    className="min-h-14 h-auto flex flex-col items-center justify-center gap-1 text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors p-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                    <span className="text-center leading-tight w-full break-words">{category.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 커스텀 카테고리 */}
          {customCategories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs px-2 py-1 border-blue-200 text-blue-700">
                  내 카테고리
                </Badge>
                <span className="text-xs text-slate-500">{customCategories.length}개</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {customCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedId === category.id ? "default" : "outline"}
                    onClick={() => handleCategorySelect(category.id)}
                    className="min-h-14 h-auto flex flex-col items-center justify-center gap-1 text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors p-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color || '#6B7280' }}
                    />
                    <span className="text-center leading-tight w-full break-words">{category.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 검색 결과 없음 */}
          {searchedCategories.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-slate-500 text-sm">
                {searchQuery.trim() 
                  ? `"${searchQuery}"에 대한 검색 결과가 없습니다`
                  : '사용 가능한 카테고리가 없습니다'
                }
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
