'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  List,
  BarChart3,
  User,
  Receipt,
  Users,
  ChevronLeft,
  ChevronRight,
  Heart,
  Zap,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigation, MobileNavigation } from './MobileNavigation'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { QuickAddModal } from './QuickAddModal'
import { useToast } from '@/hooks/use-toast'

interface DesktopSidebarProps {
  onQuickAddClick: () => void
  className?: string
}

// 사이드바 네비게이션 메뉴 구조
const sidebarMenu = [
  {
    section: '메인',
    items: [
      {
        id: 'dashboard',
        label: '월별 대시보드',
        href: '/',
        icon: Home,
        description: '이번 달 수입/지출 요약',
        badge: null,
      },
      {
        id: 'transactions',
        label: '거래내역',
        href: '/transactions',
        icon: List,
        description: '모든 수입/지출 내역',
        badge: null,
      },
      {
        id: 'statistics',
        label: '월별 통계',
        href: '/statistics',
        icon: BarChart3,
        description: '카테고리별 지출 분석',
        badge: null,
      },
    ],
  },
  {
    section: '설정',
    items: [
      {
        id: 'profile',
        label: '내 정보',
        href: '/profile',
        icon: User,
        description: '프로필 및 기본 설정',
        badge: null,
      },
      {
        id: 'groups',
        label: '그룹 관리',
        href: '/groups',
        icon: Users,
        description: '가족 그룹 생성 및 관리',
        badge: null,
      },
      {
        id: 'categories',
        label: '카테고리',
        href: '/categories',
        icon: Receipt,
        description: '수입/지출 카테고리 관리',
        badge: null,
      },
    ],
  },
]

/**
 * 신혼부부 가계부 전용 데스크탑 사이드바
 *
 * 특징:
 * - 접기/펼치기 토글 가능
 * - 섹션별 메뉴 그룹화
 * - 빠른입력 버튼 상단 고정
 * - 활성 메뉴 시각적 표시
 * - 마우스 호버 효과
 */
export function DesktopSidebar({ onQuickAddClick, className = '' }: DesktopSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { currentPage } = useNavigation()
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { currentGroup } = useGroup()

  // 현재 활성 경로 확인
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  // 로그아웃 처리
  const handleLogout = () => {
    const confirmed = window.confirm('정말 로그아웃하시겠습니까?')
    if (confirmed) {
      logout()
    }
  }

  return (
    <aside
      className={`
        fixed left-0 top-0 z-10 h-full transition-all duration-300 bg-white border-r border-gray-200
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${className}
      `}
    >
      <div className='h-full flex flex-col'>
        {/* 헤더 */}
        <div className='p-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            {!isCollapsed && (
              <div className='flex items-center gap-2'>
                <Heart className='h-6 w-6 text-blue-500' />
                <h1 className='text-lg font-bold text-gray-900'>우리집 가계부</h1>
              </div>
            )}
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setIsCollapsed(!isCollapsed)}
              className='h-8 w-8 p-0 hover:bg-gray-50'
            >
              {isCollapsed ? (
                <ChevronRight className='h-4 w-4' />
              ) : (
                <ChevronLeft className='h-4 w-4' />
              )}
            </Button>
          </div>
        </div>

        {/* 빠른입력 버튼 */}
        <div className='p-4'>
          <Button
            onClick={onQuickAddClick}
            className={`
              w-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md
              ${isCollapsed ? 'h-12 p-0' : 'h-12 justify-start gap-2'}
              transition-all duration-200
            `}
          >
            <Zap className='h-5 w-5' />
            {!isCollapsed && '빠른 입력'}
          </Button>
        </div>

        {/* 메뉴 */}
        <nav className='flex-1 overflow-y-auto px-4 pb-4'>
          <div className='space-y-6'>
            {sidebarMenu.map(section => (
              <div key={section.section}>
                {/* 섹션 제목 */}
                {!isCollapsed && (
                  <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3'>
                    {section.section}
                  </h3>
                )}

                {/* 메뉴 아이템들 */}
                <div className='space-y-1'>
                  {section.items.map(item => {
                    const IconComponent = item.icon
                    const active = isActive(item.href)

                    return (
                      <Link key={item.id} href={item.href}>
                        <div
                          className={`
                            group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                            ${
                              active
                                ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }
                            ${isCollapsed ? 'justify-center' : 'justify-start'}
                          `}
                        >
                          <IconComponent
                            className={`
                              h-5 w-5 flex-shrink-0 transition-transform duration-200
                              ${active ? 'text-blue-600' : 'group-hover:scale-110'}
                            `}
                          />

                          {!isCollapsed && (
                            <>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between'>
                                  <span className='truncate'>{item.label}</span>
                                  {item.badge && (
                                    <Badge variant='secondary' className='ml-2 text-xs'>
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                <p className='text-xs text-gray-400 truncate mt-0.5'>
                                  {item.description}
                                </p>
                              </div>
                            </>
                          )}

                          {/* 활성 상태 표시기 */}
                          {active && !isCollapsed && (
                            <div className='w-1 h-6 bg-blue-500 rounded-full' />
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* 사용자 정보 */}
        {!isCollapsed && user && (
          <div className='p-4 border-t border-gray-200'>
            <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm'>
              <CardContent className='p-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                    <User className='h-4 w-4 text-white' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {user.nickname || user.email}
                    </p>
                    <p className='text-xs text-gray-500 truncate'>
                      {currentGroup ? currentGroup.name : '그룹 없음'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 구분선과 로그아웃 버튼 */}
        <div className='border-t border-gray-200'>
          <div className='p-4'>
            <Button
              onClick={handleLogout}
              variant='ghost'
              className={`
                w-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200
                ${isCollapsed ? 'h-12 p-0' : 'h-10 justify-start gap-3'}
              `}
            >
              <LogOut className='h-4 w-4' />
              {!isCollapsed && '로그아웃'}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

// 데스크탑 레이아웃 래퍼
export function DesktopLayout({
  children,
  onQuickAddClick,
  showSidebar = true,
}: {
  children: React.ReactNode
  onQuickAddClick: () => void
  showSidebar?: boolean
}) {
  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* 데스크탑 사이드바 */}
      {showSidebar && <DesktopSidebar onQuickAddClick={onQuickAddClick} />}

      {/* 메인 컨텐츠 */}
      <main className='flex-1 overflow-hidden ml-64'>
        <div className='h-full overflow-y-auto'>{children}</div>
      </main>
    </div>
  )
}

// 반응형 레이아웃 래퍼 (모바일 + 데스크탑)
export function ResponsiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { toast } = useToast()
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // 빠른입력 모달 열기
  const handleQuickAddClick = () => {
    setIsQuickAddOpen(true)
  }

  // 빠른입력 모달 닫기
  const handleQuickAddClose = () => {
    setIsQuickAddOpen(false)
  }

  // 거래 저장 핸들러
  const handleSaveTransaction = async (
    transaction: any // 실제 Transaction 타입 사용
  ) => {
    try {
      // TODO: 실제 거래 저장 API 호출 구현
      console.log('거래 저장 API 구현 필요:', transaction)

      toast({
        title: '성공',
        description: '거래가 성공적으로 저장되었습니다.',
      })

      // 모달 닫기
      setIsQuickAddOpen(false)

      return Promise.resolve()
    } catch (error) {
      console.error('거래 저장 실패:', error)
      toast({
        title: '오류',
        description: '거래 저장에 실패했습니다.',
        variant: 'destructive',
      })
      throw error
    }
  }

  return (
    <>
      {/* 모바일 레이아웃 (md 미만에서만 표시) */}
      <div className='block md:hidden'>
        <MobileNavigationWrapper onQuickAddClick={handleQuickAddClick}>
          {children}
        </MobileNavigationWrapper>
      </div>

      {/* 데스크탑 레이아웃 (md 이상에서만 표시) */}
      <div className='hidden md:block'>
        <DesktopLayout onQuickAddClick={handleQuickAddClick}>{children}</DesktopLayout>
      </div>

      {/* 빠른입력 모달 - 모든 페이지에서 공통 사용 */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={handleQuickAddClose}
        onSave={handleSaveTransaction}
        templates={[]} // 템플릿 기능 향후 구현 예정
      />
    </>
  )
}

// 모바일 네비게이션 래퍼 (로컬 정의)
function MobileNavigationWrapper({
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
