'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Star, Plus, TrendingUp, Coffee, Car, Home, ShoppingBag, Utensils, Heart, Plane, Gift, CreditCard, Calculator } from 'lucide-react'
import { CategoryPickerProps, Category } from '@/types/couple-ledger'

// 카테고리 아이콘 매핑
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  food: Utensils,
  coffee: Coffee,
  transport: Car,
  home: Home,
  shopping: ShoppingBag,
  health: Heart,
  travel: Plane,
  gift: Gift,
  card: CreditCard,
  finance: Calculator,
  trend: TrendingUp,
  star: Star,
  plus: Plus,
}

// 한글 초성 추출 함수
function getKoreanInitials(text: string): string {
  const initials = []
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    if (char >= 0xAC00 && char <= 0xD7A3) {
      // 한글 완성형 범위
      const initial = Math.floor((char - 0xAC00) / 588)
      const initialChars = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
      initials.push(initialChars[initial])
    }
  }
  return initials.join('')
}

// 검색 매칭 함수
function matchesSearch(category: Category, searchQuery: string): boolean {
  const query = searchQuery.toLowerCase().trim()
  if (!query) return true

  const name = category.name.toLowerCase()
  const initials = getKoreanInitials(category.name).toLowerCase()

  return name.includes(query) || initials.includes(query)
}

/**
 * 신혼부부 가계부 전용 카테고리 선택 컴포넌트
 * - 최근 사용 카테고리 6개 칩 표시
 * - 즐겨찾기 카테고리 우선 표시
 * - 한글 초성 검색 지원
 * - 카테고리별 색상 및 아이콘
 */
export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  type = 'expense',
  showFavorites = true,
  recentCategories = [],
}: CategoryPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  // 타입별 카테고리 필터링
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.type === type)
  }, [categories, type])

  // 검색된 카테고리
  const searchedCategories = useMemo(() => {
    return filteredCategories.filter(cat => matchesSearch(cat, searchQuery))
  }, [filteredCategories, searchQuery])

  // 최근 사용 카테고리 (최대 6개)
  const recentCategoriesData = useMemo(() => {
    return recentCategories
      .map(id => filteredCategories.find(cat => cat.id === id))
      .filter(Boolean)
      .slice(0, 6) as Category[]
  }, [recentCategories, filteredCategories])

  // 즐겨찾기 카테고리
  const favoriteCategories = useMemo(() => {
    return filteredCategories.filter(cat => cat.favorite)
  }, [filteredCategories])

  // 일반 카테고리 (즐겨찾기 제외)
  const regularCategories = useMemo(() => {
    return filteredCategories.filter(cat => !cat.favorite)
  }, [filteredCategories])

  // 카테고리 선택 핸들러
  const handleSelect = useCallback((categoryId: string) => {
    onSelect(categoryId)
  }, [onSelect])

  // 아이콘 렌더링
  const renderIcon = useCallback((iconName: string, className = 'h-4 w-4') => {
    const IconComponent = categoryIcons[iconName] || ShoppingBag
    return <IconComponent className={className} />
  }, [])

  // 카테고리 버튼 렌더링
  const renderCategoryButton = useCallback((category: Category, size: 'sm' | 'md' = 'md') => {
    const isSelected = selectedId === category.id
    const buttonSizeClass = size === 'sm' ? 'h-12 px-3 text-sm' : 'h-14 px-4 text-base'
    
    return (
      <Button
        key={category.id}
        type="button"
        variant={isSelected ? 'default' : 'outline'}
        onClick={() => handleSelect(category.id)}
        className={`
          ${buttonSizeClass} 
          flex items-center gap-2 rounded-button transition-all duration-200
          ${isSelected 
            ? 'bg-primary text-white shadow-couple-hover' 
            : 'border-gray-200 hover:border-blue-500/50 hover:bg-gray-50'
          }
          ${size === 'sm' ? 'touch-target-sm' : 'touch-target'}
        `}
        style={{
          borderColor: !isSelected ? category.color + '40' : undefined,
          backgroundColor: isSelected ? category.color : undefined,
        }}
      >
        {renderIcon(category.icon, size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')}
        <span className="font-medium">{category.name}</span>
        {category.favorite && (
          <Star className="h-3 w-3 ml-auto text-warning" fill="currentColor" />
        )}
      </Button>
    )
  }, [selectedId, handleSelect, renderIcon])

  return (
    <div className="space-y-4">
      {/* 최근 사용 카테고리 칩 */}
      {recentCategoriesData.length > 0 && !searchQuery && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-secondary">최근 사용</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {recentCategoriesData.map(category => (
              <Button
                key={category.id}
                type="button"
                variant={selectedId === category.id ? 'default' : 'outline'}
                onClick={() => handleSelect(category.id)}
                className="h-10 px-2 text-xs flex items-center gap-1.5 justify-center"
                style={{
                  borderColor: selectedId !== category.id ? category.color + '40' : undefined,
                  backgroundColor: selectedId === category.id ? category.color : undefined,
                }}
              >
                {renderIcon(category.icon, 'h-3 w-3')}
                <span className="truncate">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          type="text"
          placeholder="카테고리 검색 (초성 검색 가능)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* 검색 결과 또는 카테고리 목록 */}
      {searchQuery ? (
        // 검색 모드
        <div className="space-y-3">
          {searchedCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchedCategories.map(category => renderCategoryButton(category))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>'{searchQuery}'에 대한 카테고리를 찾을 수 없습니다</p>
            </div>
          )}
        </div>
      ) : (
        // 일반 모드
        <div className="space-y-6">
          {/* 즐겨찾기 카테고리 */}
          {showFavorites && favoriteCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" fill="currentColor" />
                <span className="text-sm font-medium text-text-secondary">즐겨찾기</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoriteCategories.map(category => renderCategoryButton(category))}
              </div>
            </div>
          )}

          {/* 일반 카테고리 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">전체 카테고리</span>
              {regularCategories.length > 8 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  {showAll ? '접기' : '더보기'}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(showAll ? regularCategories : regularCategories.slice(0, 8)).map(category => 
                renderCategoryButton(category)
              )}
            </div>
          </div>
        </div>
      )}

      {/* 새 카테고리 추가 버튼 */}
      <Card className="border-dashed border-2 border-gray-300 hover:border-blue-500/50 transition-colors">
        <CardContent className="p-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full h-12 flex items-center gap-2 text-text-secondary hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            <span>새 카테고리 추가</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// 기본 카테고리 데이터 (임시)
export const defaultCategories: Category[] = [
  { id: '1', name: '식비', color: '#EF4444', icon: 'food', type: 'expense', favorite: true },
  { id: '2', name: '커피/음료', color: '#F59E0B', icon: 'coffee', type: 'expense', favorite: true },
  { id: '3', name: '교통비', color: '#3B82F6', icon: 'transport', type: 'expense', favorite: true },
  { id: '4', name: '생활용품', color: '#10B981', icon: 'home', type: 'expense' },
  { id: '5', name: '쇼핑', color: '#EC4899', icon: 'shopping', type: 'expense' },
  { id: '6', name: '의료/건강', color: '#EF4444', icon: 'health', type: 'expense' },
  { id: '7', name: '여행/숙박', color: '#8B5CF6', icon: 'travel', type: 'expense' },
  { id: '8', name: '선물/경조사', color: '#F59E0B', icon: 'gift', type: 'expense' },
  { id: '9', name: '급여', color: '#10B981', icon: 'finance', type: 'income', favorite: true },
  { id: '10', name: '용돈', color: '#3B82F6', icon: 'finance', type: 'income' },
]
