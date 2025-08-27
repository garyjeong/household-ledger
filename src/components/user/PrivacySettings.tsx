'use client'

import React, { useState } from 'react'
import {
  Shield,
  Eye,
  EyeOff,
  Users,
  Lock,
  UserX,
  Download,
  Trash2,
  AlertTriangle,
  Save,
  History,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface PrivacySettings {
  profileVisibility: {
    showRealName: boolean
    showEmail: boolean
    showPhone: boolean
    showJoinDate: boolean
  }
  reviewSettings: {
    showAuthorName: boolean
    allowPublicReviews: boolean
    allowContactFromReviewees: boolean
  }
  dataSharing: {
    allowAnalytics: boolean
    allowMarketing: boolean
    allowThirdParty: boolean
    allowLocationTracking: boolean
  }
  accountSecurity: {
    twoFactorAuth: boolean
    loginNotifications: boolean
    deviceTracking: boolean
  }
  dataRetention: {
    autoDeleteReviews: boolean
    autoDeletePeriod: number // months
    keepSearchHistory: boolean
    keepViewHistory: boolean
  }
}

interface PrivacySettingsProps {
  settings: PrivacySettings
  onSave: (settings: PrivacySettings) => void
  onExportData: () => void
  onDeleteAccount: () => void
  isLoading?: boolean
}

const dataRetentionOptions = [
  { value: 6, label: '6개월' },
  { value: 12, label: '1년' },
  { value: 24, label: '2년' },
  { value: 36, label: '3년' },
  { value: 60, label: '5년' },
]

export function PrivacySettings({
  settings,
  onSave,
  onExportData,
  onDeleteAccount,
  isLoading = false,
}: PrivacySettingsProps) {
  const [formData, setFormData] = useState<PrivacySettings>(settings)
  const [showDangerZone, setShowDangerZone] = useState(false)

  const handleVisibilityChange = (
    field: keyof PrivacySettings['profileVisibility'],
    value: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      profileVisibility: {
        ...prev.profileVisibility,
        [field]: value,
      },
    }))
  }

  const handleReviewChange = (field: keyof PrivacySettings['reviewSettings'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      reviewSettings: {
        ...prev.reviewSettings,
        [field]: value,
      },
    }))
  }

  const handleDataSharingChange = (field: keyof PrivacySettings['dataSharing'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      dataSharing: {
        ...prev.dataSharing,
        [field]: value,
      },
    }))
  }

  const handleSecurityChange = (
    field: keyof PrivacySettings['accountSecurity'],
    value: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      accountSecurity: {
        ...prev.accountSecurity,
        [field]: value,
      },
    }))
  }

  const handleRetentionChange = (
    field: keyof PrivacySettings['dataRetention'],
    value: boolean | number
  ) => {
    setFormData(prev => ({
      ...prev,
      dataRetention: {
        ...prev.dataRetention,
        [field]: value,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const getPrivacyScore = () => {
    const settings = formData
    let score = 0
    let total = 0

    // Profile visibility (less visibility = higher privacy)
    total += 4
    score += settings.profileVisibility.showRealName ? 0 : 1
    score += settings.profileVisibility.showEmail ? 0 : 1
    score += settings.profileVisibility.showPhone ? 0 : 1
    score += settings.profileVisibility.showJoinDate ? 0 : 1

    // Review settings
    total += 3
    score += settings.reviewSettings.showAuthorName ? 0 : 1
    score += settings.reviewSettings.allowPublicReviews ? 0 : 1
    score += settings.reviewSettings.allowContactFromReviewees ? 0 : 1

    // Data sharing (less sharing = higher privacy)
    total += 4
    score += settings.dataSharing.allowAnalytics ? 0 : 1
    score += settings.dataSharing.allowMarketing ? 0 : 1
    score += settings.dataSharing.allowThirdParty ? 0 : 1
    score += settings.dataSharing.allowLocationTracking ? 0 : 1

    // Security (more security = higher privacy)
    total += 3
    score += settings.accountSecurity.twoFactorAuth ? 1 : 0
    score += settings.accountSecurity.loginNotifications ? 1 : 0
    score += settings.accountSecurity.deviceTracking ? 1 : 0

    // Data retention (less retention = higher privacy)
    total += 3
    score += settings.dataRetention.autoDeleteReviews ? 1 : 0
    score += settings.dataRetention.keepSearchHistory ? 0 : 1
    score += settings.dataRetention.keepViewHistory ? 0 : 1

    return Math.round((score / total) * 100)
  }

  const privacyScore = getPrivacyScore()

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* 프라이버시 점수 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            프라이버시 점수
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4'>
            <div className='flex-1'>
              <div className='flex justify-between text-sm mb-2'>
                <span>현재 프라이버시 수준</span>
                <span className='font-medium'>{privacyScore}%</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    privacyScore >= 80
                      ? 'bg-green-500'
                      : privacyScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${privacyScore}%` }}
                />
              </div>
            </div>
            <Badge
              className={
                privacyScore >= 80
                  ? 'bg-green-100 text-green-700'
                  : privacyScore >= 60
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }
            >
              {privacyScore >= 80 ? '높음' : privacyScore >= 60 ? '보통' : '낮음'}
            </Badge>
          </div>
          <p className='text-sm text-gray-500 mt-2'>
            프라이버시 설정을 조정하여 개인정보 보호 수준을 높일 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* 프로필 공개 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Eye className='h-5 w-5' />
            프로필 공개 설정
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>실명 공개</div>
                <div className='text-sm text-gray-500'>다른 사용자에게 실명을 보여줍니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.profileVisibility.showRealName}
                onChange={e => handleVisibilityChange('showRealName', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>이메일 주소 공개</div>
                <div className='text-sm text-gray-500'>다른 사용자에게 이메일을 보여줍니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.profileVisibility.showEmail}
                onChange={e => handleVisibilityChange('showEmail', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>전화번호 공개</div>
                <div className='text-sm text-gray-500'>다른 사용자에게 전화번호를 보여줍니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.profileVisibility.showPhone}
                onChange={e => handleVisibilityChange('showPhone', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>가입일 공개</div>
                <div className='text-sm text-gray-500'>다른 사용자에게 가입일을 보여줍니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.profileVisibility.showJoinDate}
                onChange={e => handleVisibilityChange('showJoinDate', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 후기 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            후기 및 활동 설정
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>후기 작성자명 표시</div>
                <div className='text-sm text-gray-500'>내가 작성한 후기에 이름을 표시합니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.reviewSettings.showAuthorName}
                onChange={e => handleReviewChange('showAuthorName', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>공개 후기 허용</div>
                <div className='text-sm text-gray-500'>다른 사용자가 내 후기를 볼 수 있습니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.reviewSettings.allowPublicReviews}
                onChange={e => handleReviewChange('allowPublicReviews', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>후기 관련 연락 허용</div>
                <div className='text-sm text-gray-500'>
                  후기와 관련하여 다른 사용자의 연락을 받습니다
                </div>
              </div>
              <input
                type='checkbox'
                checked={formData.reviewSettings.allowContactFromReviewees}
                onChange={e => handleReviewChange('allowContactFromReviewees', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 공유 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Lock className='h-5 w-5' />
            데이터 공유 설정
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>서비스 개선을 위한 분석 데이터</div>
                <div className='text-sm text-gray-500'>
                  앱 사용 패턴 분석을 통한 서비스 개선에 도움
                </div>
              </div>
              <input
                type='checkbox'
                checked={formData.dataSharing.allowAnalytics}
                onChange={e => handleDataSharingChange('allowAnalytics', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>마케팅 활용</div>
                <div className='text-sm text-gray-500'>개인화된 광고 및 마케팅 메시지 수신</div>
              </div>
              <input
                type='checkbox'
                checked={formData.dataSharing.allowMarketing}
                onChange={e => handleDataSharingChange('allowMarketing', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>제3자 파트너 공유</div>
                <div className='text-sm text-gray-500'>
                  파트너사와의 데이터 공유 (익명화된 통계)
                </div>
              </div>
              <input
                type='checkbox'
                checked={formData.dataSharing.allowThirdParty}
                onChange={e => handleDataSharingChange('allowThirdParty', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>위치 추적 허용</div>
                <div className='text-sm text-gray-500'>위치 기반 추천 서비스 제공</div>
              </div>
              <input
                type='checkbox'
                checked={formData.dataSharing.allowLocationTracking}
                onChange={e => handleDataSharingChange('allowLocationTracking', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 보안 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            계정 보안
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>2단계 인증</div>
                <div className='text-sm text-gray-500'>SMS 또는 앱을 통한 추가 보안 인증</div>
              </div>
              <input
                type='checkbox'
                checked={formData.accountSecurity.twoFactorAuth}
                onChange={e => handleSecurityChange('twoFactorAuth', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>로그인 알림</div>
                <div className='text-sm text-gray-500'>새로운 기기에서 로그인 시 알림 받기</div>
              </div>
              <input
                type='checkbox'
                checked={formData.accountSecurity.loginNotifications}
                onChange={e => handleSecurityChange('loginNotifications', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>기기 추적</div>
                <div className='text-sm text-gray-500'>로그인한 기기 목록 관리 및 추적</div>
              </div>
              <input
                type='checkbox'
                checked={formData.accountSecurity.deviceTracking}
                onChange={e => handleSecurityChange('deviceTracking', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 보관 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <History className='h-5 w-5' />
            데이터 보관 설정
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>후기 자동 삭제</div>
                <div className='text-sm text-gray-500'>오래된 후기를 자동으로 삭제합니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.dataRetention.autoDeleteReviews}
                onChange={e => handleRetentionChange('autoDeleteReviews', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            {formData.dataRetention.autoDeleteReviews && (
              <div className='ml-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>삭제 주기</label>
                <select
                  value={formData.dataRetention.autoDeletePeriod}
                  onChange={e =>
                    handleRetentionChange('autoDeletePeriod', parseInt(e.target.value))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md'
                >
                  {dataRetentionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} 후 삭제
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>검색 기록 보관</div>
                <div className='text-sm text-gray-500'>매물 검색 기록을 저장합니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.dataRetention.keepSearchHistory}
                onChange={e => handleRetentionChange('keepSearchHistory', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>

            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>조회 기록 보관</div>
                <div className='text-sm text-gray-500'>매물 상세 조회 기록을 저장합니다</div>
              </div>
              <input
                type='checkbox'
                checked={formData.dataRetention.keepViewHistory}
                onChange={e => handleRetentionChange('keepViewHistory', e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            데이터 관리
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onExportData}
              className='w-full justify-start gap-2'
            >
              <Download className='h-4 w-4' />내 데이터 다운로드
            </Button>
            <p className='text-sm text-gray-500'>
              계정에 저장된 모든 데이터를 JSON 형식으로 다운로드할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 위험 구역 */}
      <Card className='border-red-200'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='h-5 w-5' />
              위험 구역
            </CardTitle>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setShowDangerZone(!showDangerZone)}
              className='gap-2'
            >
              {showDangerZone ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              {showDangerZone ? '숨기기' : '보기'}
            </Button>
          </div>
        </CardHeader>
        {showDangerZone && (
          <CardContent>
            <div className='space-y-4 p-4 bg-red-50 rounded-lg'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='h-5 w-5 text-red-500 mt-0.5' />
                <div className='flex-1'>
                  <h4 className='font-medium text-red-900'>계정 삭제</h4>
                  <p className='text-sm text-red-700 mb-3'>
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수
                    없습니다.
                  </p>
                  <Button
                    type='button'
                    variant='destructive'
                    onClick={onDeleteAccount}
                    className='gap-2'
                  >
                    <UserX className='h-4 w-4' />
                    계정 삭제
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
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
