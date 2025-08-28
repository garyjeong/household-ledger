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
    <div className={`space-y-6 ${className}`}>
      {/* 일별 지출 트렌드 (Line Chart) */}
      <Card className='card-hover'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle className='text-lg font-semibold flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-blue-600' />
            일별 지출 트렌드
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                <XAxis
                  dataKey='date'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={value => `${Math.round(value / 1000)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type='monotone'
                  dataKey='지출'
                  stroke='#ef4444'
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-[300px] text-slate-500'>
              <p>이번 달 거래 데이터가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카테고리별 지출 (Bar Chart) */}
      <Card className='card-hover'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle className='text-lg font-semibold flex items-center gap-2'>
            <BarChart3 className='h-5 w-5 text-green-600' />
            카테고리별 지출 TOP 5
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width='100%' height={300}>
              <BarChart
                data={categoryChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
                <XAxis
                  dataKey='name'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={value => `${Math.round(value / 1000)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey='amount' radius={[4, 4, 0, 0]} name='지출' />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-[300px] text-slate-500'>
              <p>카테고리별 지출 데이터가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
