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
export function MonthlyTrendChart({
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
    <div className={`space-y-2 ${className}`}>
      {/* 차트 섹션 - 가로 배치 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
        {/* 일별 지출 트렌드 (Line Chart) */}
        <Card className='card-hover'>
          <CardContent className='p-2'>
            <div className='flex items-center gap-1 mb-2'>
              <TrendingUp className='h-3 w-3 text-blue-600' />
              <h3 className='text-xs font-semibold'>일별 트렌드</h3>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width='100%' height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                  <XAxis
                    dataKey='date'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickFormatter={value => `${Math.round(value / 1000)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type='monotone'
                    dataKey='지출'
                    stroke='#ef4444'
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, stroke: '#ef4444', strokeWidth: 1.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-[180px] text-slate-500'>
                <p className='text-xs'>데이터가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 카테고리별 지출 (Bar Chart) */}
        <Card className='card-hover'>
          <CardContent className='p-2'>
            <div className='flex items-center gap-1 mb-2'>
              <BarChart3 className='h-3 w-3 text-green-600' />
              <h3 className='text-xs font-semibold'>카테고리별 차트</h3>
            </div>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width='100%' height={180}>
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                  <XAxis
                    dataKey='name'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickFormatter={value => `${Math.round(value / 1000)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey='amount' radius={[2, 2, 0, 0]} name='지출' />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-[180px] text-slate-500'>
                <p className='text-xs'>데이터가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
