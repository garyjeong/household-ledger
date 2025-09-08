/**
 * 월별 통계 페이지
 * T-024: 월별 통계 페이지 구현
 *
 * 기능:
 * - 카테고리별 지출·수입 바 차트 및 파이 차트
 * - 기간 선택 필터 제공
 * - React Query로 데이터 캐싱 및 자동 갱신
 */

'use client'

import React, { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  Target,
  ArrowUpDown,
  Download,
  DollarSign,
  Wallet,
  Calculator,
} from 'lucide-react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryBarChart } from '@/components/statistics/CategoryBarChart'
import { CategoryPieChart } from '@/components/statistics/CategoryPieChart'
import { PeriodFilter } from '@/components/statistics/PeriodFilter'
import { MonthlyTrendChart } from '@/components/couple-ledger/MonthlyTrendChart'
import { useStatistics, StatisticsFilters } from '@/hooks/use-statistics'

/**
 * 금액을 한국 원화 형식으로 포맷팅
 */
const formatKRW = (amount: number): string => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}천`
  }
  return amount.toLocaleString()
}

export default function StatisticsPage() {
  const [filters, setFilters] = useState<StatisticsFilters>({
    period: 'current-month',
  })
  const [activeTab, setActiveTab] = useState('overview')

  // 통계 데이터 조회
  const { data: statistics, isLoading, isError, refetch } = useStatistics(filters)

  // 데이터 내보내기 (임시 구현)
  const handleExportData = () => {
    if (!statistics) return

    const exportData = {
      period: statistics.period,
      dateRange: statistics.dateRange,
      summary: statistics.summary,
      categoryBreakdown: statistics.categoryBreakdown,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statistics-${statistics.period}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <ResponsiveLayout>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>통계 데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  // 에러 상태
  if (isError || !statistics) {
    return (
      <ResponsiveLayout>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <BarChart3 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                데이터를 불러올 수 없습니다
              </h3>
              <p className='text-gray-500 mb-4'>통계 데이터를 가져오는 중 오류가 발생했습니다.</p>
              <Button onClick={() => refetch()} className='gap-2'>
                <RefreshCw className='h-4 w-4' />
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout>
      <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
        {/* 헤더 */}
        <div className='sticky top-0 z-20 bg-white pb-6 mb-6 border-b border-gray-100'>
          <div className='pt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>통계 분석</h1>
              <p className='text-slate-600 mt-1'>카테고리별 수입·지출 통계 및 트렌드 분석</p>
            </div>

            <div className='flex items-center gap-2'>
              <Button onClick={handleExportData} className='gap-2 bg-blue-600 hover:bg-blue-700'>
                <Download className='h-4 w-4' />
                내보내기
              </Button>
            </div>
          </div>
        </div>

        {/* 기간 필터 */}
        <PeriodFilter filters={filters} onFiltersChange={setFilters} className='mb-6' />

        {/* 요약 통계 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>총 수입</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {formatKRW(statistics.summary.totalIncome)}원
                  </p>
                </div>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                  <TrendingUp className='h-6 w-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>총 지출</p>
                  <p className='text-2xl font-bold text-red-600'>
                    {formatKRW(statistics.summary.totalExpense)}원
                  </p>
                </div>
                <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <TrendingDown className='h-6 w-6 text-red-600' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>순 수입</p>
                  <p
                    className={`text-2xl font-bold ${
                      statistics.summary.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}
                  >
                    {statistics.summary.netAmount >= 0 ? '+' : ''}
                    {formatKRW(statistics.summary.netAmount)}원
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    statistics.summary.netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                  }`}
                >
                  <Calculator
                    className={`h-6 w-6 ${
                      statistics.summary.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>거래 건수</p>
                  <p className='text-2xl font-bold text-purple-600'>
                    {statistics.summary.transactionCount}건
                  </p>
                </div>
                <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                  <Wallet className='h-6 w-6 text-purple-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 차트 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
          <TabsList>
            <TabsTrigger value='overview' className='gap-2'>
              <BarChart3 className='h-4 w-4' />
              개요
            </TabsTrigger>
            <TabsTrigger value='income' className='gap-2'>
              <TrendingUp className='h-4 w-4' />
              수입 분석
            </TabsTrigger>
            <TabsTrigger value='expense' className='gap-2'>
              <TrendingDown className='h-4 w-4' />
              지출 분석
            </TabsTrigger>
            <TabsTrigger value='trend' className='gap-2'>
              <Calendar className='h-4 w-4' />
              트렌드
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <CategoryBarChart
                data={statistics.categoryBreakdown}
                type='both'
                title='카테고리별 수입·지출 비교'
              />
              <CategoryPieChart
                data={statistics.categoryBreakdown}
                type='expense'
                title='지출 카테고리 분포'
              />
            </div>
          </TabsContent>

          {/* 수입 분석 탭 */}
          <TabsContent value='income' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <CategoryBarChart
                data={statistics.categoryBreakdown}
                type='income'
                title='수입 카테고리별 금액'
              />
              <CategoryPieChart
                data={statistics.categoryBreakdown}
                type='income'
                title='수입 카테고리 분포'
              />
            </div>
          </TabsContent>

          {/* 지출 분석 탭 */}
          <TabsContent value='expense' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <CategoryBarChart
                data={statistics.categoryBreakdown}
                type='expense'
                title='지출 카테고리별 금액'
              />
              <CategoryPieChart
                data={statistics.categoryBreakdown}
                type='expense'
                title='지출 카테고리 분포'
              />
            </div>
          </TabsContent>

          {/* 트렌드 탭 */}
          <TabsContent value='trend' className='space-y-6'>
            {/* 일별 트렌드 */}
            {statistics.dailyTrend.length > 0 && (
              <MonthlyTrendChart
                dailyTrend={statistics.dailyTrend.map(item => ({
                  date: item.date,
                  amount: item.expense,
                  type: 'expense',
                }))}
                categoryBreakdown={statistics.categoryBreakdown.expense.map(item => ({
                  categoryId: item.categoryId,
                  categoryName: item.categoryName,
                  amount: item.totalAmount,
                  percentage: item.percentage,
                  color: item.color,
                  icon: '',
                }))}
              />
            )}

            {/* 월별 비교 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  월별 비교 (최근 6개월)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {statistics.monthlyComparison.map((month, index) => (
                    <div key={index} className='p-4 rounded-lg bg-gray-50 border'>
                      <div className='text-sm font-medium text-gray-500 mb-2'>{month.period}</div>
                      <div className='space-y-1'>
                        <div className='flex justify-between'>
                          <span className='text-xs text-green-600'>수입</span>
                          <span className='text-sm font-medium text-green-600'>
                            +{formatKRW(month.totalIncome)}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-xs text-red-600'>지출</span>
                          <span className='text-sm font-medium text-red-600'>
                            -{formatKRW(month.totalExpense)}
                          </span>
                        </div>
                        <div className='flex justify-between pt-1 border-t border-gray-200'>
                          <span className='text-xs text-gray-600'>순액</span>
                          <span
                            className={`text-sm font-bold ${
                              month.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'
                            }`}
                          >
                            {month.netAmount >= 0 ? '+' : ''}
                            {formatKRW(month.netAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  )
}
