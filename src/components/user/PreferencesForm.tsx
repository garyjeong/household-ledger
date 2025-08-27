'use client'

import React, { useState } from 'react'
import { MapPin, Home, DollarSign, Train, Car, Building, X, Plus, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface UserPreferences {
  budget: {
    minRent: number
    maxRent: number
    minDeposit: number
    maxDeposit: number
  }
  preferredAreas: string[]
  propertyTypes: string[]
  transportOptions: {
    subway: boolean
    bus: boolean
    walking: boolean
    maxWalkingTime: number
  }
  amenities: string[]
  floorPreference: {
    minFloor: number
    maxFloor: number
    noGroundFloor: boolean
  }
  roomPreference: {
    minRooms: number
    separateBathroom: boolean
    balcony: boolean
  }
}

interface PreferencesFormProps {
  preferences: UserPreferences
  onSave: (preferences: UserPreferences) => void
  isLoading?: boolean
}

const propertyTypeOptions = [
  { value: 'apartment', label: '아파트', icon: Building },
  { value: 'villa', label: '빌라', icon: Home },
  { value: 'officetel', label: '오피스텔', icon: Building },
  { value: 'oneroom', label: '원룸', icon: Home },
]

const amenityOptions = [
  '엘리베이터',
  '주차장',
  '보안시설',
  'CCTV',
  '인터폰',
  '베란다',
  '테라스',
  '옥상',
  '지하실',
  '창고',
  '편의점',
  '마트',
  '학교',
  '병원',
  '약국',
]

const seoulDistricts = [
  '강남구',
  '강동구',
  '강북구',
  '강서구',
  '관악구',
  '광진구',
  '구로구',
  '금천구',
  '노원구',
  '도봉구',
  '동대문구',
  '동작구',
  '마포구',
  '서대문구',
  '서초구',
  '성동구',
  '성북구',
  '송파구',
  '양천구',
  '영등포구',
  '용산구',
  '은평구',
  '종로구',
  '중구',
  '중랑구',
]

export function PreferencesForm({ preferences, onSave, isLoading = false }: PreferencesFormProps) {
  const [formData, setFormData] = useState<UserPreferences>(preferences)
  const [newArea, setNewArea] = useState('')

  const handleBudgetChange = (field: keyof UserPreferences['budget'], value: string) => {
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [field]: parseInt(value) || 0,
      },
    }))
  }

  const handlePropertyTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type],
    }))
  }

  const handleAreaAdd = (area: string) => {
    if (area && !formData.preferredAreas.includes(area)) {
      setFormData(prev => ({
        ...prev,
        preferredAreas: [...prev.preferredAreas, area],
      }))
    }
    setNewArea('')
  }

  const handleAreaRemove = (area: string) => {
    setFormData(prev => ({
      ...prev,
      preferredAreas: prev.preferredAreas.filter(a => a !== area),
    }))
  }

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleTransportChange = (
    field: keyof UserPreferences['transportOptions'],
    value: boolean | number
  ) => {
    setFormData(prev => ({
      ...prev,
      transportOptions: {
        ...prev.transportOptions,
        [field]: value,
      },
    }))
  }

  const handleFloorChange = (
    field: keyof UserPreferences['floorPreference'],
    value: number | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      floorPreference: {
        ...prev.floorPreference,
        [field]: value,
      },
    }))
  }

  const handleRoomChange = (
    field: keyof UserPreferences['roomPreference'],
    value: number | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      roomPreference: {
        ...prev.roomPreference,
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
      {/* 예산 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            예산 설정
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>월세 (만원)</label>
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  placeholder='최소'
                  value={formData.budget.minRent || ''}
                  onChange={e => handleBudgetChange('minRent', e.target.value)}
                />
                <span className='text-gray-500'>~</span>
                <Input
                  type='number'
                  placeholder='최대'
                  value={formData.budget.maxRent || ''}
                  onChange={e => handleBudgetChange('maxRent', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>보증금 (만원)</label>
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  placeholder='최소'
                  value={formData.budget.minDeposit || ''}
                  onChange={e => handleBudgetChange('minDeposit', e.target.value)}
                />
                <span className='text-gray-500'>~</span>
                <Input
                  type='number'
                  placeholder='최대'
                  value={formData.budget.maxDeposit || ''}
                  onChange={e => handleBudgetChange('maxDeposit', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 선호 지역 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            선호 지역
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <select
              className='flex-1 px-3 py-2 border border-gray-300 rounded-md'
              value={newArea}
              onChange={e => setNewArea(e.target.value)}
            >
              <option value=''>지역을 선택하세요</option>
              {seoulDistricts.map(district => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <Button
              type='button'
              onClick={() => handleAreaAdd(newArea)}
              disabled={!newArea}
              className='gap-2'
            >
              <Plus className='h-4 w-4' />
              추가
            </Button>
          </div>

          <div className='flex flex-wrap gap-2'>
            {formData.preferredAreas.map(area => (
              <Badge key={area} variant='secondary' className='flex items-center gap-1'>
                {area}
                <button
                  type='button'
                  onClick={() => handleAreaRemove(area)}
                  className='ml-1 hover:text-red-600'
                >
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 매물 타입 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Home className='h-5 w-5' />
            매물 타입
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {propertyTypeOptions.map(option => {
              const Icon = option.icon
              const isSelected = formData.propertyTypes.includes(option.value)

              return (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handlePropertyTypeToggle(option.value)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className='h-6 w-6 mx-auto mb-2' />
                  <div className='text-sm font-medium'>{option.label}</div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 교통 옵션 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Train className='h-5 w-5' />
            교통 편의성
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Train className='h-5 w-5 text-gray-400' />
                <span>지하철 접근성</span>
              </div>
              <input
                type='checkbox'
                checked={formData.transportOptions.subway}
                onChange={e => handleTransportChange('subway', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Car className='h-5 w-5 text-gray-400' />
                <span>버스 접근성</span>
              </div>
              <input
                type='checkbox'
                checked={formData.transportOptions.bus}
                onChange={e => handleTransportChange('bus', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <span className='text-gray-400'>🚶</span>
                <span>도보 이용</span>
              </div>
              <input
                type='checkbox'
                checked={formData.transportOptions.walking}
                onChange={e => handleTransportChange('walking', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>
          </div>

          {formData.transportOptions.walking && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                최대 도보 시간 (분)
              </label>
              <Input
                type='number'
                value={formData.transportOptions.maxWalkingTime}
                onChange={e =>
                  handleTransportChange('maxWalkingTime', parseInt(e.target.value) || 0)
                }
                className='w-full'
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 편의시설 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='h-5 w-5' />
            편의시설
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
            {amenityOptions.map(amenity => (
              <label key={amenity} className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
                />
                <span className='text-sm'>{amenity}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 층수 선호도 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='h-5 w-5' />
            층수 및 구조 선호도
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>선호 층수</label>
              <div className='flex items-center gap-2'>
                <Input
                  type='number'
                  placeholder='최소'
                  value={formData.floorPreference.minFloor || ''}
                  onChange={e => handleFloorChange('minFloor', parseInt(e.target.value) || 0)}
                />
                <span className='text-gray-500'>~</span>
                <Input
                  type='number'
                  placeholder='최대'
                  value={formData.floorPreference.maxFloor || ''}
                  onChange={e => handleFloorChange('maxFloor', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>방 개수 (최소)</label>
              <Input
                type='number'
                value={formData.roomPreference.minRooms || ''}
                onChange={e => handleRoomChange('minRooms', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='noGroundFloor'
                checked={formData.floorPreference.noGroundFloor}
                onChange={e => handleFloorChange('noGroundFloor', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
              <label htmlFor='noGroundFloor' className='text-sm'>
                반지하/지하 제외
              </label>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='separateBathroom'
                checked={formData.roomPreference.separateBathroom}
                onChange={e => handleRoomChange('separateBathroom', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
              <label htmlFor='separateBathroom' className='text-sm'>
                분리형 화장실 선호
              </label>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='balcony'
                checked={formData.roomPreference.balcony}
                onChange={e => handleRoomChange('balcony', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
              <label htmlFor='balcony' className='text-sm'>
                베란다/발코니 선호
              </label>
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
