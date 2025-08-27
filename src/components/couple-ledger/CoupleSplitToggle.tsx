'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Users, User, Heart, Calculator, Percent, RotateCcw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Person, SplitRule } from '@/types/couple-ledger'

interface CoupleSplitToggleProps {
  selectedPerson: Person
  onPersonChange: (person: Person) => void
  splitRule?: SplitRule
  onSplitChange?: (split: SplitRule) => void
  defaultSplit?: number // 기본 분할 비율 (내 비율)
  partnerName?: string
  myName?: string
  className?: string
}

/**
 * 신혼부부 가계부 전용 분할 설정 컴포넌트
 * - 내/공동/배우자 선택
 * - 공동 지출 시 분할 비율 설정 (슬라이더/직접입력)
 * - 기본값 50:50, 사용자 조정값 기억
 * - 시각적 분할 표시
 */
export function CoupleSplitToggle({
  selectedPerson,
  onPersonChange,
  splitRule,
  onSplitChange,
  defaultSplit = 50,
  partnerName = '배우자',
  myName = '나',
  className = '',
}: CoupleSplitToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [customSplit, setCustomSplit] = useState<SplitRule>({
    me: defaultSplit,
    partner: 100 - defaultSplit,
  })

  // 현재 분할 비율 (props에서 제공되면 우선, 아니면 로컬 상태)
  const currentSplit = splitRule || customSplit

  // 분할 비율 변경 핸들러
  const handleSplitChange = useCallback(
    (newSplit: SplitRule) => {
      setCustomSplit(newSplit)
      onSplitChange?.(newSplit)
    },
    [onSplitChange]
  )

  // 슬라이더 변경 핸들러 (내 비율 기준)
  const handleSliderChange = useCallback(
    (value: number[]) => {
      const myRatio = value[0]
      const newSplit: SplitRule = {
        me: myRatio,
        partner: 100 - myRatio,
      }
      handleSplitChange(newSplit)
    },
    [handleSplitChange]
  )

  // 직접 입력 핸들러
  const handleDirectInput = useCallback(
    (field: 'me' | 'partner', value: string) => {
      const numValue = Math.max(0, Math.min(100, parseInt(value) || 0))
      const newSplit: SplitRule = {
        me: field === 'me' ? numValue : 100 - numValue,
        partner: field === 'partner' ? numValue : 100 - numValue,
      }
      handleSplitChange(newSplit)
    },
    [handleSplitChange]
  )

  // 기본값 복원
  const handleReset = useCallback(() => {
    const defaultSplitRule: SplitRule = {
      me: defaultSplit,
      partner: 100 - defaultSplit,
    }
    handleSplitChange(defaultSplitRule)
  }, [defaultSplit, handleSplitChange])

  // 프리셋 분할 비율
  const presetRatios = [
    { me: 50, partner: 50, label: '반반' },
    { me: 60, partner: 40, label: '6:4' },
    { me: 70, partner: 30, label: '7:3' },
    { me: 100, partner: 0, label: '전액' },
  ]

  // 프리셋 적용
  const handlePreset = useCallback(
    (preset: { me: number; partner: number }) => {
      handleSplitChange(preset)
    },
    [handleSplitChange]
  )

  // 공동 지출일 때 분할 설정 확장
  useEffect(() => {
    if (selectedPerson === 'shared') {
      setIsExpanded(true)
    } else {
      setIsExpanded(false)
    }
  }, [selectedPerson])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 사람 선택 버튼 */}
      <div className='grid grid-cols-3 gap-3'>
        {/* 나 */}
        <Button
          type='button'
          variant={selectedPerson === 'me' ? 'default' : 'outline'}
          onClick={() => onPersonChange('me')}
          className={`
            touch-target flex flex-col items-center gap-2 py-4 h-auto
            ${
              selectedPerson === 'me'
                ? 'bg-couple-me text-white border-couple-me'
                : 'border-gray-200 hover:border-blue-500/50'
            }
          `}
        >
          <User className='h-5 w-5' />
          <span className='text-sm font-medium'>{myName}</span>
        </Button>

        {/* 공동 */}
        <Button
          type='button'
          variant={selectedPerson === 'shared' ? 'default' : 'outline'}
          onClick={() => onPersonChange('shared')}
          className={`
            touch-target flex flex-col items-center gap-2 py-4 h-auto
            ${
              selectedPerson === 'shared'
                ? 'bg-couple-shared text-white border-couple-shared'
                : 'border-gray-200 hover:border-green-500/50'
            }
          `}
        >
          <Heart className='h-5 w-5' />
          <span className='text-sm font-medium'>공동</span>
        </Button>

        {/* 배우자 */}
        <Button
          type='button'
          variant={selectedPerson === 'partner' ? 'default' : 'outline'}
          onClick={() => onPersonChange('partner')}
          className={`
            touch-target flex flex-col items-center gap-2 py-4 h-auto
            ${
              selectedPerson === 'partner'
                ? 'bg-couple-partner text-white border-couple-partner'
                : 'border-gray-200 hover:border-pink-500/50'
            }
          `}
        >
          <Users className='h-5 w-5' />
          <span className='text-sm font-medium'>{partnerName}</span>
        </Button>
      </div>

      {/* 공동 지출 분할 설정 */}
      {selectedPerson === 'shared' && (
        <Card className='border-couple-shared/20 bg-couple-shared/5'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm flex items-center gap-2'>
              <Calculator className='h-4 w-4 text-couple-shared' />
              공동 지출 분할 비율
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleReset}
                className='ml-auto h-6 px-2 text-xs text-text-muted hover:text-text-primary'
              >
                <RotateCcw className='h-3 w-3 mr-1' />
                기본값
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* 현재 분할 비율 표시 */}
            <div className='flex items-center justify-between bg-surface-secondary rounded-lg p-3'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-couple-me'></div>
                <span className='text-sm font-medium'>{myName}</span>
                <Badge variant='secondary' className='text-xs'>
                  {currentSplit.me}%
                </Badge>
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary' className='text-xs'>
                  {currentSplit.partner}%
                </Badge>
                <span className='text-sm font-medium'>{partnerName}</span>
                <div className='w-3 h-3 rounded-full bg-couple-partner'></div>
              </div>
            </div>

            {/* 시각적 분할 바 */}
            <div className='relative h-6 bg-surface-tertiary rounded-full overflow-hidden'>
              <div
                className='absolute left-0 top-0 h-full bg-couple-me transition-all duration-300'
                style={{ width: `${currentSplit.me}%` }}
              />
              <div
                className='absolute right-0 top-0 h-full bg-couple-partner transition-all duration-300'
                style={{ width: `${currentSplit.partner}%` }}
              />
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-xs font-medium text-white mix-blend-difference'>
                  {currentSplit.me}% : {currentSplit.partner}%
                </span>
              </div>
            </div>

            {/* 슬라이더 조정 */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='text-xs text-text-secondary w-8'>{myName}</span>
                <Slider
                  value={[currentSplit.me]}
                  onValueChange={handleSliderChange}
                  max={100}
                  min={0}
                  step={5}
                  className='flex-1'
                />
                <span className='text-xs text-text-secondary w-12'>{partnerName}</span>
              </div>
            </div>

            {/* 직접 입력 */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <label className='text-xs text-text-secondary'>{myName} 부담</label>
                <div className='relative'>
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    value={currentSplit.me}
                    onChange={e => handleDirectInput('me', e.target.value)}
                    className='h-10 pr-8 text-sm'
                  />
                  <Percent className='absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted' />
                </div>
              </div>
              <div className='space-y-1'>
                <label className='text-xs text-text-secondary'>{partnerName} 부담</label>
                <div className='relative'>
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    value={currentSplit.partner}
                    onChange={e => handleDirectInput('partner', e.target.value)}
                    className='h-10 pr-8 text-sm'
                  />
                  <Percent className='absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted' />
                </div>
              </div>
            </div>

            {/* 프리셋 버튼 */}
            <div className='grid grid-cols-4 gap-2'>
              {presetRatios.map(preset => (
                <Button
                  key={preset.label}
                  type='button'
                  variant='outline'
                  onClick={() => handlePreset(preset)}
                  className={`
                    h-8 text-xs transition-colors
                    ${
                      currentSplit.me === preset.me
                        ? 'border-couple-shared bg-couple-shared/10 text-couple-shared'
                        : 'hover:bg-surface-secondary'
                    }
                  `}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 개인 지출 안내 */}
      {selectedPerson !== 'shared' && (
        <div className='text-center p-3 bg-surface-secondary rounded-lg'>
          <p className='text-sm text-text-secondary'>
            {selectedPerson === 'me' ? myName : partnerName}의 개인 지출로 기록됩니다
          </p>
        </div>
      )}
    </div>
  )
}
