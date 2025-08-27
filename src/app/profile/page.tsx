'use client'

import React, { useState } from 'react'
import {
  User,
  Settings,
  Shield,
  Bell,
  Smartphone,
  Mail,
  Key,
  Users,
  Heart,
  LogOut,
  Edit,
  Save,
  X,
  Copy,
  Eye,
  EyeOff,
  MapPin,
  Home,
} from 'lucide-react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { QuickAddModal } from '@/components/couple-ledger/QuickAddModal'
import { defaultCategories } from '@/components/couple-ledger/CategoryPicker'
import { PreferencesForm, type UserPreferences } from '@/components/user/PreferencesForm'
import {
  NotificationSettings as NotificationSettingsComponent,
  type NotificationSettings,
} from '@/components/user/NotificationSettings'
import {
  PrivacySettings as PrivacySettingsComponent,
  type PrivacySettings,
} from '@/components/user/PrivacySettings'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  joinDate: Date
  lastLogin: Date
  profileImage?: string
  isVerified: boolean
  preferences: UserPreferences
  notificationSettings: NotificationSettings
  privacySettings: PrivacySettings
  currency: string
  language: string
  theme: 'light' | 'dark' | 'auto'
}

// 더미 사용자 데이터
const dummyProfile: UserProfile = {
  id: '1',
  name: '김부동산',
  email: 'kim.estate@example.com',
  phone: '010-1234-5678',
  joinDate: new Date('2024-12-01'),
  lastLogin: new Date('2025-01-08T14:30:00'),
  isVerified: true,
  preferences: {
    budget: {
      minRent: 30,
      maxRent: 80,
      minDeposit: 1000,
      maxDeposit: 5000,
    },
    preferredAreas: ['강남구', '서초구', '송파구'],
    propertyTypes: ['apartment', 'officetel'],
    transportOptions: {
      subway: true,
      bus: true,
      walking: false,
      maxWalkingTime: 10,
    },
    amenities: ['엘리베이터', '주차장', '보안시설'],
    floorPreference: {
      minFloor: 2,
      maxFloor: 15,
      noGroundFloor: true,
    },
    roomPreference: {
      minRooms: 1,
      separateBathroom: true,
      balcony: false,
    },
  },
  notificationSettings: {
    email: {
      enabled: true,
      newProperties: true,
      priceChanges: true,
      reviewReplies: false,
      systemUpdates: true,
      weeklyDigest: true,
    },
    push: {
      enabled: true,
      newProperties: true,
      priceChanges: false,
      reviewReplies: true,
      systemUpdates: true,
      emergencyAlerts: true,
    },
    frequency: {
      newProperties: 'immediate',
      priceChanges: 'daily',
      reviewActivity: 'daily',
    },
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
    },
    filters: {
      onlyPreferredAreas: true,
      onlyPreferredTypes: false,
      minRatingForReviews: 3.5,
    },
  },
  privacySettings: {
    profileVisibility: {
      showRealName: false,
      showEmail: false,
      showPhone: false,
      showJoinDate: true,
    },
    reviewSettings: {
      showAuthorName: true,
      allowPublicReviews: true,
      allowContactFromReviewees: false,
    },
    dataSharing: {
      allowAnalytics: true,
      allowMarketing: false,
      allowThirdParty: false,
      allowLocationTracking: true,
    },
    accountSecurity: {
      twoFactorAuth: false,
      loginNotifications: true,
      deviceTracking: true,
    },
    dataRetention: {
      autoDeleteReviews: false,
      autoDeletePeriod: 24,
      keepSearchHistory: true,
      keepViewHistory: false,
    },
  },
  currency: 'KRW',
  language: 'ko',
  theme: 'light',
}

type TabType = 'profile' | 'preferences' | 'notifications' | 'privacy'

/**
 * 내 정보 페이지
 *
 * 기능:
 * - 프로필 정보 관리
 * - 매물 선호도 설정
 * - 알림 설정
 * - 개인정보 보호 설정
 */
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(dummyProfile)
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: profile.name,
    phone: profile.phone,
  })
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 프로필 수정
  const handleSaveProfile = () => {
    setProfile(prev => ({
      ...prev,
      name: editForm.name,
      phone: editForm.phone,
    }))
    setIsEditing(false)
  }

  // 편집 취소
  const handleCancelEdit = () => {
    setEditForm({
      name: profile.name,
      phone: profile.phone,
    })
    setIsEditing(false)
  }

  // 매물 선호도 저장
  const handleSavePreferences = async (preferences: UserPreferences) => {
    setIsLoading(true)
    try {
      // TODO: API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)) // 임시 지연
      setProfile(prev => ({
        ...prev,
        preferences,
      }))
      // TODO: 성공 토스트 메시지
    } catch (error) {
      // TODO: 에러 토스트 메시지
      console.error('Failed to save preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 알림 설정 저장
  const handleSaveNotificationSettings = async (notificationSettings: NotificationSettings) => {
    setIsLoading(true)
    try {
      // TODO: API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)) // 임시 지연
      setProfile(prev => ({
        ...prev,
        notificationSettings,
      }))
      // TODO: 성공 토스트 메시지
    } catch (error) {
      // TODO: 에러 토스트 메시지
      console.error('Failed to save notification settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 개인정보 보호 설정 저장
  const handleSavePrivacySettings = async (privacySettings: PrivacySettings) => {
    setIsLoading(true)
    try {
      // TODO: API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)) // 임시 지연
      setProfile(prev => ({
        ...prev,
        privacySettings,
      }))
      // TODO: 성공 토스트 메시지
    } catch (error) {
      // TODO: 에러 토스트 메시지
      console.error('Failed to save privacy settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 데이터 내보내기
  const handleExportData = async () => {
    try {
      // TODO: API 호출
      const dataBlob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `liview-data-${profile.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  // 계정 삭제
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
    )
    if (confirmed) {
      const doubleConfirmed = window.confirm(
        '계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?'
      )
      if (doubleConfirmed) {
        try {
          // TODO: API 호출
          console.log('Account deletion requested')
          // TODO: 로그아웃 및 리다이렉트
        } catch (error) {
          console.error('Failed to delete account:', error)
        }
      }
    }
  }

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 사용 기간 계산
  const getDaysUsed = () => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - profile.joinDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const tabs = [
    {
      id: 'profile' as TabType,
      label: '프로필 정보',
      icon: User,
      description: '기본 사용자 정보',
    },
    {
      id: 'preferences' as TabType,
      label: '매물 선호도',
      icon: Home,
      description: '원하는 매물 조건',
    },
    {
      id: 'notifications' as TabType,
      label: '알림 설정',
      icon: Bell,
      description: '알림 및 빈도 설정',
    },
    {
      id: 'privacy' as TabType,
      label: '개인정보 보호',
      icon: Shield,
      description: '프라이버시 및 보안',
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preferences':
        return (
          <PreferencesForm
            preferences={profile.preferences}
            onSave={handleSavePreferences}
            isLoading={isLoading}
          />
        )
      case 'notifications':
        return (
          <NotificationSettingsComponent
            settings={profile.notificationSettings}
            onSave={handleSaveNotificationSettings}
            isLoading={isLoading}
          />
        )
      case 'privacy':
        return (
          <PrivacySettingsComponent
            settings={profile.privacySettings}
            onSave={handleSavePrivacySettings}
            onExportData={handleExportData}
            onDeleteAccount={handleDeleteAccount}
            isLoading={isLoading}
          />
        )
      default:
        return (
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  프로필 정보
                </CardTitle>
                {!isEditing ? (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsEditing(true)}
                    className='gap-1'
                  >
                    <Edit className='h-4 w-4' />
                    편집
                  </Button>
                ) : (
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCancelEdit}
                      className='gap-1'
                    >
                      <X className='h-4 w-4' />
                      취소
                    </Button>
                    <Button size='sm' onClick={handleSaveProfile} className='gap-1'>
                      <Save className='h-4 w-4' />
                      저장
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* 프로필 이미지 및 기본 정보 */}
              <div className='flex items-center gap-4'>
                <div className='w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center'>
                  <User className='h-10 w-10 text-blue-600' />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <h2 className='text-xl font-bold'>{profile.name}</h2>
                    {profile.isVerified && (
                      <Badge className='bg-green-100 text-green-700 text-xs'>
                        <Shield className='h-3 w-3 mr-1' />
                        인증됨
                      </Badge>
                    )}
                  </div>
                  <p className='text-gray-500'>{profile.email}</p>
                  <p className='text-sm text-gray-400'>
                    {getDaysUsed()}일째 사용 중 • 가입일: {formatDate(profile.joinDate)}
                  </p>
                </div>
              </div>

              {/* 편집 가능한 필드 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>이름</label>
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder='이름을 입력하세요'
                    />
                  ) : (
                    <div className='text-gray-900'>{profile.name}</div>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>전화번호</label>
                  {isEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder='전화번호를 입력하세요'
                    />
                  ) : (
                    <div className='text-gray-900'>{profile.phone}</div>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>이메일</label>
                  <div className='text-gray-500'>{profile.email}</div>
                  <p className='text-xs text-gray-400 mt-1'>이메일은 변경할 수 없습니다</p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    마지막 로그인
                  </label>
                  <div className='text-gray-500'>{formatDate(profile.lastLogin)}</div>
                </div>
              </div>

              {/* 앱 정보 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>{getDaysUsed()}일</div>
                  <div className='text-sm text-gray-500'>사용 기간</div>
                </div>

                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='text-2xl font-bold text-green-600'>
                    {profile.preferences.preferredAreas.length}개
                  </div>
                  <div className='text-sm text-gray-500'>선호 지역</div>
                </div>

                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {profile.preferences.propertyTypes.length}개
                  </div>
                  <div className='text-sm text-gray-500'>선호 매물 타입</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <>
      <ResponsiveLayout onQuickAddClick={() => setIsQuickAddOpen(true)}>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          {/* 헤더 */}
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>내 정보</h1>
              <p className='text-gray-500'>프로필 및 설정 관리</p>
            </div>

            <div className='flex gap-2'>
              <Button variant='outline' className='gap-2 text-red-600 hover:text-red-700'>
                <LogOut className='h-4 w-4' />
                로그아웃
              </Button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className='border-b border-gray-200 mb-6'>
            <nav className='-mb-px flex space-x-8 overflow-x-auto'>
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`mr-2 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <div className='text-left'>
                      <div>{tab.label}</div>
                      <div className='text-xs text-gray-400'>{tab.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* 탭 콘텐츠 */}
          <div className='w-full'>{renderTabContent()}</div>
        </div>
      </ResponsiveLayout>

      {/* 빠른입력 모달 */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={async () => {}}
        categories={defaultCategories}
        templates={[]}
      />
    </>
  )
}
