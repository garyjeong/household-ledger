/**
 * 월별 트렌드 차트 컴포넌트
 */

'use client'

import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TrendData {
  date: string
  amount: number
  type: 'expense' | 'income'
}

interface CategoryData {
  categoryId: string
  categoryName: string
  amount: number
  percentage: number
  color: string
  icon: string
}

interface MonthlyTrendChartProps {
  dailyTrend: TrendData[]
  categoryBreakdown: CategoryData[]
  className?: string
}

/**
 * 금액을 한국 원화 형식으로 포맷팅
 */
const formatKRW = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(amount))
}

/**
 * 차트 툴팁 커스텀 컴포넌트
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-white p-3 border border-slate-200 rounded-lg shadow-lg'>
        <p className='text-sm font-medium text-slate-900'>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className='text-sm' style={{ color: entry.color }}>
            {entry.name}: {formatKRW(entry.value)}원
          </p>
        ))}
      </div>
    )
  }
  return null
}

/**
 * 월별 트렌드 차트 컴포넌트
 */
export const MonthlyTrendChart = React.memo(function MonthlyTrendChart({
  dailyTrend,
  categoryBreakdown,
  className = '',
}: MonthlyTrendChartProps) {
  // 일별 데이터를 차트용으로 변환
  const chartData = dailyTrend.map(item => ({
    date: new Date(item.date).getDate() + '일',
    지출: item.type === 'expense' ? item.amount : 0,
    수입: item.type === 'income' ? item.amount : 0,
  }))

  // 카테고리별 데이터를 차트용으로 변환 (TOP 5만)
  const categoryChartData = categoryBreakdown.slice(0, 5).map(item => ({
    name: item.categoryName,
    amount: item.amount,
    fill: item.color,
  }))

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 📈 차트 섹션 - 새로운 디자인 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* 일별 지출 트렌드 - 개선된 디자인 */}
        <Card className='border border-slate-200 bg-white shadow-sm'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg'>
                <TrendingUp className='h-4 w-4 text-blue-600' />
              </div>
              <h2 className='text-base font-bold text-slate-900'>일별 트렌드</h2>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width='100%' height={120}>
                <LineChart 
                  data={chartData} 
                  margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                  isAnimationActive={false}
                >
                  <CartesianGrid strokeDasharray='2 2' stroke='#e2e8f0' opacity={0.5} />
                  <XAxis
                    dataKey='date'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fill: '#64748b' }}
                    interval='preserveStartEnd'
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fill: '#64748b' }}
                    tickFormatter={value => `${Math.round(value / 1000)}K`}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type='monotone'
                    dataKey='지출'
                    stroke='#3b82f6'
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-[120px] text-slate-400'>
                <div className='text-center'>
                  <div className='text-2xl mb-2'>📈</div>
                  <p className='text-sm text-slate-600'>데이터가 없습니다</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 카테고리별 지출 - 개선된 디자인 */}
        <Card className='border border-slate-200 bg-white shadow-sm'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg'>
                <BarChart3 className='h-4 w-4 text-emerald-600' />
              </div>
              <h2 className='text-base font-bold text-slate-900'>카테고리별 차트</h2>
            </div>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width='100%' height={120}>
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
                  isAnimationActive={false}
                >
                  <CartesianGrid strokeDasharray='2 2' stroke='#e2e8f0' opacity={0.5} />
                  <XAxis
                    dataKey='name'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fill: '#64748b' }}
                    interval={0}
                    angle={-45}
                    textAnchor='end'
                    height={40}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fill: '#64748b' }}
                    tickFormatter={value => `${Math.round(value / 1000)}K`}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey='amount' 
                    radius={[3, 3, 0, 0]} 
                    name='지출' 
                    fill='#10b981'
                    opacity={0.8}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-[120px] text-slate-400'>
                <div className='text-center'>
                  <div className='text-2xl mb-2'>📊</div>
                  <p className='text-sm text-slate-600'>데이터가 없습니다</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
