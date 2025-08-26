'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  CreditCard,
  Heart,
  User,
  Users,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { MonthlyStats, Person } from '@/types/couple-ledger'
import { formatKRW } from './AmountInput'

interface MonthlyDashboardProps {
  stats: MonthlyStats
  selectedMonth: string
  onMonthChange: (month: string) => void
  className?: string
}

// 더미 데이터 (실제 구현에서는 API에서 가져옴)
const createDummyStats = (period: string): MonthlyStats => ({
  period,
  totalExpense: 2450000,
  totalIncome: 4500000,
  myExpense: 980000,
  partnerExpense: 720000,
  sharedExpense: 750000,
  categoryBreakdown: [
    { categoryId: '1', categoryName: '식비', amount: 650000, percentage: 26.5, color: '#EF4444', icon: 'food' },
    { categoryId: '2', categoryName: '교통비', amount: 420000, percentage: 17.1, color: '#3B82F6', icon: 'transport' },
    { categoryId: '3', categoryName: '생활용품', amount: 380000, percentage: 15.5, color: '#10B981', icon: 'home' },
    { categoryId: '4', categoryName: '커피/음료', amount: 290000, percentage: 11.8, color: '#F59E0B', icon: 'coffee' },
    { categoryId: '5', categoryName: '쇼핑', amount: 260000, percentage: 10.6, color: '#EC4899', icon: 'shopping' },
  ],
  dailyTrend: [], // 차트 데이터
  budgetComparison: [
    { categoryId: '1', budgeted: 700000, spent: 650000, remaining: 50000, percentage: 92.9 },
    { categoryId: '2', budgeted: 400000, spent: 420000, remaining: -20000, percentage: 105.0 },
    { categoryId: '3', budgeted: 350000, spent: 380000, remaining: -30000, percentage: 108.6 },
  ],
})

/**
 * 신혼부부 가계부 월요약 대시보드
 * 
 * 주요 기능:
 * - 월 선택 네비게이션
 * - 수입/지출 요약 카드
 * - 개인/공동/배우자 지출 분석
 * - 카테고리별 TOP 5 지출
 * - 예산 대비 실제 지출 비교
 * - 반응형 레이아웃
 */
export function MonthlyDashboard({ 
  stats: propStats,
  selectedMonth, 
  onMonthChange,
  className = '' 
}: MonthlyDashboardProps) {
  // 더미 데이터 사용 (API 연동 전까지)
  const stats = propStats || createDummyStats(selectedMonth)

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

  // 월 포맷팅
  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01')
    return new Intl.DateTimeFormat('ko-KR', { 
      year: 'numeric', 
      month: 'long' 
    }).format(date)
  }

  // 잔액 계산
  const balance = stats.totalIncome - stats.totalExpense
  const balanceIsPositive = balance >= 0

  // 저축률 계산
  const savingsRate = stats.totalIncome > 0 ? (balance / stats.totalIncome * 100) : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 월 선택 헤더 */}
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="h-10 w-10 p-0 hover:bg-surface-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 justify-center">
                <Calendar className="h-5 w-5 text-primary" />
                {formatMonth(selectedMonth)}
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                가계부 요약
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-10 w-10 p-0 hover:bg-surface-secondary"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 수입/지출 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 수입 */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              총 수입
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success amount-display">
              {formatKRW(stats.totalIncome)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span className="text-xs text-success">+5.2% 전월 대비</span>
            </div>
          </CardContent>
        </Card>

        {/* 총 지출 */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              총 지출
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger amount-display">
              {formatKRW(stats.totalExpense)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownRight className="h-3 w-3 text-danger" />
              <span className="text-xs text-danger">+8.1% 전월 대비</span>
            </div>
          </CardContent>
        </Card>

        {/* 잔액 */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              이번 달 잔액
            </CardTitle>
            <PiggyBank className={`h-4 w-4 ${balanceIsPositive ? 'text-success' : 'text-danger'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold amount-display ${balanceIsPositive ? 'text-success' : 'text-danger'}`}>
              {formatKRW(Math.abs(balance))}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-text-secondary">
                저축률 {savingsRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 예산 대비 */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              예산 달성률
            </CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              78.5%
            </div>
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle className="h-3 w-3 text-success" />
              <span className="text-xs text-success">목표 달성 중</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 개인/공동/배우자 지출 분석 */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            지출 분할 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 내 지출 */}
            <div className="text-center p-4 rounded-lg bg-couple-me-light border border-couple-me/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="h-4 w-4 text-couple-me" />
                <span className="text-sm font-medium text-couple-me">내 지출</span>
              </div>
              <div className="text-xl font-bold text-couple-me amount-display">
                {formatKRW(stats.myExpense)}
              </div>
              <div className="text-xs text-couple-me/80 mt-1">
                {((stats.myExpense / stats.totalExpense) * 100).toFixed(1)}%
              </div>
            </div>

            {/* 공동 지출 */}
            <div className="text-center p-4 rounded-lg bg-couple-shared-light border border-couple-shared/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-couple-shared" />
                <span className="text-sm font-medium text-couple-shared">공동 지출</span>
              </div>
              <div className="text-xl font-bold text-couple-shared amount-display">
                {formatKRW(stats.sharedExpense)}
              </div>
              <div className="text-xs text-couple-shared/80 mt-1">
                {((stats.sharedExpense / stats.totalExpense) * 100).toFixed(1)}%
              </div>
            </div>

            {/* 배우자 지출 */}
            <div className="text-center p-4 rounded-lg bg-couple-partner-light border border-couple-partner/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-4 w-4 text-couple-partner" />
                <span className="text-sm font-medium text-couple-partner">배우자 지출</span>
              </div>
              <div className="text-xl font-bold text-couple-partner amount-display">
                {formatKRW(stats.partnerExpense)}
              </div>
              <div className="text-xs text-couple-partner/80 mt-1">
                {((stats.partnerExpense / stats.totalExpense) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리 TOP 5 */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            카테고리별 지출 TOP 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.categoryBreakdown.map((category, index) => (
              <div key={category.categoryId} className="flex items-center gap-3">
                {/* 순위 */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-tertiary text-xs font-bold text-text-secondary">
                  {index + 1}
                </div>

                {/* 카테고리 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {category.categoryName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold amount-display">
                        {formatKRW(category.amount)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {category.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="w-full bg-surface-tertiary rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
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
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            예산 대비 실제 지출
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.budgetComparison.map((budget) => {
              const category = stats.categoryBreakdown.find(c => c.categoryId === budget.categoryId)
              const isOverBudget = budget.percentage > 100
              const isNearLimit = budget.percentage > 90 && budget.percentage <= 100
              
              return (
                <div key={budget.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {category?.categoryName}
                    </span>
                    <div className="flex items-center gap-2">
                      {isOverBudget && <AlertTriangle className="h-4 w-4 text-danger" />}
                      {isNearLimit && <AlertTriangle className="h-4 w-4 text-warning" />}
                      {!isOverBudget && !isNearLimit && <CheckCircle className="h-4 w-4 text-success" />}
                      <span className={`text-xs font-medium ${
                        isOverBudget ? 'text-danger' : 
                        isNearLimit ? 'text-warning' : 'text-success'
                      }`}>
                        {budget.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span>예산: {formatKRW(budget.budgeted)}</span>
                    <span>실제: {formatKRW(budget.spent)}</span>
                    <span className={budget.remaining >= 0 ? 'text-success' : 'text-danger'}>
                      {budget.remaining >= 0 ? '남은 예산: ' : '초과: '}
                      {formatKRW(Math.abs(budget.remaining))}
                    </span>
                  </div>

                  {/* 예산 진행률 바 */}
                  <div className="w-full bg-surface-tertiary rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isOverBudget ? 'bg-danger' : 
                        isNearLimit ? 'bg-warning' : 'bg-success'
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
  )
}
