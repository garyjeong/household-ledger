'use client'

import React, { useState, useEffect } from 'react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  Target,
  ArrowUpDown,
  Download,
  Filter,
  Eye
} from 'lucide-react'
import { QuickAddModal } from '@/components/couple-ledger/QuickAddModal'
import { defaultCategories } from '@/components/couple-ledger/CategoryPicker'

interface MonthlyStats {
  month: string
  year: number
  totalIncome: number
  totalExpense: number
  balance: number
  savingsRate: number
  categoryBreakdown: {
    categoryId: string
    categoryName: string
    amount: number
    percentage: number
    color: string
    trend: 'up' | 'down' | 'stable'
    previousAmount: number
  }[]
  monthlyTrend: {
    month: string
    income: number
    expense: number
    balance: number
  }[]
  expenseByPerson: {
    me: number
    partner: number
    shared: number
  }
}

// 더미 통계 데이터
const dummyStats: MonthlyStats = {
  month: '1월',
  year: 2025,
  totalIncome: 4500000,
  totalExpense: 2450000,
  balance: 2050000,
  savingsRate: 45.6,
  categoryBreakdown: [
    {
      categoryId: '1',
      categoryName: '식비',
      amount: 650000,
      percentage: 26.5,
      color: '#EF4444',
      trend: 'up',
      previousAmount: 580000
    },
    {
      categoryId: '2',
      categoryName: '교통비',
      amount: 420000,
      percentage: 17.1,
      color: '#3B82F6',
      trend: 'down',
      previousAmount: 450000
    },
    {
      categoryId: '3',
      categoryName: '생활용품',
      amount: 380000,
      percentage: 15.5,
      color: '#10B981',
      trend: 'up',
      previousAmount: 320000
    },
    {
      categoryId: '4',
      categoryName: '커피/음료',
      amount: 290000,
      percentage: 11.8,
      color: '#F59E0B',
      trend: 'stable',
      previousAmount: 285000
    },
    {
      categoryId: '5',
      categoryName: '쇼핑',
      amount: 260000,
      percentage: 10.6,
      color: '#EC4899',
      trend: 'down',
      previousAmount: 310000
    }
  ],
  monthlyTrend: [
    { month: '8월', income: 4200000, expense: 2100000, balance: 2100000 },
    { month: '9월', income: 4350000, expense: 2200000, balance: 2150000 },
    { month: '10월', income: 4400000, expense: 2350000, balance: 2050000 },
    { month: '11월', income: 4300000, expense: 2280000, balance: 2020000 },
    { month: '12월', income: 4450000, expense: 2400000, balance: 2050000 },
    { month: '1월', income: 4500000, expense: 2450000, balance: 2050000 }
  ],
  expenseByPerson: {
    me: 980000,
    partner: 720000,
    shared: 750000
  }
}

/**
 * 월별 통계 페이지
 * 
 * 기능:
 * - 월별 수입/지출 통계
 * - 카테고리별 분석
 * - 트렌드 분석
 * - 차트 및 그래프
 * - 예산 대비 실제 분석
 */
export default function StatisticsPage() {
  const [stats, setStats] = useState<MonthlyStats>(dummyStats)
  const [selectedPeriod, setSelectedPeriod] = useState('current') // current, compare, yearly
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원'
  }

  // 백분율 포맷팅
  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(1) + '%'
  }

  // 트렌드 아이콘
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'stable': return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
  }

  // 변화량 계산
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  return (
    <>
      <ResponsiveLayout onQuickAddClick={() => setIsQuickAddOpen(true)}>
        <div className="w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          {/* 헤더 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">월별 통계</h1>
              <p className="text-gray-500">{stats.year}년 {stats.month} 지출 분석</p>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm"
              >
                <option value="current">이번 달</option>
                <option value="compare">월별 비교</option>
                <option value="yearly">연간 분석</option>
              </select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                리포트 내보내기
              </Button>
            </div>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">총 수입</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(stats.totalIncome)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +5.2% 전월 대비
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">총 지출</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatAmount(stats.totalExpense)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <TrendingUp className="h-3 w-3" />
                  +8.1% 전월 대비
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">잔액</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatAmount(stats.balance)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  저축률 {formatPercentage(stats.savingsRate)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">평균 일 지출</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatAmount(Math.round(stats.totalExpense / 31))}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  월 예상 지출: {formatAmount(stats.totalExpense)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 카테고리별 지출 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  카테고리별 지출 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.categoryBreakdown.map((category, index) => (
                    <div key={category.categoryId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">
                            {index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium">{category.categoryName}</span>
                            {getTrendIcon(category.trend)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatAmount(category.amount)}</div>
                          <div className="text-sm text-gray-500">
                            {formatPercentage(category.percentage)}
                          </div>
                        </div>
                      </div>
                      
                      {/* 진행률 바 */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${category.percentage}%`,
                            backgroundColor: category.color 
                          }}
                        />
                      </div>
                      
                      {/* 전월 대비 변화 */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>전월: {formatAmount(category.previousAmount)}</span>
                        <span className={`flex items-center gap-1 ${
                          category.trend === 'up' ? 'text-red-500' : 
                          category.trend === 'down' ? 'text-green-500' : 'text-gray-400'
                        }`}>
                          {getTrendIcon(category.trend)}
                          {formatPercentage(Math.abs(calculateChange(category.amount, category.previousAmount)))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 지출 분할 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  지출 분할 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 내 지출 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="font-medium">내 지출</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatAmount(stats.expenseByPerson.me)}</div>
                        <div className="text-sm text-gray-500">
                          {formatPercentage((stats.expenseByPerson.me / stats.totalExpense) * 100)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${(stats.expenseByPerson.me / stats.totalExpense) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 공동 지출 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="font-medium">공동 지출</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatAmount(stats.expenseByPerson.shared)}</div>
                        <div className="text-sm text-gray-500">
                          {formatPercentage((stats.expenseByPerson.shared / stats.totalExpense) * 100)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-green-500 transition-all duration-300"
                        style={{ width: `${(stats.expenseByPerson.shared / stats.totalExpense) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 배우자 지출 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        <span className="font-medium">배우자 지출</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatAmount(stats.expenseByPerson.partner)}</div>
                        <div className="text-sm text-gray-500">
                          {formatPercentage((stats.expenseByPerson.partner / stats.totalExpense) * 100)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-pink-500 transition-all duration-300"
                        style={{ width: `${(stats.expenseByPerson.partner / stats.totalExpense) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 총계 */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>총 지출</span>
                      <span>{formatAmount(stats.totalExpense)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 월별 트렌드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                6개월 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.monthlyTrend.map((month, index) => (
                  <div key={index} className="text-center p-4 rounded-lg bg-gray-50">
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      {month.month}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-green-600">
                        +{formatAmount(month.income)}
                      </div>
                      <div className="text-xs text-red-600">
                        -{formatAmount(month.expense)}
                      </div>
                      <div className="text-sm font-bold text-blue-600">
                        {formatAmount(month.balance)}
                      </div>
                    </div>
                    
                    {/* 간단한 바 차트 */}
                    <div className="mt-3 space-y-1">
                      <div className="flex gap-1">
                        <div 
                          className="bg-green-500 rounded-sm"
                          style={{ 
                            height: '4px',
                            width: `${(month.income / 5000000) * 100}%`,
                            minWidth: '2px'
                          }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <div 
                          className="bg-red-500 rounded-sm"
                          style={{ 
                            height: '4px',
                            width: `${(month.expense / 5000000) * 100}%`,
                            minWidth: '2px'
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
      </ResponsiveLayout>

      {/* 빠른입력 모달 */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={async () => {}}
        categories={defaultCategories}
        templates={[]}
      />
    </>
  )
}
