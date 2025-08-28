/**
 * 카테고리별 파이 차트 컴포넌트
 * T-024: 월별 통계 페이지 구현
 */

'use client'

import React, { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PieChart as PieChartIcon, TrendingDown, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CategoryStatistics } from '@/hooks/use-statistics'

interface CategoryPieChartProps {
  data: {
    income: CategoryStatistics[]
    expense: CategoryStatistics[]
  }
  type?: 'income' | 'expense'
  title?: string
  className?: string
  showLegend?: boolean
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
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className='bg-white p-4 border border-gray-200 rounded-lg shadow-lg'>
        <div className='flex items-center gap-2 mb-2'>
          <div className='w-3 h-3 rounded-full' style={{ backgroundColor: data.color }} />
          <span className='font-medium text-gray-900'>{data.categoryName}</span>
        </div>
        <div className='space-y-1 text-sm'>
          <div className='flex justify-between'>
            <span className='text-gray-600'>금액:</span>
            <span className='font-medium'>{formatKRW(data.totalAmount)}원</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>비율:</span>
            <span className='font-medium'>{data.percentage.toFixed(1)}%</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-600'>거래 수:</span>
            <span className='font-medium'>{data.transactionCount}건</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

/**
 * 커스텀 레이블 렌더링
 */
const renderLabel = ({ percentage }: any) => {
  return percentage > 5 ? `${percentage.toFixed(1)}%` : ''
}

export function CategoryPieChart({
  data,
  type = 'expense',
  title,
  className = '',
  showLegend = true,
  maxItems = 8,
}: CategoryPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // 데이터 선택 및 가공
  const chartData = React.useMemo(() => {
    const sourceData = type === 'income' ? data.income : data.expense

    // 상위 N개 카테고리만 표시, 나머지는 "기타"로 합침
    const topItems = sourceData.slice(0, maxItems - 1)
    const otherItems = sourceData.slice(maxItems - 1)

    const result = [...topItems]

    if (otherItems.length > 0) {
      const otherTotal = otherItems.reduce((sum, item) => sum + item.totalAmount, 0)
      const otherCount = otherItems.reduce((sum, item) => sum + item.transactionCount, 0)
      const totalAmount = sourceData.reduce((sum, item) => sum + item.totalAmount, 0)

      result.push({
        categoryId: 'other',
        categoryName: '기타',
        totalAmount: otherTotal,
        transactionCount: otherCount,
        percentage: totalAmount > 0 ? (otherTotal / totalAmount) * 100 : 0,
        color: '#94a3b8',
      })
    }

    return result
  }, [data, type, maxItems])

  const defaultTitle = type === 'income' ? '수입 카테고리별 비율' : '지출 카테고리별 비율'
  const chartTitle = title || defaultTitle

  // 빈 데이터 처리
  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <PieChartIcon className='h-5 w-5' />
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-[300px] text-gray-500'>
            <div className='text-center'>
              <PieChartIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p>표시할 데이터가 없습니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = chartData.reduce((sum, item) => sum + item.totalAmount, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <PieChartIcon className='h-5 w-5' />
            {chartTitle}
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Badge variant={type === 'income' ? 'default' : 'destructive'} className='gap-1'>
              {type === 'income' ? (
                <TrendingUp className='h-3 w-3' />
              ) : (
                <TrendingDown className='h-3 w-3' />
              )}
              {formatKRW(totalAmount)}원
            </Badge>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowDetails(!showDetails)}
              className='gap-1'
            >
              {showDetails ? (
                <>
                  <EyeOff className='h-4 w-4' />
                  숨기기
                </>
              ) : (
                <>
                  <Eye className='h-4 w-4' />
                  자세히
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* 파이 차트 */}
          <div className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={chartData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={100}
                  innerRadius={40}
                  fill='#8884d8'
                  dataKey='totalAmount'
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={activeIndex === index ? '#fff' : 'none'}
                      strokeWidth={activeIndex === index ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 범례 및 상세 정보 */}
          <div className='space-y-4'>
            {showLegend && (
              <div className='space-y-2'>
                <h4 className='font-medium text-gray-900'>카테고리별 내역</h4>
                <div className='space-y-2 max-h-[240px] overflow-y-auto'>
                  {chartData.map((category, index) => (
                    <div
                      key={category.categoryId}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                        activeIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      <div className='flex items-center gap-2 flex-1'>
                        <div
                          className='w-3 h-3 rounded-full flex-shrink-0'
                          style={{ backgroundColor: category.color }}
                        />
                        <span className='text-sm font-medium text-gray-700 truncate'>
                          {category.categoryName}
                        </span>
                      </div>
                      <div className='text-right'>
                        <div className='text-sm font-medium'>
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

            {/* 상세 정보 */}
            {showDetails && (
              <div className='pt-4 border-t space-y-3'>
                <h4 className='font-medium text-gray-900'>통계 요약</h4>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-600'>총 금액</span>
                    <div className='font-medium'>{formatKRW(totalAmount)}원</div>
                  </div>
                  <div>
                    <span className='text-gray-600'>카테고리 수</span>
                    <div className='font-medium'>{chartData.length}개</div>
                  </div>
                  <div>
                    <span className='text-gray-600'>총 거래 수</span>
                    <div className='font-medium'>
                      {chartData.reduce((sum, item) => sum + item.transactionCount, 0)}건
                    </div>
                  </div>
                  <div>
                    <span className='text-gray-600'>평균 거래액</span>
                    <div className='font-medium'>
                      {formatKRW(
                        totalAmount /
                          Math.max(
                            chartData.reduce((sum, item) => sum + item.transactionCount, 0),
                            1
                          )
                      )}
                      원
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
