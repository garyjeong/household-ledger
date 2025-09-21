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
  Repeat,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigation, MobileNavigation } from './MobileNavigation'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { QuickAddModal } from './QuickAddModal'
import { SuccessModal } from '@/components/ui/success-modal'
import { useToast } from '@/hooks/use-toast'
import { LogoutConfirmDialog } from '@/components/ui/logout-confirm-dialog'
import { useQuickAddTransaction } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'

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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
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
    setShowLogoutDialog(true)
  }

  // 로그아웃 확인
  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false)
    logout()
  }

  // 로그아웃 취소
  const handleLogoutCancel = () => {
    setShowLogoutDialog(false)
  }

  return (
    <>
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
          {isCollapsed ? (
            /* 접힌 상태: 화살표 버튼만 중앙에 표시 */
            <div className='flex items-center justify-center'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='h-8 w-8 p-0 hover:bg-gray-50 rounded-lg transition-colors'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          ) : (
            /* 펼쳐진 상태: 로고와 접기 버튼 양쪽 배치 */
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Heart className='h-6 w-6 text-blue-500' />
                <h1 className='text-lg font-bold text-gray-900'>우리집 가계부</h1>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='h-8 w-8 p-0 hover:bg-gray-50 rounded-lg transition-colors'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
            </div>
          )}
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
          <div className='p-3 border-t border-gray-200'>
            <div className='flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
              <div className='w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0'>
                <User className='h-4 w-4 text-white' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 truncate'>
                  {user.nickname || user.email}
                </p>
              </div>
            </div>
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

      {/* 로그아웃 확인 모달 */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </>
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
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [savedTransactionData, setSavedTransactionData] = useState<{
    amount: number
    category: string
    type: 'INCOME' | 'EXPENSE'
    date: string
    memo?: string
  } | null>(null)
  const quickAddMutation = useQuickAddTransaction()
  const { currentGroup } = useGroup()
  const { data: categoriesData } = useCategories(currentGroup ? { groupId: currentGroup.id } : null)
  const categories = categoriesData?.categories || []

  // 빠른입력 모달 열기
  const handleQuickAddClick = () => {
    setIsQuickAddOpen(true)
  }

  // 빠른입력 모달 닫기
  const handleQuickAddClose = () => {
    setIsQuickAddOpen(false)
  }

  // 거래 저장 핸들러 - 빠른 입력 API 호출
  const handleSaveTransaction = async (
    transaction: any // QuickAddModal에서 받은 데이터
  ) => {
    try {
      if (!currentGroup) {
        throw new Error('그룹 정보가 필요합니다')
      }

      // categoryId로 categoryName 찾기
      const category = categories.find(cat => cat.id === transaction.categoryId)
      if (!category) {
        throw new Error('카테고리를 찾을 수 없습니다')
      }

      // QuickAddModal 데이터를 빠른 입력 API 형식으로 변환
      const quickAddData = {
        type: (transaction.type || 'EXPENSE') as 'EXPENSE' | 'INCOME', // 사용자가 선택한 타입
        amount: Number(transaction.amount),
        categoryName: category.name, // categoryId → categoryName 변환
        memo: transaction.memo || '',
        date: transaction.date,
        // groupId는 useQuickAddTransaction 훅에서 자동으로 추가됨
      }

      // 빠른 입력 API 호출
      await quickAddMutation.mutateAsync(quickAddData)

      // 거래 데이터 저장 후 성공 모달 표시
      setSavedTransactionData({
        amount: Number(transaction.amount),
        category: category.name,
        type: transaction.type || 'EXPENSE',
        date: transaction.date,
        memo: transaction.memo,
      })

      // 빠른 입력 모달 닫기
      setIsQuickAddOpen(false)
      
      // 성공 모달 표시
      setIsSuccessModalOpen(true)

      return Promise.resolve()
    } catch (error) {
      console.error('거래 저장 실패:', error)
      // 에러도 useQuickAddTransaction hook에서 처리
      setIsQuickAddOpen(false)
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

      {/* 성공 모달 */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="거래 추가 완료!"
        message="새로운 거래가 성공적으로 추가되었습니다"
        transactionData={savedTransactionData || undefined}
        autoClose={true}
        autoCloseDelay={4000}
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
