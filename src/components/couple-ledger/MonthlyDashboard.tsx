'use client'

import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
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

  // 잔액 계산
  const balance = stats.totalIncome - stats.totalExpense
  const balanceIsPositive = balance >= 0

  // 저축률 계산
  const savingsRate = stats.totalIncome > 0 ? (balance / stats.totalIncome) * 100 : 0

  const monthInfo = getCurrentMonthInfo()

    return (
    <div className={`space-y-4 ${className}`}>
      {/* 📊 컴팩트 헤더: 제목 + 월 선택 */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm'>
        <div>
          <h1 className='text-lg font-bold text-slate-900'>월별 대시보드</h1>
          <p className='text-sm text-slate-600'>{formatMonth(selectedMonth)}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleMonthSelect(-1)}
            className='flex items-center gap-1 h-8 px-3 text-xs font-medium'
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
            className='flex items-center gap-1 h-8 px-3 text-xs font-medium'
          >
            <span>{monthInfo.next.month}</span>
            <ChevronRight className='h-3 w-3' />
          </Button>
        </div>
      </div>

      {/* 🎯 메인 대시보드 콘텐츠 */}
      <div className='space-y-6'>
          {/* 💰 수입/지출/잔액 요약 카드 */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* 총 수입 - 새로운 디자인 */}
            <Card className='border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg'>
                    <TrendingUp className='h-5 w-5 text-emerald-600' />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-slate-700'>총 수입</h3>
                    <div className='w-8 h-1 bg-emerald-400 rounded-full mt-1'></div>
                  </div>
                </div>
                <div className='text-xl font-bold text-slate-900'>
                  {formatKRW(stats.totalIncome)}
                </div>
              </CardContent>
            </Card>

            {/* 총 지출 - 새로운 디자인 */}
            <Card className='border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg'>
                    <TrendingDown className='h-5 w-5 text-slate-600' />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-slate-700'>총 지출</h3>
                    <div className='w-8 h-1 bg-slate-400 rounded-full mt-1'></div>
                  </div>
                </div>
                <div className='text-xl font-bold text-slate-900'>
                  {formatKRW(stats.totalExpense)}
                </div>
              </CardContent>
            </Card>

            {/* 잔액 - 새로운 디자인 */}
            <Card className='border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${balanceIsPositive ? 'bg-blue-100' : 'bg-amber-100'}`}>
                    <PiggyBank className={`h-5 w-5 ${balanceIsPositive ? 'text-blue-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-slate-700'>
                      {balanceIsPositive ? '흑자' : '적자'}
                    </h3>
                    <div className={`w-8 h-1 rounded-full mt-1 ${balanceIsPositive ? 'bg-blue-400' : 'bg-amber-400'}`}></div>
                  </div>
                </div>
                <div className={`text-xl font-bold ${balanceIsPositive ? 'text-blue-900' : 'text-amber-900'}`}>
                  {formatKRW(Math.abs(balance))}
                </div>
                <div className='text-sm text-slate-600 mt-1'>
                  저축률 {savingsRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>



          {/* 📊 카테고리 & 예산 섹션 */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* 카테고리 TOP 5 - 새로운 디자인 */}
            <Card className='border border-slate-200 bg-white shadow-sm'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg'>
                    <BarChart3 className='h-4 w-4 text-slate-600' />
                  </div>
                  <h2 className='text-base font-bold text-slate-900'>카테고리 TOP 5</h2>
                </div>
                
                <div className='space-y-4'>
                  {(stats.categoryBreakdown || []).slice(0, 5).map((category, index) => (
                    <div key={category.categoryId} className='flex items-center gap-4'>
                      {/* 순위 배지 */}
                      <div className='flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-sm font-bold'>
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

            {/* 예산 모니터링 - 새로운 디자인 */}
            <Card className='border border-slate-200 bg-white shadow-sm'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg'>
                    <Target className='h-4 w-4 text-blue-600' />
                  </div>
                  <h2 className='text-base font-bold text-slate-900'>예산 모니터링</h2>
                </div>
                
                <div className='space-y-4'>
                  {(stats.categoryBreakdown || []).slice(0, 5).map(budget => {
                    const category = (stats.categoryBreakdown || []).find(
                      c => c.categoryId === budget.categoryId
                    )
                    const isOverBudget = budget.percentage > 100
                    const isNearLimit = budget.percentage > 80 && budget.percentage <= 100

                    return (
                      <div key={budget.categoryId} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-semibold text-slate-900 truncate'>
                            {category?.categoryName}
                          </span>
                          <div className='flex items-center gap-2'>
                            {isOverBudget && <AlertTriangle className='h-4 w-4 text-red-500' />}
                            {isNearLimit && <AlertTriangle className='h-4 w-4 text-amber-500' />}
                            {!isOverBudget && !isNearLimit && (
                              <CheckCircle className='h-4 w-4 text-emerald-500' />
                            )}
                            <span
                              className={`text-sm font-bold ${
                                isOverBudget
                                  ? 'text-red-600'
                                  : isNearLimit
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                              }`}
                            >
                              {budget.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* 예산 진행률 바 */}
                        <div className='w-full bg-slate-100 rounded-full h-2 overflow-hidden'>
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

        {/* 📈 월별 트렌드 차트 */}
        <MonthlyTrendChart
          dailyTrend={(stats.dailyTrend || []).map(item => ({
            date: item.date,
            amount: Math.abs(item.amount),
            type: item.type === 'income' ? ('income' as const) : ('expense' as const)
          }))}
          categoryBreakdown={stats.categoryBreakdown || []}
        />
      </div>
    </div>
  )
})
