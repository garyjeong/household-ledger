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

import React, { useState } from 'react'
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

type TabType = 'profile' | 'security' | 'account'

export default function ProfilePage() {
  const { currentGroup, generateInvite } = useGroup()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [isCopyingInvite, setIsCopyingInvite] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  // 초대 코드 복사
  const handleCopyInvite = async () => {
    if (!currentGroup) return

    setIsCopyingInvite(true)
    try {
      const result = await generateInvite(currentGroup.id)
      if (result.success && result.inviteCode && result.inviteUrl) {
        // 자동으로 클립보드에 초대 코드 저장
        try {
          await navigator.clipboard.writeText(result.inviteCode)
          toast({
            title: '초대 코드가 생성되었습니다',
            description: '초대 코드가 클립보드에 복사되었습니다. 가족에게 공유해주세요!',
          })
        } catch (clipboardError) {
          // 클립보드 접근 실패 시 알림
          toast({
            title: '초대 코드가 생성되었습니다',
            description: `초대 코드: ${result.inviteCode} (수동으로 복사해서 공유해주세요)`,
          })
        }
      } else {
        toast({
          title: '초대 코드 복사 실패',
          description: result.error || '잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '오류가 발생했습니다',
        description: '네트워크 연결을 확인해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsCopyingInvite(false)
    }
  }


  // 코드로 그룹 참여
  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      toast({
        title: '초대 코드를 입력해주세요',
        description: '가족으로부터 받은 초대 코드를 입력하세요.',
        variant: 'destructive',
      })
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: joinCode.trim() }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: '그룹 참여 성공!',
          description: `${result.group?.name} 그룹에 참여했습니다.`,
        })
        setJoinCode('')
        // 페이지 새로고침으로 그룹 정보 업데이트
        window.location.reload()
      } else {
        toast({
          title: '그룹 참여 실패',
          description: result.error || '유효하지 않은 초대 코드이거나 만료되었습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '오류가 발생했습니다',
        description: '네트워크 연결을 확인해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsJoining(false)
    }
  }

  // 계정 삭제 (추후 구현)
  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      '정말로 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 가계부 데이터가 영구적으로 삭제됩니다.'
    )

    if (confirmed) {
      const doubleConfirmed = window.confirm(
        '마지막 확인입니다.\n\n계정을 삭제하면:\n• 모든 거래 내역이 삭제됩니다\n• 그룹에서 자동으로 탈퇴됩니다\n• 데이터 복구가 불가능합니다\n\n정말 계속하시겠습니까?'
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
                          멤버: {currentGroup.memberCount || 0}명
                        </p>
                      </div>
                      <Badge className='bg-green-100 text-green-700'>연결됨</Badge>
                    </div>

                    <div className='pt-4 border-t space-y-4'>
                      <div className='space-y-2'>
                        <p className='text-sm text-gray-600'>
                          • 그룹 멤버와 가계부를 공유하고 있습니다
                        </p>
                        <p className='text-sm text-gray-600'>
                          • 모든 거래 내역이 실시간으로 동기화됩니다
                        </p>
                      </div>

                      {/* 가족 초대 섹션 */}
                      <div className='bg-gray-50 rounded-lg p-4'>
                        <div className='flex items-center justify-between mb-3'>
                          <h4 className='font-medium text-gray-900 flex items-center gap-2'>
                            <UserPlus className='h-4 w-4' />
                            가족 초대하기
                          </h4>
                          <Button
                            onClick={handleCopyInvite}
                            disabled={isCopyingInvite}
                            size='sm'
                            variant='outline'
                          >
                            {isCopyingInvite ? '복사 중...' : '초대 코드 복사'}
                          </Button>
                        </div>

                        <p className='text-sm text-gray-500'>
                          버튼을 클릭하면 초대 코드가 자동으로 클립보드에 복사됩니다. 가족에게 코드를 공유해주세요!
                        </p>
                        <p className='text-xs text-gray-400 mt-2'>
                          💡 초대 코드는 24시간 후 자동으로 만료됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <Heart className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      개인 가계부를 사용 중입니다
                    </h3>
                    <p className='text-gray-600 mb-6'>
                      현재 개인 가계부로 사용하고 있습니다.<br />
                      가족 초대 코드를 입력해 함께 관리할 수 있습니다.
                    </p>

                    {/* 가족 그룹 참여 섹션 */}
                    <div className='max-w-md mx-auto'>
                      <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                        <div className='flex items-center gap-2 mb-3'>
                          <UserPlus className='h-5 w-5 text-blue-600' />
                          <h4 className='font-medium text-blue-900'>가족 그룹 참여하기</h4>
                        </div>
                        
                        <div className='space-y-3'>
                          <div>
                            <label className='block text-sm font-medium text-blue-700 mb-1'>
                              초대 코드 입력
                            </label>
                            <input
                              type='text'
                              value={joinCode}
                              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                              placeholder='ABC123DEF456'
                              maxLength={12}
                              className='w-full px-3 py-2 border border-blue-300 rounded-md text-center font-mono text-sm uppercase tracking-wider placeholder:text-blue-400'
                              disabled={isJoining}
                            />
                          </div>
                          
                          <Button
                            onClick={handleJoinGroup}
                            disabled={!joinCode.trim() || isJoining}
                            className='w-full'
                            size='sm'
                          >
                            {isJoining ? '참여 중...' : '그룹 참여하기'}
                          </Button>
                          
                          <p className='text-xs text-blue-600'>
                            가족으로부터 받은 12자리 초대 코드를 입력하세요.
                          </p>
                        </div>
                      </div>
                    </div>
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
              <div className='flex items-center justify-between'>
                <Button 
                  variant='destructive' 
                  size='sm' 
                  onClick={handleDeleteAccount}
                  className='h-7 px-3 text-xs'
                >
                  계정 삭제
                </Button>
              </div>
              <p className='text-xs text-red-600 mt-1'>
                모든 데이터가 영구 삭제됩니다
              </p>
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
      <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
        {/* 헤더 */}
        <div className='sticky top-0 z-20 bg-white pb-6 mb-6 border-b border-gray-100'>
          <div className='pt-6'>
            <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>내 정보</h1>
            <p className='text-slate-600 mt-1'>프로필 및 설정 관리</p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as TabType)}>
          <TabsList className='mb-6'>
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <TabsTrigger key={tab.id} value={tab.id} className='gap-2'>
                  <Icon className='h-4 w-4' />
                  <div className='hidden sm:block'>
                    <div className='text-sm font-medium'>{tab.label}</div>
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
    </ResponsiveLayout>
  )
}
