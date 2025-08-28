/**
 * 카테고리별 바 차트 컴포넌트
 * T-024: 월별 통계 페이지 구현
 */

'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryStatistics } from '@/hooks/use-statistics'

interface CategoryBarChartProps {
  data: {
    income: CategoryStatistics[]
    expense: CategoryStatistics[]
  }
  type?: 'income' | 'expense' | 'both'
  title?: string
  className?: string
  maxItems?: number
}

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

/**
 * 차트 툴팁 커스텀 컴포넌트
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-white p-4 border border-gray-200 rounded-lg shadow-lg'>
        <p className='font-medium text-gray-900 mb-2'>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className='flex items-center gap-2'>
            <div className='w-3 h-3 rounded-full' style={{ backgroundColor: entry.color }} />
            <span className='text-sm text-gray-600'>
              {entry.dataKey === 'expense' ? '지출' : '수입'}:
            </span>
            <span className='font-medium'>{formatKRW(entry.value)}원</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function CategoryBarChart({
  data,
  type = 'both',
  title = '카테고리별 금액',
  className = '',
  maxItems = 10,
}: CategoryBarChartProps) {
  // 데이터 가공
  const chartData = React.useMemo(() => {
    const incomeMap = new Map(
      data.income.slice(0, maxItems).map(item => [item.categoryName, item.totalAmount])
    )
    const expenseMap = new Map(
      data.expense.slice(0, maxItems).map(item => [item.categoryName, item.totalAmount])
    )

    // 모든 카테고리명 수집
    const allCategories = new Set([
      ...data.income.slice(0, maxItems).map(item => item.categoryName),
      ...data.expense.slice(0, maxItems).map(item => item.categoryName),
    ])

    return Array.from(allCategories)
      .map(categoryName => ({
        category: categoryName,
        income: incomeMap.get(categoryName) || 0,
        expense: expenseMap.get(categoryName) || 0,
      }))
      .sort((a, b) => {
        if (type === 'income') return b.income - a.income
        if (type === 'expense') return b.expense - a.expense
        return b.income + b.expense - (a.income + a.expense)
      })
  }, [data, maxItems, type])

  // 빈 데이터 처리
  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-[300px] text-gray-500'>
            <div className='text-center'>
              <BarChart3 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p>표시할 데이터가 없습니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <BarChart3 className='h-5 w-5' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='h-[400px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
              <XAxis
                dataKey='category'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                angle={-45}
                textAnchor='end'
                height={80}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={formatKRW}
              />
              <Tooltip content={<CustomTooltip />} />

              {(type === 'both' || type === 'income') && (
                <Bar dataKey='income' name='수입' fill='#10b981' radius={[4, 4, 0, 0]} />
              )}

              {(type === 'both' || type === 'expense') && (
                <Bar dataKey='expense' name='지출' fill='#ef4444' radius={[4, 4, 0, 0]} />
              )}

              {type === 'both' && <Legend />}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 상위 카테고리 요약 */}
        <div className='mt-6 space-y-3'>
          <h4 className='font-medium text-gray-900'>상위 카테고리</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {/* 수입 TOP 3 */}
            {(type === 'both' || type === 'income') && data.income.length > 0 && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm font-medium text-green-700'>
                  <TrendingUp className='h-4 w-4' />
                  수입 TOP 3
                </div>
                <div className='space-y-1'>
                  {data.income.slice(0, 3).map((category, index) => (
                    <div
                      key={category.categoryId}
                      className='flex items-center justify-between text-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='w-4 h-4 text-xs font-bold text-gray-500'>{index + 1}</span>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: category.color }}
                        />
                        <span className='text-gray-700'>{category.categoryName}</span>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium text-green-600'>
                          {formatKRW(category.totalAmount)}원
                        </div>
                        <div className='text-xs text-gray-500'>
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 지출 TOP 3 */}
            {(type === 'both' || type === 'expense') && data.expense.length > 0 && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm font-medium text-red-700'>
                  <TrendingDown className='h-4 w-4' />
                  지출 TOP 3
                </div>
                <div className='space-y-1'>
                  {data.expense.slice(0, 3).map((category, index) => (
                    <div
                      key={category.categoryId}
                      className='flex items-center justify-between text-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <span className='w-4 h-4 text-xs font-bold text-gray-500'>{index + 1}</span>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: category.color }}
                        />
                        <span className='text-gray-700'>{category.categoryName}</span>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium text-red-600'>
                          {formatKRW(category.totalAmount)}원
                        </div>
                        <div className='text-xs text-gray-500'>
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
