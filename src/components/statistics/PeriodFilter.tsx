/**
 * 기간 선택 필터 컴포넌트
 * T-024: 월별 통계 페이지 구현
 */

'use client'

import React, { useState } from 'react'
import { Calendar, CalendarDays, Clock, Filter, RefreshCw, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatisticsFilters } from '@/hooks/use-statistics'

interface PeriodFilterProps {
  filters: StatisticsFilters
  onFiltersChange: (filters: StatisticsFilters) => void
  className?: string
  showAdvanced?: boolean
}

// 미리 정의된 기간 옵션
const PERIOD_OPTIONS = [
  {
    value: 'current-month',
    label: '이번 달',
    description: '현재 월의 1일부터 오늘까지',
  },
  {
    value: 'last-month',
    label: '지난 달',
    description: '전월 전체 기간',
  },
  {
    value: 'last-3-months',
    label: '최근 3개월',
    description: '3개월 전부터 현재까지',
  },
  {
    value: 'last-6-months',
    label: '최근 6개월',
    description: '6개월 전부터 현재까지',
  },
  {
    value: 'year',
    label: '올해',
    description: '올해 1월 1일부터 현재까지',
  },
  {
    value: 'custom',
    label: '사용자 지정',
    description: '직접 기간을 선택합니다',
  },
] as const

export function PeriodFilter({
  filters,
  onFiltersChange,
  className = '',
  showAdvanced = false,
}: PeriodFilterProps) {
  const [isCustomMode, setIsCustomMode] = useState(
    !filters.period ||
      !PERIOD_OPTIONS.some(opt => opt.value === filters.period)
  )
  const [tempStartDate, setTempStartDate] = useState(filters.startDate || '')
  const [tempEndDate, setTempEndDate] = useState(filters.endDate || '')

  // 기간 타입 변경 핸들러
  const handlePeriodChange = (period: string) => {
    if (period === 'custom') {
      setIsCustomMode(true)
      onFiltersChange({
        ...filters,
        period: undefined, // period 제거하여 커스텀 모드 활성화
      })
    } else {
      setIsCustomMode(false)
      onFiltersChange({
        ...filters,
        period: period as StatisticsFilters['period'],
        startDate: undefined,
        endDate: undefined,
      })
    }
  }

  // 커스텀 날짜 적용
  const handleApplyCustomDates = () => {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) > new Date(tempEndDate)) {
        alert('시작일은 종료일보다 빠를 수 없습니다.')
        return
      }

      onFiltersChange({
        ...filters,
        period: undefined,
        startDate: tempStartDate,
        endDate: tempEndDate,
      })
    }
  }

  // 필터 초기화
  const handleReset = () => {
    setIsCustomMode(false)
    setTempStartDate('')
    setTempEndDate('')
    onFiltersChange({
      period: 'current-month',
    })
  }

  // 현재 선택된 기간 표시
  const getCurrentPeriodLabel = (): string => {
    if (isCustomMode && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate).toLocaleDateString('ko-KR')
      const end = new Date(filters.endDate).toLocaleDateString('ko-KR')
      return `${start} ~ ${end}`
    }

    const option = PERIOD_OPTIONS.find(opt => opt.value === filters.period)
    return option?.label || '기간 선택'
  }

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0]
  }

  // 1년 전 날짜를 YYYY-MM-DD 형식으로 반환
  const getYearAgoString = () => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1)
    return date.toISOString().split('T')[0]
  }

  return (
    <Card className={className}>
      <CardContent className='p-4'>
        <div className='space-y-4'>
          {/* 헤더 */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4 text-gray-600' />
              <h3 className='font-medium text-gray-900'>기간 선택</h3>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='gap-1'>
                <Clock className='h-3 w-3' />
                {getCurrentPeriodLabel()}
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleReset}
                className='gap-1 text-gray-500 hover:text-gray-700'
              >
                <RefreshCw className='h-3 w-3' />
                초기화
              </Button>
            </div>
          </div>

          {/* 기간 선택 */}
          <div className='space-y-3'>
            <Label className='text-sm font-medium'>기간 유형</Label>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2'>
              {PERIOD_OPTIONS.map(option => (
                <Button
                  key={option.value}
                  variant={
                    (option.value === 'custom' && isCustomMode) ||
                    (option.value !== 'custom' && filters.period === option.value)
                      ? 'default'
                      : 'outline'
                  }
                  size='sm'
                  onClick={() => handlePeriodChange(option.value)}
                  className='justify-start text-xs h-auto py-2 px-3'
                  title={option.description}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 커스텀 날짜 선택 */}
          {isCustomMode && (
            <div className='space-y-3 p-4 bg-gray-50 rounded-lg border'>
              <div className='flex items-center gap-2'>
                <CalendarDays className='h-4 w-4 text-gray-600' />
                <Label className='text-sm font-medium'>사용자 지정 기간</Label>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <div className='space-y-2'>
                  <Label htmlFor='startDate' className='text-xs text-gray-600'>
                    시작일
                  </Label>
                  <Input
                    id='startDate'
                    type='date'
                    value={tempStartDate}
                    onChange={e => setTempStartDate(e.target.value)}
                    max={getTodayString()}
                    min={getYearAgoString()}
                    className='text-sm'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='endDate' className='text-xs text-gray-600'>
                    종료일
                  </Label>
                  <Input
                    id='endDate'
                    type='date'
                    value={tempEndDate}
                    onChange={e => setTempEndDate(e.target.value)}
                    max={getTodayString()}
                    min={tempStartDate || getYearAgoString()}
                    className='text-sm'
                  />
                </div>
              </div>
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setTempStartDate('')
                    setTempEndDate('')
                  }}
                >
                  취소
                </Button>
                <Button
                  size='sm'
                  onClick={handleApplyCustomDates}
                  disabled={!tempStartDate || !tempEndDate}
                >
                  적용
                </Button>
              </div>
            </div>
          )}

          {/* 빠른 선택 버튼들 */}
          {!isCustomMode && (
            <div className='flex gap-2 pt-2 border-t'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handlePeriodChange('current-month')}
                className='gap-1 text-xs'
              >
                <Calendar className='h-3 w-3' />
                이번 달
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handlePeriodChange('last-month')}
                className='gap-1 text-xs'
              >
                <Calendar className='h-3 w-3' />
                지난 달
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handlePeriodChange('last-3-months')}
                className='gap-1 text-xs'
              >
                <Calendar className='h-3 w-3' />
                3개월
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
