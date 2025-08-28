/**
 * 카테고리 아이콘 선택 컴포넌트
 * T-025: 설정 하위 메뉴 - 카테고리 관리
 */

'use client'

import React, { useState } from 'react'
import {
  // 일반적인 아이콘들
  Home,
  Car,
  Utensils,
  ShoppingCart,
  Coffee,
  Gift,
  Heart,
  Zap,
  Gamepad2,
  Music,
  Headphones,
  Camera,
  Book,
  Dumbbell,
  Plane,
  Bus,

  // 금융 관련
  DollarSign,
  CreditCard,
  Wallet,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Calculator,
  Receipt,
  Banknote,
  Coins,
  HandCoins,

  // 카테고리별
  Shirt,
  ShoppingBag,
  Laptop,
  Smartphone,
  Monitor,
  Keyboard,
  Stethoscope,
  Pill,
  Activity,
  Apple,
  Pizza,
  Wine,
  Soup,
  GraduationCap,
  BookOpen,
  School,
  Briefcase,
  Building,
  Fuel,
  Wrench,
  Settings,
  Lightbulb,
  Wifi,
  Phone,

  // UI 아이콘들
  Search,
  Check,
  X,
  Grid3X3,

  // 기타
  Star,
  Crown,
  Diamond,
  Shield,
  Lock,
  Key,
  Flag,
  Award,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 아이콘 타입 정의
type IconComponent = React.ComponentType<{ className?: string }>

interface IconOption {
  name: string
  icon: IconComponent
  keywords: string[]
}

// 아이콘 카테고리 정의
const ICON_CATEGORIES = {
  general: {
    label: '일반',
    icons: [
      { name: 'Home', icon: Home, keywords: ['집', '홈', '주거', '임대료'] },
      { name: 'Car', icon: Car, keywords: ['자동차', '차', '교통', '기름'] },
      { name: 'Utensils', icon: Utensils, keywords: ['식당', '음식', '식비', '외식'] },
      { name: 'ShoppingCart', icon: ShoppingCart, keywords: ['쇼핑', '장보기', '마트'] },
      { name: 'Coffee', icon: Coffee, keywords: ['커피', '카페', '음료'] },
      { name: 'Gift', icon: Gift, keywords: ['선물', '축하', '기념일'] },
      { name: 'Heart', icon: Heart, keywords: ['사랑', '데이트', '연인'] },
      { name: 'Zap', icon: Zap, keywords: ['전기', '에너지', '공과금'] },
    ] as IconOption[],
  },
  finance: {
    label: '금융',
    icons: [
      { name: 'DollarSign', icon: DollarSign, keywords: ['돈', '수입', '급여'] },
      { name: 'CreditCard', icon: CreditCard, keywords: ['카드', '결제', '신용카드'] },
      { name: 'Wallet', icon: Wallet, keywords: ['지갑', '현금', '용돈'] },
      { name: 'PiggyBank', icon: PiggyBank, keywords: ['저축', '적금', '예금'] },
      { name: 'TrendingUp', icon: TrendingUp, keywords: ['투자', '수익', '주식'] },
      { name: 'TrendingDown', icon: TrendingDown, keywords: ['손실', '지출', '감소'] },
      { name: 'Calculator', icon: Calculator, keywords: ['계산', '회계', '세금'] },
      { name: 'Receipt', icon: Receipt, keywords: ['영수증', '기록', '영수건'] },
      { name: 'Banknote', icon: Banknote, keywords: ['지폐', '현금', '돈'] },
      { name: 'Coins', icon: Coins, keywords: ['동전', '잔돈', '화폐'] },
      { name: 'HandCoins', icon: HandCoins, keywords: ['용돈', '기부', '후원'] },
    ] as IconOption[],
  },
  lifestyle: {
    label: '생활',
    icons: [
      { name: 'Shirt', icon: Shirt, keywords: ['옷', '의류', '패션', '쇼핑'] },
      { name: 'ShoppingBag', icon: ShoppingBag, keywords: ['쇼핑백', '구매', '소비'] },
      { name: 'Laptop', icon: Laptop, keywords: ['노트북', '컴퓨터', 'IT'] },
      { name: 'Smartphone', icon: Smartphone, keywords: ['스마트폰', '휴대폰', '통신'] },
      { name: 'Monitor', icon: Monitor, keywords: ['모니터', '화면', '전자제품'] },
      { name: 'Keyboard', icon: Keyboard, keywords: ['키보드', '컴퓨터', '액세서리'] },
      { name: 'Gamepad2', icon: Gamepad2, keywords: ['게임', '오락', '엔터테인먼트'] },
      { name: 'Music', icon: Music, keywords: ['음악', '노래', '스트리밍'] },
      { name: 'Headphones', icon: Headphones, keywords: ['헤드폰', '이어폰', '음향'] },
      { name: 'Camera', icon: Camera, keywords: ['카메라', '사진', '촬영'] },
      { name: 'Book', icon: Book, keywords: ['책', '독서', '서적'] },
      { name: 'Dumbbell', icon: Dumbbell, keywords: ['운동', '헬스', '피트니스'] },
    ] as IconOption[],
  },
  food: {
    label: '음식',
    icons: [
      { name: 'Apple', icon: Apple, keywords: ['과일', '건강', '간식'] },
      { name: 'Pizza', icon: Pizza, keywords: ['피자', '배달', '패스트푸드'] },
      { name: 'Wine', icon: Wine, keywords: ['술', '와인', '주류'] },
      { name: 'Soup', icon: Soup, keywords: ['수프', '국물', '요리'] },
    ] as IconOption[],
  },
  transport: {
    label: '교통',
    icons: [
      { name: 'Plane', icon: Plane, keywords: ['비행기', '항공', '여행'] },
      { name: 'Bus', icon: Bus, keywords: ['버스', '대중교통', '교통비'] },
      { name: 'Fuel', icon: Fuel, keywords: ['주유', '기름', '연료'] },
    ] as IconOption[],
  },
  education: {
    label: '교육',
    icons: [
      { name: 'GraduationCap', icon: GraduationCap, keywords: ['졸업', '학위', '교육'] },
      { name: 'BookOpen', icon: BookOpen, keywords: ['공부', '학습', '교재'] },
      { name: 'School', icon: School, keywords: ['학교', '교육기관', '수업료'] },
      { name: 'Briefcase', icon: Briefcase, keywords: ['직장', '업무', '사업'] },
      { name: 'Building', icon: Building, keywords: ['건물', '사무실', '임대'] },
    ] as IconOption[],
  },
  health: {
    label: '건강',
    icons: [
      { name: 'Stethoscope', icon: Stethoscope, keywords: ['병원', '의료', '진료'] },
      { name: 'Pill', icon: Pill, keywords: ['약', '의약품', '치료'] },
      { name: 'Activity', icon: Activity, keywords: ['활동', '건강', '운동'] },
    ] as IconOption[],
  },
  utilities: {
    label: '공과금',
    icons: [
      { name: 'Lightbulb', icon: Lightbulb, keywords: ['전기', '전력', '조명'] },
      { name: 'Wifi', icon: Wifi, keywords: ['인터넷', '와이파이', '통신'] },
      { name: 'Phone', icon: Phone, keywords: ['전화', '통신비', '휴대폰'] },
      { name: 'Wrench', icon: Wrench, keywords: ['수리', '공구', '관리비'] },
      { name: 'Settings', icon: Settings, keywords: ['설정', '관리', '시스템'] },
    ] as IconOption[],
  },
  special: {
    label: '특별',
    icons: [
      { name: 'Star', icon: Star, keywords: ['별', '즐겨찾기', '특별'] },
      { name: 'Crown', icon: Crown, keywords: ['왕관', '프리미엄', '특별'] },
      { name: 'Diamond', icon: Diamond, keywords: ['다이아몬드', '보석', '럭셔리'] },
      { name: 'Shield', icon: Shield, keywords: ['방패', '보험', '보호'] },
      { name: 'Lock', icon: Lock, keywords: ['잠금', '보안', '안전'] },
      { name: 'Key', icon: Key, keywords: ['열쇠', '접근', '권한'] },
      { name: 'Flag', icon: Flag, keywords: ['깃발', '목표', '성취'] },
      { name: 'Award', icon: Award, keywords: ['상', '성취', '보상'] },
    ] as IconOption[],
  },
}

interface IconSelectorProps {
  value: string
  onChange: (iconName: string) => void
  title?: string
  className?: string
}

export function IconSelector({
  value,
  onChange,
  title = '아이콘 선택',
  className = '',
}: IconSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('general')

  // 선택된 아이콘 찾기
  const getSelectedIcon = (): IconOption | null => {
    for (const category of Object.values(ICON_CATEGORIES)) {
      const icon = category.icons.find(icon => icon.name === value)
      if (icon) return icon
    }
    return null
  }

  // 검색 필터링
  const getFilteredIcons = (categoryIcons: IconOption[]): IconOption[] => {
    if (!searchQuery) return categoryIcons

    const query = searchQuery.toLowerCase()
    return categoryIcons.filter(
      icon =>
        icon.name.toLowerCase().includes(query) ||
        icon.keywords.some(keyword => keyword.includes(query))
    )
  }

  // 전체 검색 결과
  const getAllSearchResults = (): IconOption[] => {
    if (!searchQuery) return []

    const results: IconOption[] = []
    Object.values(ICON_CATEGORIES).forEach(category => {
      results.push(...getFilteredIcons(category.icons))
    })
    return results
  }

  const selectedIcon = getSelectedIcon()
  const searchResults = getAllSearchResults()

  return (
    <Card className={className}>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2 text-lg'>
          {selectedIcon ? (
            <selectedIcon.icon className='h-5 w-5' />
          ) : (
            <Grid3X3 className='h-5 w-5' />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 현재 선택된 아이콘 */}
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div className='flex items-center gap-3'>
            {selectedIcon ? (
              <>
                <selectedIcon.icon className='h-8 w-8 text-gray-700' />
                <div>
                  <p className='font-medium text-gray-900'>{selectedIcon.name}</p>
                  <p className='text-sm text-gray-500'>
                    {selectedIcon.keywords.slice(0, 3).join(', ')}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className='w-8 h-8 bg-gray-300 rounded flex items-center justify-center'>
                  <X className='h-4 w-4 text-gray-500' />
                </div>
                <div>
                  <p className='font-medium text-gray-900'>아이콘 없음</p>
                  <p className='text-sm text-gray-500'>아이콘을 선택해주세요</p>
                </div>
              </>
            )}
          </div>
          {selectedIcon && <Badge variant='outline'>{selectedIcon.name}</Badge>}
        </div>

        {/* 검색 */}
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>아이콘 검색</Label>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='아이콘 이름이나 키워드 검색...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {/* 검색 결과 또는 카테고리별 아이콘 */}
        {searchQuery ? (
          <div className='space-y-3'>
            <Label className='text-sm font-medium'>검색 결과 ({searchResults.length}개)</Label>
            {searchResults.length > 0 ? (
              <div className='grid grid-cols-8 gap-2'>
                {searchResults.map(icon => {
                  const Icon = icon.icon
                  const isSelected = value === icon.name

                  return (
                    <button
                      key={icon.name}
                      className={`p-3 rounded-lg border transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => onChange(icon.name)}
                      title={`${icon.name} - ${icon.keywords.join(', ')}`}
                    >
                      <Icon
                        className={`h-5 w-5 mx-auto ${
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        }`}
                      />
                      {isSelected && <Check className='h-3 w-3 text-blue-600 mx-auto mt-1' />}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <Search className='h-8 w-8 mx-auto mb-2 text-gray-400' />
                <p>검색 결과가 없습니다</p>
              </div>
            )}
          </div>
        ) : (
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className='grid grid-cols-4 lg:grid-cols-8 w-full'>
              {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className='text-xs'>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
              <TabsContent key={key} value={key} className='mt-4'>
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>
                    {category.label} ({category.icons.length}개)
                  </Label>
                  <div className='grid grid-cols-8 gap-2'>
                    {category.icons.map(icon => {
                      const Icon = icon.icon
                      const isSelected = value === icon.name

                      return (
                        <button
                          key={icon.name}
                          className={`p-3 rounded-lg border transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => onChange(icon.name)}
                          title={`${icon.name} - ${icon.keywords.join(', ')}`}
                        >
                          <Icon
                            className={`h-5 w-5 mx-auto ${
                              isSelected ? 'text-blue-600' : 'text-gray-600'
                            }`}
                          />
                          {isSelected && <Check className='h-3 w-3 text-blue-600 mx-auto mt-1' />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* 아이콘 없음 옵션 */}
        <div className='pt-4 border-t'>
          <Button
            variant={!value ? 'default' : 'outline'}
            size='sm'
            onClick={() => onChange('')}
            className='gap-2'
          >
            <X className='h-4 w-4' />
            아이콘 없음
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
