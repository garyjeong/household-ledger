'use client'

import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MonthlyStats } from '@/types/couple-ledger'
import { formatKRW } from './AmountInput'
import { MonthlyTrendChart } from './MonthlyTrendChart'

interface MonthlyDashboardProps {
  stats: MonthlyStats
  selectedMonth: string
  onMonthChange: (month: string) => void
  className?: string
}



/**
 * 신혼부부 가계부 월별 대시보드
 *
 * 주요 기능:
 * - 월 선택 네비게이션
 * - 수입/지출 요약 카드
 * - 카테고리별 TOP 5 지출
 * - 예산 대비 실제 지출 비교
 * - 반응형 레이아웃
 */
export const MonthlyDashboard = React.memo(function MonthlyDashboard({
  stats: propStats,
  selectedMonth,
  onMonthChange,
  className = '',
}: MonthlyDashboardProps) {
  // 실제 API 데이터만 사용 - 데이터가 없으면 빈 상태 표시
  if (!propStats) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className='text-center py-4'>
          <div className='text-slate-400 mb-1 text-lg'>📊</div>
          <h3 className='text-sm font-semibold text-slate-600 mb-0.5'>데이터가 없습니다</h3>
          <p className='text-xs text-slate-500'>
            이번 달 거래 내역이 없어서 대시보드를 표시할 수 없습니다.
          </p>
        </div>
      </div>
    )
  }
  
  const stats = propStats

  // 월 네비게이션
  const handlePrevMonth = () => {
    const date = new Date(selectedMonth + '-01')
    date.setMonth(date.getMonth() - 1)
    onMonthChange(date.toISOString().slice(0, 7))
  }

  const handleNextMonth = () => {
    const date = new Date(selectedMonth + '-01')
    date.setMonth(date.getMonth() + 1)
    onMonthChange(date.toISOString().slice(0, 7))
  }

  // 특정 월로 이동
  const handleMonthSelect = (monthOffset: number) => {
    const date = new Date(selectedMonth + '-01')
    date.setMonth(date.getMonth() + monthOffset)
    onMonthChange(date.toISOString().slice(0, 7))
  }

  // 월 포맷팅
  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01')
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
    }).format(date)
  }

  // 월 정보 계산
  const getCurrentMonthInfo = () => {
    const currentDate = new Date(selectedMonth + '-01')
    const prevDate = new Date(currentDate)
    prevDate.setMonth(prevDate.getMonth() - 1)
    const nextDate = new Date(currentDate)
    nextDate.setMonth(nextDate.getMonth() + 1)

    return {
      prev: {
        label: '전달',
        month: new Intl.DateTimeFormat('ko-KR', { month: 'short' }).format(prevDate),
        isSelected: false,
      },
      current: {
        label: '금달',
        month: new Intl.DateTimeFormat('ko-KR', { month: 'short' }).format(currentDate),
        isSelected: true,
      },
      next: {
        label: '다음달',
        month: new Intl.DateTimeFormat('ko-KR', { month: 'short' }).format(nextDate),
        isSelected: false,
      },
    }
  }

  const monthInfo = getCurrentMonthInfo()

    return (
    <div className={`space-y-4 ${className}`}>
      {/* 📊 고정 헤더: 제목 + 월 선택 */}
      <div className='sticky top-0 z-20 bg-white mb-2'>
        <div className='pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>월별 대시보드</h1>
            <p className='text-slate-600 mt-1'>{formatMonth(selectedMonth)}</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleMonthSelect(-1)}
              className='flex items-center gap-1 h-8 px-3 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50'
            >
              <ChevronLeft className='h-3 w-3' />
              <span>{monthInfo.prev.month}</span>
            </Button>
            <div className='px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-bold border border-blue-600'>
              {monthInfo.current.month}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleMonthSelect(1)}
              className='flex items-center gap-1 h-8 px-3 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50'
            >
              <span>{monthInfo.next.month}</span>
              <ChevronRight className='h-3 w-3' />
            </Button>
          </div>
        </div>
      </div>

      {/* 🎯 메인 대시보드 콘텐츠 */}
      <div className='space-y-6'>
          {/* 💰 수입/지출 요약 카드 */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* 총 수입 */}
            <Card className='border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-4 mb-3'>
                  <div className='flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg'>
                    <TrendingUp className='h-6 w-6 text-emerald-600' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-700'>총 수입</h3>
                    <div className='w-10 h-1 bg-emerald-400 rounded-full mt-1'></div>
                  </div>
                </div>
                <div className='text-2xl font-bold text-slate-900'>
                  {formatKRW(Number(stats.totalIncome))}
                </div>
              </CardContent>
            </Card>

            {/* 총 지출 */}
            <Card className='border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-4 mb-3'>
                  <div className='flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg'>
                    <TrendingDown className='h-6 w-6 text-red-600' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-700'>총 지출</h3>
                    <div className='w-10 h-1 bg-red-400 rounded-full mt-1'></div>
                  </div>
                </div>
                <div className='text-2xl font-bold text-slate-900'>
                  {formatKRW(Number(stats.totalExpense))}
                </div>
              </CardContent>
            </Card>
          </div>


          {/* 📊 카테고리 분석 섹션 */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* 카테고리 TOP 5 */}
            <Card className='border border-slate-200 bg-white shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg'>
                    <BarChart3 className='h-5 w-5 text-slate-600' />
                  </div>
                  <h2 className='text-lg font-bold text-slate-900'>카테고리 TOP 5</h2>
                </div>
                
                <div className='space-y-4'>
                  {(stats.categoryBreakdown || []).slice(0, 5).map((category, index) => (
                    <div key={category.categoryId} className='flex items-center gap-4'>
                      {/* 순위 배지 */}
                      <div className='flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold'>
                        {index + 1}
                      </div>

                      {/* 카테고리 정보 */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-semibold text-slate-900 truncate'>
                            {category.categoryName}
                          </span>
                          <div className='flex items-center gap-2'>
                            <span className='text-sm font-bold text-slate-900'>
                              {formatKRW(category.amount)}
                            </span>
                            <Badge variant='secondary' className='text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-medium'>
                              {category.percentage.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        
                        {/* 진행률 바 */}
                        <div className='w-full bg-slate-100 rounded-full h-2 overflow-hidden'>
                          <div
                            className='h-full rounded-full transition-all'
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: category.color || '#6b7280',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 카테고리별 차트 */}
            <Card className='border border-slate-200 bg-white shadow-sm'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg'>
                    <PieChart className='h-5 w-5 text-blue-600' />
                  </div>
                  <h2 className='text-lg font-bold text-slate-900'>카테고리별 분포</h2>
                </div>
                
                {/* 간단한 카테고리 분포 표시 */}
                <div className='space-y-3'>
                  {(stats.categoryBreakdown || []).slice(0, 8).map((category) => (
                    <div key={category.categoryId} className='flex items-center gap-3'>
                      <div
                        className='w-4 h-4 rounded-full flex-shrink-0'
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-slate-900 truncate'>
                            {category.categoryName}
                          </span>
                          <span className='text-sm font-bold text-slate-700'>
                            {category.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className='w-full bg-slate-100 rounded-full h-1.5 mt-1'>
                          <div
                            className='h-full rounded-full transition-all'
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: category.color || '#6b7280',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        {/* 📈 최근 일주일 수입/지출 차트 */}
        <Card className='border border-slate-200 bg-white shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg'>
                <BarChart3 className='h-5 w-5 text-purple-600' />
              </div>
              <h2 className='text-lg font-bold text-slate-900'>최근 일주일 수입/지출</h2>
            </div>
            <MonthlyTrendChart
              dailyTrend={(stats.dailyTrend || []).slice(-7).map(item => ({
                date: item.date,
                amount: Math.abs(item.amount),
                type: item.type === 'income' ? ('income' as const) : ('expense' as const)
              }))}
              categoryBreakdown={stats.categoryBreakdown || []}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
