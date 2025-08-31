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
export function MonthlyDashboard({
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
    <div className={`flex gap-3 ${className}`}>
      {/* 좌측: 월 선택 영역 */}
      <div className='flex-shrink-0 w-20'>
        <div className='space-y-1'>
          {/* 전달 */}
          <Button
            variant={monthInfo.prev.isSelected ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleMonthSelect(-1)}
            className='w-full h-12 p-1 flex flex-col items-center justify-center text-xs'
          >
            <span className='text-xs opacity-70'>{monthInfo.prev.label}</span>
            <span className='font-semibold'>{monthInfo.prev.month}</span>
          </Button>
          
          {/* 금달 */}
          <Button
            variant={monthInfo.current.isSelected ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleMonthSelect(0)}
            className='w-full h-12 p-1 flex flex-col items-center justify-center text-xs bg-primary text-primary-foreground'
          >
            <span className='text-xs opacity-90'>{monthInfo.current.label}</span>
            <span className='font-semibold'>{monthInfo.current.month}</span>
          </Button>
          
          {/* 다음달 */}
          <Button
            variant={monthInfo.next.isSelected ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleMonthSelect(1)}
            className='w-full h-12 p-1 flex flex-col items-center justify-center text-xs'
          >
            <span className='text-xs opacity-70'>{monthInfo.next.label}</span>
            <span className='font-semibold'>{monthInfo.next.month}</span>
          </Button>
          
          {/* 현재 선택된 월 표시 */}
          <div className='text-center pt-1'>
            <p className='text-xs text-text-secondary'>월별 대시보드</p>
          </div>
        </div>
      </div>

      {/* 우측: 대시보드 콘텐츠 */}
      <div className='flex-1 space-y-2'>

      {/* 수입/지출 요약 카드 */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
        {/* 총 수입 */}
        <Card className='card-hover'>
          <CardContent className='p-2'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs font-medium text-text-secondary'>총 수입</span>
              <TrendingUp className='h-3 w-3 text-success' />
            </div>
            <div className='text-lg font-bold text-success amount-display'>
              {formatKRW(stats.totalIncome)}
            </div>
          </CardContent>
        </Card>

        {/* 총 지출 */}
        <Card className='card-hover'>
          <CardContent className='p-2'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs font-medium text-text-secondary'>총 지출</span>
              <TrendingDown className='h-3 w-3 text-danger' />
            </div>
            <div className='text-lg font-bold text-danger amount-display'>
              {formatKRW(stats.totalExpense)}
            </div>
          </CardContent>
        </Card>

        {/* 잔액 */}
        <Card className='card-hover'>
          <CardContent className='p-2'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs font-medium text-text-secondary'>잔액</span>
              <PiggyBank
                className={`h-3 w-3 ${balanceIsPositive ? 'text-success' : 'text-danger'}`}
              />
            </div>
            <div
              className={`text-lg font-bold amount-display ${balanceIsPositive ? 'text-success' : 'text-danger'}`}
            >
              {formatKRW(Math.abs(balance))}
            </div>
            <div className='text-xs text-text-secondary mt-0.5'>
              저축률 {savingsRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>


      </div>



      {/* 카테고리 & 예산 섹션 - 가로 배치 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
        {/* 카테고리 TOP 5 */}
        <Card className='card-hover'>
          <CardContent className='p-2'>
            <div className='flex items-center gap-1 mb-2'>
              <BarChart3 className='h-3 w-3 text-primary' />
              <h3 className='text-xs font-semibold'>카테고리 TOP 5</h3>
            </div>
            <div className='space-y-2'>
              {(stats.categoryBreakdown || []).slice(0, 5).map((category, index) => (
                <div key={category.categoryId} className='flex items-center gap-1.5'>
                  {/* 순위 */}
                  <div className='flex items-center justify-center w-4 h-4 rounded-full bg-surface-tertiary text-xs font-bold text-text-secondary'>
                    {index + 1}
                  </div>
                  
                  {/* 카테고리 정보 */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-medium text-text-primary truncate'>
                        {category.categoryName}
                      </span>
                      <div className='flex items-center gap-1'>
                        <span className='text-xs font-bold amount-display'>
                          {formatKRW(category.amount)}
                        </span>
                        <Badge variant='secondary' className='text-xs px-1 py-0'>
                          {category.percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    
                    {/* 진행률 바 */}
                    <div className='w-full bg-surface-tertiary rounded-full h-1 overflow-hidden mt-0.5'>
                      <div
                        className='h-full transition-all duration-300'
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 예산 대비 실제 지출 */}
        <Card className='card-hover'>
          <CardContent className='p-2'>
            <div className='flex items-center gap-1 mb-2'>
              <Target className='h-3 w-3 text-primary' />
              <h3 className='text-xs font-semibold'>예산 대비</h3>
            </div>
            <div className='space-y-2'>
              {(stats.categoryBreakdown || []).slice(0, 5).map(budget => {
                const category = (stats.categoryBreakdown || []).find(
                  c => c.categoryId === budget.categoryId
                )
                const isOverBudget = budget.percentage > 100
                const isNearLimit = budget.percentage > 90 && budget.percentage <= 100

                return (
                  <div key={budget.categoryId} className='space-y-1'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-medium text-text-primary truncate'>
                        {category?.categoryName}
                      </span>
                      <div className='flex items-center gap-1'>
                        {isOverBudget && <AlertTriangle className='h-3 w-3 text-danger' />}
                        {isNearLimit && <AlertTriangle className='h-3 w-3 text-warning' />}
                        {!isOverBudget && !isNearLimit && (
                          <CheckCircle className='h-3 w-3 text-success' />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            isOverBudget
                              ? 'text-danger'
                              : isNearLimit
                                ? 'text-warning'
                                : 'text-success'
                          }`}
                        >
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* 예산 진행률 바 */}
                    <div className='w-full bg-surface-tertiary rounded-full h-1 overflow-hidden'>
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOverBudget ? 'bg-danger' : isNearLimit ? 'bg-warning' : 'bg-success'
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

        {/* 월별 트렌드 차트 */}
        <MonthlyTrendChart
          dailyTrend={(stats.dailyTrend || []).map(item => ({
            date: item.date,
            amount: Math.abs(item.amount),
            type: (item.type === 'income' ? 'income' : 'expense') as 'expense' | 'income'
          }))}
          categoryBreakdown={stats.categoryBreakdown || []}
        />
      </div>
    </div>
  )
}
