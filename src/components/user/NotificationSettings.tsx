'use client'

import React, { useState } from 'react'
import {
  Bell,
  Mail,
  Smartphone,
  Home,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  Clock,
  Save,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface NotificationSettings {
  email: {
    enabled: boolean
    newProperties: boolean
    priceChanges: boolean
    reviewReplies: boolean
    systemUpdates: boolean
    weeklyDigest: boolean
  }
  push: {
    enabled: boolean
    newProperties: boolean
    priceChanges: boolean
    reviewReplies: boolean
    systemUpdates: boolean
    emergencyAlerts: boolean
  }
  frequency: {
    newProperties: 'immediate' | 'daily' | 'weekly' | 'never'
    priceChanges: 'immediate' | 'daily' | 'weekly' | 'never'
    reviewActivity: 'immediate' | 'daily' | 'weekly' | 'never'
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  filters: {
    onlyPreferredAreas: boolean
    onlyPreferredTypes: boolean
    minRatingForReviews: number
  }
}

interface NotificationSettingsProps {
  settings: NotificationSettings
  onSave: (settings: NotificationSettings) => void
  isLoading?: boolean
}

const frequencyOptions = [
  { value: 'immediate', label: '즉시' },
  { value: 'daily', label: '일일 요약' },
  { value: 'weekly', label: '주간 요약' },
  { value: 'never', label: '받지 않음' },
]

export function NotificationSettings({
  settings,
  onSave,
  isLoading = false,
}: NotificationSettingsProps) {
  const [formData, setFormData] = useState<NotificationSettings>(settings)

  const handleEmailChange = (field: keyof NotificationSettings['email'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [field]: value,
      },
    }))
  }

  const handlePushChange = (field: keyof NotificationSettings['push'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [field]: value,
      },
    }))
  }

  const handleFrequencyChange = (field: keyof NotificationSettings['frequency'], value: string) => {
    setFormData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        [field]: value as any,
      },
    }))
  }

  const handleQuietHoursChange = (
    field: keyof NotificationSettings['quietHours'],
    value: boolean | string
  ) => {
    setFormData(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }))
  }

  const handleFiltersChange = (
    field: keyof NotificationSettings['filters'],
    value: boolean | number
  ) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: value,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* 이메일 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Mail className='h-5 w-5' />
            이메일 알림
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
            <div>
              <div className='font-medium'>이메일 알림 활성화</div>
              <div className='text-sm text-gray-500'>모든 이메일 알림을 켜거나 끕니다</div>
            </div>
            <input
              type='checkbox'
              checked={formData.email.enabled}
              onChange={e => handleEmailChange('enabled', e.target.checked)}
              className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded'
            />
          </div>

          {formData.email.enabled && (
            <div className='space-y-3 pl-4 border-l-2 border-blue-100'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Home className='h-4 w-4 text-gray-400' />
                  <div>
                    <div className='font-medium'>새 매물 알림</div>
                    <div className='text-sm text-gray-500'>
                      선호 조건에 맞는 새 매물이 등록될 때
                    </div>
                  </div>
                </div>
                <input
                  type='checkbox'
                  checked={formData.email.newProperties}
                  onChange={e => handleEmailChange('newProperties', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <DollarSign className='h-4 w-4 text-gray-400' />
                  <div>
                    <div className='font-medium'>가격 변동 알림</div>
                    <div className='text-sm text-gray-500'>관심 매물의 가격이 변경될 때</div>
                  </div>
                </div>
                <input
                  type='checkbox'
                  checked={formData.email.priceChanges}
                  onChange={e => handleEmailChange('priceChanges', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <MessageSquare className='h-4 w-4 text-gray-400' />
                  <div>
                    <div className='font-medium'>후기 답글 알림</div>
                    <div className='text-sm text-gray-500'>내가 작성한 후기에 답글이 달릴 때</div>
                  </div>
                </div>
                <input
                  type='checkbox'
                  checked={formData.email.reviewReplies}
                  onChange={e => handleEmailChange('reviewReplies', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <AlertTriangle className='h-4 w-4 text-gray-400' />
                  <div>
                    <div className='font-medium'>시스템 업데이트</div>
                    <div className='text-sm text-gray-500'>서비스 업데이트 및 공지사항</div>
                  </div>
                </div>
                <input
                  type='checkbox'
                  checked={formData.email.systemUpdates}
                  onChange={e => handleEmailChange('systemUpdates', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Clock className='h-4 w-4 text-gray-400' />
                  <div>
                    <div className='font-medium'>주간 요약</div>
                    <div className='text-sm text-gray-500'>매주 새로운 매물과 활동 요약</div>
                  </div>
                </div>
                <input
                  type='checkbox'
                  checked={formData.email.weeklyDigest}
                  onChange={e => handleEmailChange('weeklyDigest', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 푸시 알림 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Smartphone className='h-5 w-5' />
            푸시 알림
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
            <div>
              <div className='font-medium'>푸시 알림 활성화</div>
              <div className='text-sm text-gray-500'>모든 푸시 알림을 켜거나 끕니다</div>
            </div>
            <input
              type='checkbox'
              checked={formData.push.enabled}
              onChange={e => handlePushChange('enabled', e.target.checked)}
              className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded'
            />
          </div>

          {formData.push.enabled && (
            <div className='space-y-3 pl-4 border-l-2 border-green-100'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Home className='h-4 w-4 text-gray-400' />
                  <span>새 매물 알림</span>
                </div>
                <input
                  type='checkbox'
                  checked={formData.push.newProperties}
                  onChange={e => handlePushChange('newProperties', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <DollarSign className='h-4 w-4 text-gray-400' />
                  <span>가격 변동 알림</span>
                </div>
                <input
                  type='checkbox'
                  checked={formData.push.priceChanges}
                  onChange={e => handlePushChange('priceChanges', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <MessageSquare className='h-4 w-4 text-gray-400' />
                  <span>후기 답글 알림</span>
                </div>
                <input
                  type='checkbox'
                  checked={formData.push.reviewReplies}
                  onChange={e => handlePushChange('reviewReplies', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <AlertTriangle className='h-4 w-4 text-gray-400' />
                  <span>시스템 알림</span>
                </div>
                <input
                  type='checkbox'
                  checked={formData.push.systemUpdates}
                  onChange={e => handlePushChange('systemUpdates', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <AlertTriangle className='h-4 w-4 text-red-400' />
                  <span>긴급 알림</span>
                </div>
                <input
                  type='checkbox'
                  checked={formData.push.emergencyAlerts}
                  onChange={e => handlePushChange('emergencyAlerts', e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 알림 빈도 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            알림 빈도
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>새 매물 알림</label>
              <select
                value={formData.frequency.newProperties}
                onChange={e => handleFrequencyChange('newProperties', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>가격 변동 알림</label>
              <select
                value={formData.frequency.priceChanges}
                onChange={e => handleFrequencyChange('priceChanges', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>후기 활동</label>
              <select
                value={formData.frequency.reviewActivity}
                onChange={e => handleFrequencyChange('reviewActivity', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 방해 금지 시간 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            방해 금지 시간
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium'>방해 금지 시간 설정</div>
              <div className='text-sm text-gray-500'>지정한 시간 동안은 알림을 받지 않습니다</div>
            </div>
            <input
              type='checkbox'
              checked={formData.quietHours.enabled}
              onChange={e => handleQuietHoursChange('enabled', e.target.checked)}
              className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
            />
          </div>

          {formData.quietHours.enabled && (
            <div className='grid grid-cols-2 gap-4 pl-4 border-l-2 border-purple-100'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>시작 시간</label>
                <input
                  type='time'
                  value={formData.quietHours.startTime}
                  onChange={e => handleQuietHoursChange('startTime', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>종료 시간</label>
                <input
                  type='time'
                  value={formData.quietHours.endTime}
                  onChange={e => handleQuietHoursChange('endTime', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 필터 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5' />
            알림 필터
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='onlyPreferredAreas'
                checked={formData.filters.onlyPreferredAreas}
                onChange={e => handleFiltersChange('onlyPreferredAreas', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
              <label htmlFor='onlyPreferredAreas' className='text-sm'>
                선호 지역 매물만 알림 받기
              </label>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='onlyPreferredTypes'
                checked={formData.filters.onlyPreferredTypes}
                onChange={e => handleFiltersChange('onlyPreferredTypes', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
              <label htmlFor='onlyPreferredTypes' className='text-sm'>
                선호 매물 타입만 알림 받기
              </label>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              후기 알림 최소 평점 (별 {formData.filters.minRatingForReviews}개 이상)
            </label>
            <input
              type='range'
              min='1'
              max='5'
              step='0.5'
              value={formData.filters.minRatingForReviews}
              onChange={e => handleFiltersChange('minRatingForReviews', parseFloat(e.target.value))}
              className='w-full'
            />
            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              <span>⭐</span>
              <span>⭐⭐⭐</span>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className='flex justify-end'>
        <Button type='submit' disabled={isLoading} className='gap-2'>
          <Save className='h-4 w-4' />
          {isLoading ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </form>
  )
}
