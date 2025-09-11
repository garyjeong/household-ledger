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
          {/* 헤더 스켈레톤 */}
          <div className='bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div>
                <div className='h-8 w-48 bg-slate-200 rounded animate-pulse mb-2'></div>
                <div className='h-5 w-24 bg-slate-100 rounded animate-pulse'></div>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-8 w-16 bg-slate-100 rounded animate-pulse'></div>
                <div className='h-8 w-12 bg-blue-100 rounded animate-pulse'></div>
                <div className='h-8 w-16 bg-slate-100 rounded animate-pulse'></div>
              </div>
            </div>
          </div>

          {/* 카드들 스켈레톤 */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='bg-white border border-slate-200 rounded-lg p-4 shadow-sm'>
                <div className='h-4 w-20 bg-slate-100 rounded animate-pulse mb-3'></div>
                <div className='h-8 w-32 bg-slate-200 rounded animate-pulse mb-2'></div>
                <div className='h-3 w-24 bg-slate-100 rounded animate-pulse'></div>
              </div>
            ))}
          </div>

          {/* 차트 스켈레톤 */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {[1, 2].map((i) => (
              <div key={i} className='bg-white border border-slate-200 rounded-lg p-4 shadow-sm'>
                <div className='h-6 w-32 bg-slate-200 rounded animate-pulse mb-4'></div>
                <div className='h-40 w-full bg-slate-100 rounded animate-pulse'></div>
              </div>
            ))}
          </div>

          <div className='flex items-center justify-center mt-8'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2'></div>
              <p className='text-sm text-slate-500'>월별 통계를 불러오는 중...</p>
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
          {/* 헤더 유지 */}
          <div className='bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div>
                <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>월별 대시보드</h1>
                <p className='text-slate-600 mt-1'>
                  {new Date(selectedMonth + '-01').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          </div>

          {/* 에러 상태 */}
          <div className='bg-white border border-red-200 rounded-lg p-8 shadow-sm'>
            <div className='text-center'>
              <div className='w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center'>
                <svg className='w-8 h-8 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-slate-900 mb-2'>데이터를 불러올 수 없습니다</h3>
              <p className='text-slate-600 mb-6 max-w-md mx-auto'>
                {error instanceof Error 
                  ? error.message 
                  : '네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.'
                }
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <button
                  onClick={() => refetch()}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
                >
                  다시 시도
                </button>
                <button
                  onClick={() => router.refresh()}
                  className='px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium'
                >
                  페이지 새로고침
                </button>
              </div>
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
        {monthlyStats && (
          <MonthlyDashboard
            stats={monthlyStats}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
          />
        )}
      </div>
    </ResponsiveLayout>
  )
}
