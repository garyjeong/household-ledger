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

  // 실제 API 데이터만 사용 - 데이터가 없으면 빈 상태 표시
  if (!propStats) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* 헤더 유지 */}
        <div className='sticky top-0 z-20 bg-white mb-2'>
          <div className='pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>월별 대시보드</h1>
              <p className='text-slate-600 mt-1'>
                {new Date(selectedMonth + '-01').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {getCurrentMonthInfo() && (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleMonthSelect(-1)}
                    className='flex items-center gap-1 h-8 px-3 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50'
                  >
                    <ChevronLeft className='h-3 w-3' />
                    <span>{getCurrentMonthInfo().prev.month}</span>
                  </Button>
                  <div className='px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-bold border border-blue-600'>
                    {getCurrentMonthInfo().current.month}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleMonthSelect(1)}
                    className='flex items-center gap-1 h-8 px-3 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50'
                  >
                    <span>{getCurrentMonthInfo().next.month}</span>
                    <ChevronRight className='h-3 w-3' />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 빈 상태 */}
        <div className='bg-white border border-slate-200 rounded-lg p-12 shadow-sm text-center'>
          <div className='w-20 h-20 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center'>
            <svg className='w-10 h-10 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
            </svg>
          </div>
          <h3 className='text-xl font-semibold text-slate-900 mb-3'>거래 내역이 없습니다</h3>
          <p className='text-slate-600 mb-6 max-w-sm mx-auto'>
            이번 달에는 아직 거래 내역이 없어서 대시보드를 표시할 수 없습니다. 
            첫 번째 거래를 추가해보세요!
          </p>
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <button className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'>
              거래 추가하기
            </button>
            <button 
              onClick={() => onMonthChange(new Date().toISOString().slice(0, 7))}
              className='px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium'
            >
              이번 달로 이동
            </button>
          </div>
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

  // getCurrentMonthInfo 함수를 상단으로 이동됨

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
            <Card className='border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl'>
                    <BarChart3 className='h-6 w-6 text-orange-600' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-slate-900'>카테고리 TOP 5</h2>
                    <p className='text-sm text-slate-600'>가장 많이 지출한 카테고리</p>
                  </div>
                </div>
                
                <div className='space-y-5'>
                  {(stats.categoryBreakdown || []).slice(0, 5).map((category, index) => {
                    // 순위별 색상 및 스타일
                    const getRankStyle = (rank: number) => {
                      switch(rank) {
                        case 0: return { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', text: 'text-white', shadow: 'shadow-yellow-200', border: 'border-yellow-300' }
                        case 1: return { bg: 'bg-gradient-to-r from-gray-400 to-gray-500', text: 'text-white', shadow: 'shadow-gray-200', border: 'border-gray-300' }
                        case 2: return { bg: 'bg-gradient-to-r from-orange-400 to-orange-500', text: 'text-white', shadow: 'shadow-orange-200', border: 'border-orange-300' }
                        default: return { bg: 'bg-gradient-to-r from-slate-400 to-slate-500', text: 'text-white', shadow: 'shadow-slate-200', border: 'border-slate-300' }
                      }
                    }
                    
                    const rankStyle = getRankStyle(index)
                    
                    return (
                      <div 
                        key={category.categoryId} 
                        className={`group relative p-4 rounded-xl border ${rankStyle.border} bg-white hover:bg-slate-50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
                      >
                        <div className='flex items-center gap-4'>
                          {/* 순위 배지 - 개선된 디자인 */}
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${rankStyle.bg} ${rankStyle.text} text-base font-bold shadow-lg ${rankStyle.shadow}`}>
                            {index + 1}
                          </div>

                          {/* 카테고리 정보 */}
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between mb-3'>
                              <div className='flex items-center gap-2'>
                                <div
                                  className='w-4 h-4 rounded-full border-2 border-white shadow-sm'
                                  style={{ backgroundColor: category.color || '#6b7280' }}
                                />
                                <span className='text-base font-bold text-slate-900 truncate'>
                                  {category.categoryName}
                                </span>
                              </div>
                              <div className='flex items-center gap-3'>
                                <span className='text-lg font-bold text-slate-900'>
                                  {formatKRW(category.amount)}
                                </span>
                                <Badge 
                                  variant='secondary' 
                                  className={`text-sm px-3 py-1 font-bold shadow-sm transition-all group-hover:scale-105 ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                    index === 2 ? 'bg-orange-100 text-orange-800' :
                                    'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {category.percentage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                            
                            {/* 진행률 바 - 개선된 디자인 */}
                            <div className='relative'>
                              <div className='w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner'>
                                <div
                                  className='h-full rounded-full transition-all duration-700 ease-out shadow-sm'
                                  style={{
                                    width: `${category.percentage}%`,
                                    background: `linear-gradient(90deg, ${category.color || '#6b7280'}, ${category.color || '#6b7280'}dd)`,
                                  }}
                                />
                              </div>
                              {/* 진행률 바 위 하이라이트 효과 */}
                              <div 
                                className='absolute top-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full'
                                style={{ width: `${category.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* 호버 시 표시되는 추가 정보 */}
                        <div className='absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
                          <div className='absolute top-2 right-2'>
                            <div className='w-2 h-2 rounded-full bg-blue-500 animate-pulse' />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* 카테고리가 없을 때 */}
                {(!stats.categoryBreakdown || stats.categoryBreakdown.length === 0) && (
                  <div className='flex items-center justify-center py-12 text-slate-400'>
                    <div className='text-center'>
                      <div className='text-4xl mb-3'>📊</div>
                      <p className='text-lg font-medium text-slate-600'>카테고리 데이터가 없습니다</p>
                      <p className='text-sm text-slate-500 mt-1'>거래를 추가하면 TOP 5가 표시됩니다</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 카테고리별 분포 */}
            <Card className='border border-slate-200 bg-gradient-to-br from-white to-blue-50 shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl'>
                    <PieChart className='h-6 w-6 text-blue-600' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-slate-900'>카테고리별 분포</h2>
                    <p className='text-sm text-slate-600'>지출 비율 시각화</p>
                  </div>
                </div>
                
                {(stats.categoryBreakdown && stats.categoryBreakdown.length > 0) ? (
                  <div className='space-y-6'>
                    {/* 도넛 차트 시뮬레이션 - 원형 레이아웃 */}
                    <div className='relative'>
                      <div className='flex items-center justify-center'>
                        <div className='relative w-48 h-48'>
                          {/* 중앙 원 */}
                          <div className='absolute inset-0 rounded-full border-8 border-slate-100 bg-white shadow-inner flex items-center justify-center'>
                            <div className='text-center'>
                              <div className='text-2xl font-bold text-slate-900'>{stats.categoryBreakdown.length}</div>
                              <div className='text-xs text-slate-600'>카테고리</div>
                            </div>
                          </div>
                          
                          {/* 카테고리 도트들을 원형으로 배치 */}
                          {stats.categoryBreakdown.slice(0, 8).map((category, index) => {
                            const angle = (index * 360) / Math.min(stats.categoryBreakdown.length, 8)
                            const radian = (angle * Math.PI) / 180
                            const radius = 70
                            const x = Math.cos(radian) * radius
                            const y = Math.sin(radian) * radius
                            
                            return (
                              <div
                                key={category.categoryId}
                                className='absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer'
                                style={{
                                  left: `calc(50% + ${x}px)`,
                                  top: `calc(50% + ${y}px)`,
                                }}
                              >
                                <div
                                  className={`w-6 h-6 rounded-full border-3 border-white shadow-lg transition-all duration-200 hover:scale-125 hover:shadow-xl`}
                                  style={{ backgroundColor: category.color || '#6b7280' }}
                                />
                                
                                {/* 호버 시 툴팁 */}
                                <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10'>
                                  <div className='bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap'>
                                    {category.categoryName}: {category.percentage.toFixed(1)}%
                                  </div>
                                  <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900'></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* 카테고리 목록 - 개선된 디자인 */}
                    <div className='space-y-3'>
                      {stats.categoryBreakdown.slice(0, 6).map((category, index) => (
                        <div 
                          key={category.categoryId} 
                          className='group flex items-center gap-4 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-200'
                        >
                          {/* 카테고리 색상 및 순위 */}
                          <div className='flex items-center gap-3'>
                            <div className='relative'>
                              <div
                                className='w-5 h-5 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110'
                                style={{ backgroundColor: category.color || '#6b7280' }}
                              />
                              <div className='absolute -top-1 -right-1 w-4 h-4 bg-slate-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center'>
                                {index + 1}
                              </div>
                            </div>
                          </div>
                          
                          {/* 카테고리 정보 */}
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between mb-2'>
                              <span className='text-sm font-bold text-slate-900 truncate'>
                                {category.categoryName}
                              </span>
                              <div className='flex items-center gap-2'>
                                <span className='text-sm font-bold text-slate-700'>
                                  {formatKRW(category.amount)}
                                </span>
                                <Badge 
                                  variant='outline' 
                                  className='text-xs px-2 py-0.5 font-bold border-slate-300 text-slate-700 group-hover:border-slate-400 transition-colors'
                                >
                                  {category.percentage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                            
                            {/* 진행률 바 */}
                            <div className='relative'>
                              <div className='w-full bg-slate-200 rounded-full h-2 overflow-hidden'>
                                <div
                                  className='h-full rounded-full transition-all duration-500 ease-out'
                                  style={{
                                    width: `${category.percentage}%`,
                                    backgroundColor: category.color || '#6b7280',
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* 더 많은 카테고리가 있을 때 */}
                      {stats.categoryBreakdown.length > 6 && (
                        <div className='text-center py-2'>
                          <span className='text-sm text-slate-500'>
                            +{stats.categoryBreakdown.length - 6}개 카테고리 더
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center justify-center py-12 text-slate-400'>
                    <div className='text-center'>
                      <div className='text-4xl mb-3'>🥧</div>
                      <p className='text-lg font-medium text-slate-600'>분포 데이터가 없습니다</p>
                      <p className='text-sm text-slate-500 mt-1'>카테고리별 거래를 추가해보세요</p>
                    </div>
                  </div>
                )}
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
