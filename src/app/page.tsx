'use client'

import React, { useState, useEffect } from 'react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { MonthlyDashboard } from '@/components/couple-ledger/MonthlyDashboard'
import { QuickAddModal } from '@/components/couple-ledger/QuickAddModal'
import { Transaction, MonthlyStats } from '@/types/couple-ledger'
import { fetchMonthlyStats } from '@/lib/api/dashboard'
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

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)



  // 월별 통계 데이터 로드
  const loadMonthlyStats = async (period: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const stats = await fetchMonthlyStats(period)
      setMonthlyStats(stats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.'
      setError(errorMessage)
      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 월 변경 핸들러
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    loadMonthlyStats(month)
  }

  // 인증 상태 확인 및 데이터 로드
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
        router.push('/login')
        return
      }
      // 인증된 사용자만 데이터 로드
      loadMonthlyStats(selectedMonth)
    }
  }, [authLoading, isAuthenticated, selectedMonth, router])

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
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      // 실제 거래 저장 API 호출 구현 필요
      console.log('거래 저장 API 구현 필요:', transaction)

      // 거래 저장 후 월별 통계 다시 로드 (실시간 업데이트)
      await loadMonthlyStats(selectedMonth)

      toast({
        title: '성공',
        description: '거래가 성공적으로 저장되었습니다.',
      })

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
      <ResponsiveLayout onQuickAddClick={handleQuickAddClick}>
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

  if (error || !monthlyStats) {
    return (
      <ResponsiveLayout onQuickAddClick={handleQuickAddClick}>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <p className='text-red-600 mb-4'>{error || '데이터를 불러올 수 없습니다.'}</p>
              <button
                onClick={() => loadMonthlyStats(selectedMonth)}
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
    <>
      {/* 반응형 레이아웃 */}
      <ResponsiveLayout onQuickAddClick={handleQuickAddClick}>
        {/* 메인 컨텐츠 */}
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          <MonthlyDashboard
            stats={monthlyStats}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
          />
        </div>
      </ResponsiveLayout>

      {/* 빠른입력 모달 */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={handleQuickAddClose}
        onSave={handleSaveTransaction}
        templates={[]} // 템플릿 기능 향후 구현 예정
      />
    </>
  )
}
