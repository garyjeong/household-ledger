/**
 * 내 정보 페이지
 * T-023: 내 정보 페이지 개발
 *
 * 기능:
 * - 사용자 프로필 조회 및 수정
 * - 비밀번호 변경
 * - 계정 설정 관리
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  User,
  Users,
  Settings,
  Shield,
  Heart,
  Calendar,
  Smartphone,
  UserPlus,
  Share,
  Clipboard,
  ClipboardCheck,
  RefreshCw,
  LogOut,
} from 'lucide-react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm'
import { useProfile } from '@/hooks/use-profile'
import { useGroup } from '@/contexts/group-context'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'

type TabType = 'profile' | 'security' | 'account'

export default function ProfilePage() {
  const { currentGroup, generateInvite, getInviteCode, refreshGroups } = useGroup()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { toast } = useToast()
  const { logout } = useAuth()

  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null)
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // 초대 코드 조회 함수
  const fetchInviteCode = useCallback(async () => {
    if (!currentGroup) return
    const result = await getInviteCode(currentGroup.id)
    if (result.success) {
      setInviteCode(result.inviteCode || null)
      setInviteExpiresAt(result.expiresAt || null)
    }
  }, [currentGroup, getInviteCode])

  // '계정 관리' 탭이 활성화되면 초대 코드 조회
  useEffect(() => {
    if (activeTab === 'account' && currentGroup) {
      fetchInviteCode()
    }
  }, [activeTab, currentGroup, fetchInviteCode])

  // 새로운 초대 코드 생성
  const handleGenerateInvite = async () => {
    if (!currentGroup) return

    setIsGeneratingInvite(true)
    try {
      const result = await generateInvite(currentGroup.id)
      if (result.success && result.inviteCode) {
        setInviteCode(result.inviteCode)
        setInviteExpiresAt(result.expiresAt || null)
        toast({
          title: '새로운 초대 코드가 생성되었습니다',
          description: '코드를 복사하여 가족에게 공유해주세요!',
        })
      } else {
        toast({
          title: '초대 코드 생성 실패',
          description: result.error || '잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsGeneratingInvite(false)
    }
  }

  // 클립보드에 코드 복사
  const handleCopyCode = () => {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode).then(() => {
      setIsCopied(true)
      toast({
        title: '초대 코드가 복사되었습니다',
        description: '가족에게 코드를 공유해주세요!',
      })
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  // 계정 삭제 (추후 구현)
  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      '정말로 계정을 삭제하시겠습니까?\\n\\n이 작업은 되돌릴 수 없으며, 모든 가계부 데이터가 영구적으로 삭제됩니다.'
    )

    if (confirmed) {
      const doubleConfirmed = window.confirm(
        '마지막 확인입니다.\\n\\n계정을 삭제하면:\\n• 모든 거래 내역이 삭제됩니다\\n• 그룹에서 자동으로 탈퇴됩니다\\n• 데이터 복구가 불가능합니다\\n\\n정말 계속하시겠습니까?'
      )

      if (doubleConfirmed) {
        // TODO: 계정 삭제 API 구현
        alert('계정 삭제 기능은 추후 구현 예정입니다.')
      }
    }
  }

  // 사용 기간 계산
  const getDaysUsed = () => {
    if (!profile?.createdAt) return 0
    const now = new Date()
    const joinDate = new Date(profile.createdAt)
    const diffTime = Math.abs(now.getTime() - joinDate.getTime())
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
      id: 'security' as TabType,
      label: '보안 설정',
      icon: Shield,
      description: '비밀번호 및 보안',
    },
    {
      id: 'account' as TabType,
      label: '계정 관리',
      icon: Settings,
      description: '계정 설정 및 관리',
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'security':
        return <PasswordChangeForm />

      case 'account':
        return (
          <div className='space-y-6'>
            {/* 그룹 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Heart className='h-5 w-5' />
                  가족 그룹 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentGroup ? (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-medium text-gray-900'>{currentGroup.name}</h3>
                        <p className='text-sm text-gray-500'>
                          멤버: {currentGroup.memberCount || 1}명
                        </p>
                      </div>
                      <Badge className='bg-green-100 text-green-700'>
                        {(currentGroup.memberCount || 1) > 1 ? '연결됨' : '개인'}
                      </Badge>
                    </div>

                    {/* 새 그룹 멤버 환영 메시지 (조건부 렌더링 유지) */}
                    {(currentGroup.memberCount || 0) > 1 && (
                      <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                        <div className='flex items-center gap-2 mb-2'>
                          <span className='text-blue-600 text-lg'>🎉</span>
                          <h4 className='font-medium text-blue-900'>
                            가족 가계부에 오신 것을 환영해요!
                          </h4>
                        </div>
                        <div className='text-sm text-blue-700 space-y-1'>
                          <p>• 모든 가족 구성원의 수입/지출 내역이 실시간으로 공유됩니다</p>
                          <p>• 거래 추가 시 누가 입력했는지 자동으로 기록됩니다</p>
                          <p>• 월별 통계에서 가족 전체의 가계 현황을 확인할 수 있어요</p>
                        </div>
                      </div>
                    )}

                    <div className='pt-4 border-t space-y-4'>
                      {/* 가족 초대 섹션 */}
                      <div className='bg-gray-50 rounded-lg p-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <h4 className='font-medium text-gray-900 flex items-center gap-2'>
                            <UserPlus className='h-4 w-4' />
                            가족 초대 코드
                          </h4>
                        </div>

                        {inviteCode ? (
                          <div className='space-y-3'>
                            <div className='flex items-center gap-2 bg-white border rounded-md p-2'>
                              <Input
                                readOnly
                                value={inviteCode}
                                className='flex-1 border-none focus:ring-0 h-auto p-0 text-lg font-mono tracking-wider'
                              />
                              <Button
                                onClick={handleCopyCode}
                                size='icon'
                                variant='ghost'
                                className='h-8 w-8'
                              >
                                {isCopied ? (
                                  <ClipboardCheck className='h-4 w-4 text-green-600' />
                                ) : (
                                  <Clipboard className='h-4 w-4' />
                                )}
                              </Button>
                            </div>
                            <div className='flex items-center justify-between text-xs text-gray-500'>
                              <span>
                                {inviteExpiresAt
                                  ? `만료일: ${new Date(
                                      inviteExpiresAt
                                    ).toLocaleString()}`
                                  : '24시간 내 만료'}
                              </span>
                              <Button
                                onClick={handleGenerateInvite}
                                disabled={isGeneratingInvite}
                                size='sm'
                                variant='link'
                                className='h-auto p-0 text-xs'
                              >
                                <RefreshCw className='h-3 w-3 mr-1' />
                                {isGeneratingInvite ? '생성 중...' : '코드 재생성'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className='text-center py-4'>
                            <p className='text-sm text-gray-600 mb-4'>
                              초대 코드를 생성하여 가족을 초대하세요.
                            </p>
                            <Button
                              onClick={handleGenerateInvite}
                              disabled={isGeneratingInvite}
                            >
                              {isGeneratingInvite ? '생성 중...' : '초대 코드 생성하기'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <Heart className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      가족 그룹 정보를 불러오는 중...
                    </h3>
                    <p className='text-gray-600'>잠시만 기다려주세요.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 앱 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Smartphone className='h-5 w-5' />앱 설정
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>테마</label>
                    <div className='text-sm text-gray-500'>라이트 모드</div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>언어</label>
                    <div className='text-sm text-gray-500'>한국어</div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>기본 통화</label>
                    <div className='text-sm text-gray-500'>KRW (원)</div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>알림</label>
                    <div className='text-sm text-gray-500'>활성화됨</div>
                  </div>
                </div>

                <div className='pt-4 border-t'>
                  <p className='text-xs text-gray-500'>
                    * 상세한 설정은 추후 업데이트에서 제공될 예정입니다
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 계정 삭제 섹션 */}
            <div className='border border-red-200 bg-red-50/30 rounded-lg p-3'>
              <div className='flex items-center justify-between gap-4'>
                <Button 
                  variant='destructive' 
                  size='sm' 
                  onClick={handleDeleteAccount}
                  className='h-7 px-3 text-xs flex-shrink-0'
                >
                  계정 삭제
                </Button>
                <p className='text-xs text-red-600'>
                  모든 데이터가 영구 삭제됩니다
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className='space-y-6'>
            {/* 프로필 통계 */}
            {profile && (
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <Card>
                  <CardContent className='p-6 text-center'>
                    <Calendar className='h-8 w-8 text-blue-600 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-blue-600'>{getDaysUsed()}일</div>
                    <div className='text-sm text-gray-500'>서비스 이용</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-6 text-center'>
                    <Heart className='h-8 w-8 text-pink-600 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-pink-600'>
                      {currentGroup ? '연결됨' : '대기중'}
                    </div>
                    <div className='text-sm text-gray-500'>가족 그룹</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-6 text-center'>
                    <Shield className='h-8 w-8 text-green-600 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-green-600'>안전</div>
                    <div className='text-sm text-gray-500'>계정 보안</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 프로필 폼 */}
            <ProfileForm />

            {/* 로그아웃 버튼: 프로필 정보 탭 최하단 */}
            <div>
              <Button
                onClick={logout}
                variant='destructive'
                className='w-full'
                data-testid='logout-button'
              >
                로그아웃
              </Button>
            </div>
          </div>
        )
    }
  }

  if (profileLoading) {
    return (
      <ResponsiveLayout>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <p className='text-gray-500'>프로필 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout>
      <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 space-y-4'>
        {/* 헤더 */}
        <div className='sticky-header mb-2'>
          <div className='pt-4 bg-white border border-slate-200 rounded-lg p-4 shadow-sm'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>내 정보</h1>
              <p className='text-slate-600 mt-1'>프로필 및 설정 관리</p>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className='space-y-6'>
          {/* 탭 네비게이션 */}
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as TabType)}>
          <TabsList className='flex w-full bg-white border rounded-lg overflow-hidden'>
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  aria-label={tab.label}
                  className='
                    h-12 sm:h-12 flex-1 rounded-none flex items-center justify-center
                    px-3 sm:px-4 border-l border-slate-200 first:border-l-0 select-none
                    data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600
                    text-slate-700 text-sm whitespace-nowrap leading-none
                    focus-visible:outline-none focus-visible:ring-0 transition-colors
                  '
                >
                  <div className='flex items-center gap-2'>
                    <Icon className='h-5 w-5 sm:h-4 sm:w-4' />
                    <div className='text-sm font-medium whitespace-nowrap'>{tab.label}</div>
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* 탭 콘텐츠 */}
          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id}>
              {renderTabContent()}
            </TabsContent>
          ))}
        </Tabs>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
