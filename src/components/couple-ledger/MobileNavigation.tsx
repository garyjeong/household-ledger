'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, List, BarChart3, User, Home, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MobileNavigationProps {
  onQuickAddClick: () => void
  className?: string
}

// 네비게이션 아이템 정의
const navigationItems = [
  {
    id: 'dashboard',
    label: '홈',
    href: '/',
    icon: Home,
    description: '월요약 대시보드',
  },
  {
    id: 'transactions',
    label: '거래내역',
    href: '/transactions',
    icon: List,
    description: '수입/지출 내역',
  },
  {
    id: 'statistics',
    label: '통계',
    href: '/statistics',
    icon: BarChart3,
    description: '월별 통계',
  },
  {
    id: 'categories',
    label: '카테고리',
    href: '/categories',
    icon: Receipt,
    description: '카테고리 관리',
  },
  {
    id: 'profile',
    label: '내정보',
    href: '/profile',
    icon: User,
    description: '프로필 및 설정',
  },
]

/**
 * 신혼부부 가계부 전용 모바일 하단 네비게이션
 *
 * 구성:
 * - 5개 주요 탭: 홈, 거래내역, 통계, 카테고리, 내정보
 * - 중앙 플로팅 "+" 버튼: 빠른입력 모달
 * - 터치 최적화 48px 터치 타겟
 * - 활성 상태 시각적 표시
 */
export function MobileNavigation({ onQuickAddClick, className = '' }: MobileNavigationProps) {
  const pathname = usePathname()

  // 현재 활성 경로 확인
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe ${className}`}
    >
      <div className='flex items-center justify-around relative'>
        {/* 모든 네비게이션 아이템을 균등하게 배치 */}
        {navigationItems.map(item => {
          const IconComponent = item.icon
          const active = isActive(item.href)

          return (
            <Link key={item.id} href={item.href} className='flex-1'>
              <div
                className={`
                  flex flex-col items-center justify-center h-16 text-xs transition-all duration-200 min-h-[44px] min-w-[44px] relative
                  ${active ? 'text-blue-500' : 'text-gray-500 hover:text-gray-900'}
                `}
              >
                <IconComponent className={`h-4 w-4 mb-1 ${active ? 'animate-pulse' : ''}`} />
                <span className='text-xs font-medium truncate max-w-full'>{item.label}</span>
                {active && (
                  <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-500 rounded-full' />
                )}
              </div>
            </Link>
          )
        })}

        {/* 플로팅 빠른 입력 버튼 - 우상단에 배치 */}
        <Button
          onClick={onQuickAddClick}
          className='
            fixed bottom-20 right-4 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg
            transform transition-all duration-200 hover:scale-105 active:scale-95
            flex items-center justify-center z-50
          '
        >
          <Plus className='h-5 w-5' />
        </Button>
      </div>
    </nav>
  )
}

// 모바일 네비게이션 래퍼 (페이지별 사용)
export function MobileNavigationWrapper({
  children,
  onQuickAddClick,
  showNavigation = true,
}: {
  children: React.ReactNode
  onQuickAddClick: () => void
  showNavigation?: boolean
}) {
  return (
    <div className='min-h-screen bg-gray-50 pb-20'>
      {/* 메인 컨텐츠 */}
      <main className='relative z-0'>{children}</main>

      {/* 모바일 네비게이션 */}
      {showNavigation && <MobileNavigation onQuickAddClick={onQuickAddClick} />}
    </div>
  )
}

// 네비게이션 상태 관리를 위한 커스텀 훅
export function useNavigation() {
  const pathname = usePathname()

  const getCurrentPage = () => {
    const item = navigationItems.find(item => {
      if (item.href === '/') {
        return pathname === '/'
      }
      return pathname.startsWith(item.href)
    })
    return item?.id || 'dashboard'
  }

  const getPageTitle = () => {
    const item = navigationItems.find(item => {
      if (item.href === '/') {
        return pathname === '/'
      }
      return pathname.startsWith(item.href)
    })
    return item?.label || '우리집 가계부'
  }

  return {
    currentPage: getCurrentPage(),
    pageTitle: getPageTitle(),
    navigationItems,
    pathname,
  }
}
