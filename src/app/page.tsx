'use client'

import React, { useState, useEffect } from 'react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { MonthlyDashboard } from '@/components/couple-ledger/MonthlyDashboard'
import { MonthlyStats } from '@/types/couple-ledger'
import { useMonthlyStats } from '@/hooks/use-monthly-stats'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'


/**
 * 신혼부부 가계부 메인 페이지
 *
 * 기능:
 * - 월별 대시보드
 * - 반응형 네비게이션 (모바일 하단탭 + 데스크탑 사이드바)
 * - 빠른입력 모달
 * - 실시간 통계 업데이트
 */
export default function HomePage() {
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // React Query를 사용한 월별 통계 데이터 조회
  const { data: monthlyStats, isLoading, error, refetch } = useMonthlyStats({
    period: selectedMonth,
  })

  // 월 변경 핸들러
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  // 인증 상태 확인
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // 에러 토스트 표시
  useEffect(() => {
    if (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
    }
  }, [error, toast])



  // 인증 로딩 중일 때 렌더링
  if (authLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4'></div>
          <p className='text-slate-600'>인증 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 사용자 (리다이렉트 중)
  if (!isAuthenticated) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-slate-600 mb-4'>로그인이 필요합니다.</p>
          <p className='text-slate-500'>로그인 페이지로 이동중...</p>
        </div>
      </div>
    )
  }

  // 월별 통계 로딩 중일 때의 렌더링
  if (isLoading) {
    return (
      <ResponsiveLayout>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4'></div>
              <p className='text-slate-600'>월별 통계를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  if (error || (!monthlyStats && !isLoading)) {
    return (
      <ResponsiveLayout>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <p className='text-red-600 mb-4'>
                {error instanceof Error ? error.message : '데이터를 불러올 수 없습니다.'}
              </p>
              <button
                onClick={() => refetch()}
                className='px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors'
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout>
      {/* 메인 컨텐츠 */}
      <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
        <MonthlyDashboard
          stats={monthlyStats}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
        />
      </div>
    </ResponsiveLayout>
  )
}
