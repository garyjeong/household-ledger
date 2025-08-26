'use client'

import React, { useState } from 'react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  EyeOff
} from 'lucide-react'
import { QuickAddModal } from '@/components/couple-ledger/QuickAddModal'
import { defaultCategories } from '@/components/couple-ledger/CategoryPicker'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  joinDate: Date
  lastLogin: Date
  groupCode?: string
  groupName?: string
  partnerName?: string
  profileImage?: string
  isVerified: boolean
  notificationSettings: {
    email: boolean
    push: boolean
    budget: boolean
    weeklyReport: boolean
  }
  currency: string
  language: string
  theme: 'light' | 'dark' | 'auto'
}

// 더미 사용자 데이터
const dummyProfile: UserProfile = {
  id: '1',
  name: '김신혼',
  email: 'kim.newlywed@example.com',
  phone: '010-1234-5678',
  joinDate: new Date('2024-12-01'),
  lastLogin: new Date('2025-01-08T14:30:00'),
  groupCode: 'COUPLE2025',
  groupName: '김신혼♥박신혼의 가계부',
  partnerName: '박신혼',
  isVerified: true,
  notificationSettings: {
    email: true,
    push: true,
    budget: true,
    weeklyReport: false
  },
  currency: 'KRW',
  language: 'ko',
  theme: 'light'
}

/**
 * 내 정보 페이지
 * 
 * 기능:
 * - 프로필 정보 관리
 * - 알림 설정
 * - 그룹 관리
 * - 보안 설정
 * - 앱 설정
 */
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(dummyProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: profile.name,
    phone: profile.phone
  })
  const [showGroupCode, setShowGroupCode] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  // 프로필 수정
  const handleSaveProfile = () => {
    setProfile(prev => ({
      ...prev,
      name: editForm.name,
      phone: editForm.phone
    }))
    setIsEditing(false)
  }

  // 편집 취소
  const handleCancelEdit = () => {
    setEditForm({
      name: profile.name,
      phone: profile.phone
    })
    setIsEditing(false)
  }

  // 알림 설정 변경
  const updateNotificationSetting = (key: keyof UserProfile['notificationSettings'], value: boolean) => {
    setProfile(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key]: value
      }
    }))
  }

  // 그룹 코드 복사
  const copyGroupCode = async () => {
    if (profile.groupCode) {
      await navigator.clipboard.writeText(profile.groupCode)
      // TODO: 토스트 메시지 표시
    }
  }

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 사용 기간 계산
  const getDaysUsed = () => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - profile.joinDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <>
      <ResponsiveLayout onQuickAddClick={() => setIsQuickAddOpen(true)}>
        <div className="w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          {/* 헤더 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">내 정보</h1>
              <p className="text-gray-500">프로필 및 설정 관리</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                고급 설정
              </Button>
              <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* 프로필 정보 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      프로필 정보
                    </CardTitle>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        편집
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="gap-1"
                        >
                          <X className="h-4 w-4" />
                          취소
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          className="gap-1"
                        >
                          <Save className="h-4 w-4" />
                          저장
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 프로필 이미지 및 기본 정보 */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold">{profile.name}</h2>
                        {profile.isVerified && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            인증됨
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-500">{profile.email}</p>
                      <p className="text-sm text-gray-400">
                        {getDaysUsed()}일째 사용 중 • 가입일: {formatDate(profile.joinDate)}
                      </p>
                    </div>
                  </div>

                  {/* 편집 가능한 필드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이름
                      </label>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="이름을 입력하세요"
                        />
                      ) : (
                        <div className="text-gray-900">{profile.name}</div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        전화번호
                      </label>
                      {isEditing ? (
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="전화번호를 입력하세요"
                        />
                      ) : (
                        <div className="text-gray-900">{profile.phone}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일
                      </label>
                      <div className="text-gray-500">{profile.email}</div>
                      <p className="text-xs text-gray-400 mt-1">이메일은 변경할 수 없습니다</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        마지막 로그인
                      </label>
                      <div className="text-gray-500">{formatDate(profile.lastLogin)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 부부 그룹 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    부부 그룹 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.groupCode ? (
                    <>
                      <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-pink-600" />
                          <div>
                            <div className="font-medium text-gray-900">{profile.groupName}</div>
                            <div className="text-sm text-gray-500">
                              배우자: {profile.partnerName}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-pink-100 text-pink-700">연결됨</Badge>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          그룹 초대 코드
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Input
                              value={showGroupCode ? profile.groupCode : '••••••••'}
                              readOnly
                              className="pr-10"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowGroupCode(!showGroupCode)}
                            >
                              {showGroupCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            onClick={copyGroupCode}
                            className="gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            복사
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          이 코드를 배우자에게 공유하여 가계부를 연결하세요
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        아직 그룹에 참여하지 않았습니다
                      </h3>
                      <p className="text-gray-500 mb-4">
                        배우자와 가계부를 공유하려면 그룹을 생성하거나 참여하세요
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button>그룹 생성</Button>
                        <Button variant="outline">그룹 참여</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 알림 설정 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    알림 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">이메일 알림</div>
                          <div className="text-sm text-gray-500">
                            중요한 활동 및 업데이트를 이메일로 받습니다
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.notificationSettings.email}
                        onChange={(e) => updateNotificationSetting('email', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">푸시 알림</div>
                          <div className="text-sm text-gray-500">
                            앱에서 실시간 알림을 받습니다
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.notificationSettings.push}
                        onChange={(e) => updateNotificationSetting('push', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">예산 알림</div>
                          <div className="text-sm text-gray-500">
                            예산 초과 시 알림을 받습니다
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.notificationSettings.budget}
                        onChange={(e) => updateNotificationSetting('budget', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">주간 리포트</div>
                          <div className="text-sm text-gray-500">
                            매주 지출 요약을 이메일로 받습니다
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.notificationSettings.weeklyReport}
                        onChange={(e) => updateNotificationSetting('weeklyReport', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* 빠른 액션 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">빠른 액션</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Key className="h-4 w-4" />
                    비밀번호 변경
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Shield className="h-4 w-4" />
                    보안 설정
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    환경설정
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    그룹 관리
                  </Button>
                </CardContent>
              </Card>

              {/* 사용 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">사용 통계</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {getDaysUsed()}일
                    </div>
                    <div className="text-sm text-gray-500">사용 기간</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-gray-900">156</div>
                      <div className="text-xs text-gray-500">총 거래</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-gray-900">12</div>
                      <div className="text-xs text-gray-500">카테고리</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 앱 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">앱 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>버전</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>언어</span>
                    <span>한국어</span>
                  </div>
                  <div className="flex justify-between">
                    <span>통화</span>
                    <span>KRW (₩)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>테마</span>
                    <span>라이트</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
