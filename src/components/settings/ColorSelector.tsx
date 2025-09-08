/**
 * 카테고리 색상 선택 컴포넌트
 * T-025: 설정 하위 메뉴 - 카테고리 관리
 */

'use client'

import React, { useState } from 'react'
import { Palette, Check, Pipette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface ColorSelectorProps {
  value: string
  onChange: (color: string) => void
  title?: string
  colorStyle?: 'vibrant' | 'pastel' | 'monochrome'
  showCustom?: boolean
  className?: string
}

// 색상 팔레트 정의
const COLOR_PALETTES = {
  vibrant: [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
    '#0ea5e9',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#f43f5e',
    '#64748b',
    '#374151',
    '#1f2937',
  ],
  pastel: [
    '#fca5a5',
    '#fdba74',
    '#fcd34d',
    '#fde047',
    '#bef264',
    '#86efac',
    '#6ee7b7',
    '#5eead4',
    '#7dd3fc',
    '#93c5fd',
    '#a5b4fc',
    '#c4b5fd',
    '#d8b4fe',
    '#e879f9',
    '#f0abfc',
    '#fbb6ce',
    '#fca5a5',
    '#cbd5e1',
    '#9ca3af',
    '#6b7280',
  ],
  monochrome: [
    '#000000',
    '#1f2937',
    '#374151',
    '#4b5563',
    '#6b7280',
    '#9ca3af',
    '#d1d5db',
    '#e5e7eb',
    '#f3f4f6',
    '#f9fafb',
    '#ffffff',
    '#fee2e2',
    '#fef3c7',
    '#ecfdf5',
    '#eff6ff',
    '#f0f9ff',
    '#faf5ff',
    '#fdf4ff',
    '#fef2f2',
    '#fffbeb',
  ],
}

// 색상 이름 매핑
const COLOR_NAMES: Record<string, string> = {
  '#ef4444': '빨강',
  '#f97316': '주황',
  '#f59e0b': '호박',
  '#eab308': '노랑',
  '#84cc16': '라임',
  '#22c55e': '초록',
  '#10b981': '에메랄드',
  '#14b8a6': '청록',
  '#06b6d4': '하늘',
  '#0ea5e9': '파랑',
  '#3b82f6': '파란',
  '#6366f1': '인디고',
  '#8b5cf6': '보라',
  '#a855f7': '자주',
  '#d946ef': '분홍',
  '#ec4899': '핑크',
  '#f43f5e': '장미',
  '#64748b': '슬레이트',
  '#374151': '회색',
  '#1f2937': '검정',
}

/**
 * 색상 유효성 검사
 */
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

/**
 * 랜덤 색상 생성
 */
const generateRandomColor = (): string => {
  const colors = Object.keys(COLOR_NAMES)
  return colors[Math.floor(Math.random() * colors.length)]
}

export function ColorSelector({
  value,
  onChange,
  title = '색상 선택',
  colorStyle = 'vibrant',
  showCustom = true,
  className = '',
}: ColorSelectorProps) {
  const [customColor, setCustomColor] = useState(value)
  const [isCustomMode, setIsCustomMode] = useState(!COLOR_PALETTES[colorStyle].includes(value))

  const currentPalette = COLOR_PALETTES[colorStyle]

  // 색상 선택 핸들러
  const handleColorSelect = (color: string) => {
    setCustomColor(color)
    setIsCustomMode(false)
    onChange(color)
  }

  // 커스텀 색상 적용
  const handleCustomColorApply = () => {
    if (isValidHexColor(customColor)) {
      onChange(customColor)
    }
  }

  // 랜덤 색상 생성
  const handleRandomColor = () => {
    const randomColor = generateRandomColor()
    handleColorSelect(randomColor)
  }

  // 스타일 이름 변환
  const getStyleName = (style: string): string => {
    switch (style) {
      case 'vibrant':
        return '선명한'
      case 'pastel':
        return '파스텔'
      case 'monochrome':
        return '단색'
      default:
        return '기본'
    }
  }

  return (
    <Card className={className}>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Palette className='h-5 w-5' />
            {title}
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Badge variant='outline'>{getStyleName(colorStyle)} 팔레트</Badge>
            <Button variant='ghost' size='sm' onClick={handleRandomColor} className='gap-1'>
              <Pipette className='h-4 w-4' />
              랜덤
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 현재 선택된 색상 미리보기 */}
        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
          <div className='flex items-center gap-3'>
            <div
              className='w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm'
              style={{ backgroundColor: value }}
            />
            <div>
              <p className='font-medium text-gray-900'>{COLOR_NAMES[value] || '커스텀 색상'}</p>
              <p className='text-sm text-gray-500 font-mono'>{value.toUpperCase()}</p>
            </div>
          </div>
          {isCustomMode && (
            <Badge variant='secondary' className='gap-1'>
              <Pipette className='h-3 w-3' />
              커스텀
            </Badge>
          )}
        </div>

        {/* 팔레트 색상 선택 */}
        <div className='space-y-3'>
          <Label className='text-sm font-medium'>팔레트에서 선택</Label>
          <div className='grid grid-cols-10 gap-2'>
            {currentPalette.map(color => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  value === color
                    ? 'border-gray-900 shadow-md scale-110'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={COLOR_NAMES[color] || color}
              >
                {value === color && (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Check className='h-3 w-3 text-white drop-shadow-sm' />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 커스텀 색상 입력 */}
        {showCustom && (
          <div className='space-y-3'>
            <Label className='text-sm font-medium'>커스텀 색상</Label>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <Input
                  type='text'
                  placeholder='#000000'
                  value={customColor}
                  onChange={e => setCustomColor(e.target.value)}
                  className='font-mono'
                />
              </div>
              <div className='relative'>
                <Input
                  type='color'
                  value={customColor}
                  onChange={e => setCustomColor(e.target.value)}
                  className='w-12 h-10 p-1 cursor-pointer'
                />
              </div>
              <Button
                onClick={handleCustomColorApply}
                disabled={!isValidHexColor(customColor)}
                size='sm'
                className='gap-1'
              >
                <Check className='h-4 w-4' />
                적용
              </Button>
            </div>
            {customColor && !isValidHexColor(customColor) && (
              <p className='text-sm text-red-600'>올바른 색상 코드를 입력해주세요 (예: #FF0000)</p>
            )}
          </div>
        )}

        {/* 색상 사용 가이드 */}
        <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
          <h4 className='text-sm font-medium text-blue-900 mb-2'>색상 선택 가이드</h4>
          <ul className='text-xs text-blue-800 space-y-1'>
            <li>• 카테고리를 쉽게 구분할 수 있도록 대비가 높은 색상을 선택하세요</li>
            <li>• 수입 카테고리는 초록색 계열, 지출 카테고리는 빨간색 계열을 권장합니다</li>
            <li>• 너무 밝거나 어두운 색상은 가독성이 떨어질 수 있습니다</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
