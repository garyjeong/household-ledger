/**
 * 알림 설정 컴포넌트
 * T-026: 설정 하위 메뉴 - 프로필 관리 (알림 설정)
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  BellOff,
  Smartphone,
  Monitor,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useUpdateNotifications, useSettingsQuery } from '@/hooks/use-settings'
import {
  usePushTokens,
  useRegisterPushToken,
  useDeletePushToken,
  useDeactivateAllPushTokens,
  PushToken,
} from '@/hooks/use-push-notifications'
import {
  isNotificationSupported,
  getNotificationPermission,
  setupPushNotifications,
  disablePushNotifications,
  showTestNotification,
} from '@/lib/push-notifications'
import { Switch } from '@/components/ui/switch'

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { toast } = useToast()
  const { data: settings } = useSettingsQuery()
  const updateNotifications = useUpdateNotifications()

  // 푸시 토큰 관련 hooks
  const {
    data: pushTokens = [],
    isLoading: tokensLoading,
    refetch: refetchTokens,
  } = usePushTokens()
  const registerPushToken = useRegisterPushToken()
  const deletePushToken = useDeletePushToken()
  const deactivateAllTokens = useDeactivateAllPushTokens()

  // 로컬 상태
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabling, setIsEnabling] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)

  // 초기화
  useEffect(() => {
    setIsSupported(isNotificationSupported())
    setNotificationPermission(getNotificationPermission())
  }, [])

  // 기본 알림 설정 변경
  const handleBasicSettingChange = async (key: string, value: boolean) => {
    try {
      await updateNotifications.mutateAsync({ [key]: value })
      toast({
        title: '설정 저장됨',
        description: '알림 설정이 업데이트되었습니다.',
      })
    } catch (error) {
      toast({
        title: '설정 저장 실패',
        description: error instanceof Error ? error.message : '설정 저장에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 푸시 알림 활성화
  const handleEnablePushNotifications = async () => {
    if (!isSupported) {
      toast({
        title: '지원되지 않음',
        description: '이 브라우저는 푸시 알림을 지원하지 않습니다.',
        variant: 'destructive',
      })
      return
    }

    setIsEnabling(true)
    try {
      // 1. 푸시 알림 설정
      const { subscription } = await setupPushNotifications()

      // 2. 서버에 토큰 등록
      await registerPushToken.mutateAsync({
        token: subscription.endpoint,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: navigator.userAgent,
      })

      // 3. 기본 알림 설정 활성화
      await updateNotifications.mutateAsync({
        enableNotifications: true,
      })

      // 4. 상태 업데이트
      setNotificationPermission('granted')
      await refetchTokens()

      // 5. 테스트 알림 표시
      showTestNotification('알림 설정 완료', {
        body: '푸시 알림이 성공적으로 활성화되었습니다.',
      })

      toast({
        title: '푸시 알림 활성화 완료',
        description: '브라우저 푸시 알림이 성공적으로 설정되었습니다.',
      })
    } catch (error) {
      console.error('푸시 알림 활성화 실패:', error)
      toast({
        title: '푸시 알림 활성화 실패',
        description: error instanceof Error ? error.message : '푸시 알림 설정에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsEnabling(false)
    }
  }

  // 푸시 알림 비활성화
  const handleDisablePushNotifications = async () => {
    const confirmed = window.confirm(
      '푸시 알림을 비활성화하시겠습니까?\n\n이 기기에서 더 이상 푸시 알림을 받지 않습니다.'
    )

    if (!confirmed) return

    setIsDisabling(true)
    try {
      // 1. 브라우저 푸시 구독 해제
      await disablePushNotifications()

      // 2. 서버에서 모든 토큰 비활성화
      await deactivateAllTokens.mutateAsync()

      // 3. 기본 알림 설정 비활성화
      await updateNotifications.mutateAsync({
        enableNotifications: false,
      })

      // 4. 상태 업데이트
      await refetchTokens()

      toast({
        title: '푸시 알림 비활성화 완료',
        description: '푸시 알림이 성공적으로 비활성화되었습니다.',
      })
    } catch (error) {
      console.error('푸시 알림 비활성화 실패:', error)
      toast({
        title: '푸시 알림 비활성화 실패',
        description: error instanceof Error ? error.message : '푸시 알림 해제에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsDisabling(false)
    }
  }

  // 개별 토큰 삭제
  const handleDeleteToken = async (token: PushToken) => {
    const confirmed = window.confirm(
      `이 기기의 푸시 알림을 해제하시겠습니까?\n\n기기: ${token.userAgent?.substring(0, 50) || '알 수 없음'}...`
    )

    if (!confirmed) return

    try {
      await deletePushToken.mutateAsync({ tokenId: token.id, permanent: true })
      toast({
        title: '기기 알림 해제 완료',
        description: '해당 기기에서 푸시 알림이 해제되었습니다.',
      })
    } catch (error) {
      toast({
        title: '기기 알림 해제 실패',
        description: error instanceof Error ? error.message : '기기 알림 해제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 테스트 알림
  const handleTestNotification = () => {
    try {
      showTestNotification('테스트 알림', {
        body: '알림이 정상적으로 작동하고 있습니다.',
        requireInteraction: false,
      })
      toast({
        title: '테스트 알림 전송',
        description: '알림이 표시되었습니다.',
      })
    } catch (error) {
      toast({
        title: '테스트 알림 실패',
        description: error instanceof Error ? error.message : '테스트 알림 표시에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 권한 상태 표시
  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return { icon: CheckCircle, color: 'text-green-600', text: '허용됨' }
      case 'denied':
        return { icon: XCircle, color: 'text-red-600', text: '거부됨' }
      case 'default':
        return { icon: AlertTriangle, color: 'text-yellow-600', text: '미설정' }
      default:
        return { icon: Info, color: 'text-gray-600', text: '확인 중' }
    }
  }

  const permissionStatus = getPermissionStatus()
  const PermissionIcon = permissionStatus.icon

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 브라우저 지원 상태 */}
      {!isSupported && (
        <Card className='border-yellow-200 bg-yellow-50'>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3'>
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
              <div>
                <p className='font-medium text-yellow-800'>브라우저 제한</p>
                <p className='text-sm text-yellow-700'>
                  이 브라우저는 푸시 알림을 지원하지 않습니다. 최신 브라우저를 사용해 주세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기본 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            기본 알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* 알림 활성화 */}
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Label className='text-sm font-medium'>알림 사용</Label>
              <p className='text-xs text-gray-500'>가계부 관련 알림을 받습니다</p>
            </div>
            <Switch
              checked={settings?.enableNotifications || false}
              onCheckedChange={checked => handleBasicSettingChange('enableNotifications', checked)}
              disabled={updateNotifications.isPending}
            />
          </div>

          {/* 알림 소리 */}
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Label className='text-sm font-medium'>알림 소리</Label>
              <p className='text-xs text-gray-500'>알림 시 소리를 재생합니다</p>
            </div>
            <Switch
              checked={settings?.notificationSound || false}
              onCheckedChange={checked => handleBasicSettingChange('notificationSound', checked)}
              disabled={updateNotifications.isPending}
            />
          </div>

          {/* 예산 초과 알림 */}
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Label className='text-sm font-medium'>예산 초과 알림</Label>
              <p className='text-xs text-gray-500'>예산을 초과할 때 알림을 받습니다</p>
            </div>
            <Switch
              checked={settings?.budgetAlerts || false}
              onCheckedChange={checked => handleBasicSettingChange('budgetAlerts', checked)}
              disabled={updateNotifications.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* 푸시 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Smartphone className='h-5 w-5' />
            푸시 알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* 권한 상태 */}
          <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
            <div className='flex items-center gap-3'>
              <PermissionIcon className={`h-5 w-5 ${permissionStatus.color}`} />
              <div>
                <p className='font-medium text-gray-900'>브라우저 권한</p>
                <p className='text-sm text-gray-500'>{permissionStatus.text}</p>
              </div>
            </div>
            <Badge variant={notificationPermission === 'granted' ? 'default' : 'outline'}>
              {permissionStatus.text}
            </Badge>
          </div>

          {/* 푸시 알림 제어 */}
          <div className='flex gap-2'>
            {notificationPermission !== 'granted' ? (
              <Button
                onClick={handleEnablePushNotifications}
                disabled={!isSupported || isEnabling}
                className='flex-1 gap-2'
              >
                {isEnabling ? (
                  <RefreshCw className='h-4 w-4 animate-spin' />
                ) : (
                  <Bell className='h-4 w-4' />
                )}
                푸시 알림 활성화
              </Button>
            ) : (
              <>
                <Button onClick={handleTestNotification} variant='outline' className='gap-2'>
                  <Bell className='h-4 w-4' />
                  테스트
                </Button>
                <Button
                  onClick={handleDisablePushNotifications}
                  variant='destructive'
                  disabled={isDisabling}
                  className='gap-2'
                >
                  {isDisabling ? (
                    <RefreshCw className='h-4 w-4 animate-spin' />
                  ) : (
                    <BellOff className='h-4 w-4' />
                  )}
                  비활성화
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 등록된 기기 목록 */}
      {pushTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Monitor className='h-5 w-5' />
              등록된 기기 ({pushTokens.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {tokensLoading ? (
              <div className='text-center py-4'>
                <RefreshCw className='h-5 w-5 animate-spin mx-auto mb-2' />
                <p className='text-sm text-gray-500'>기기 목록을 불러오는 중...</p>
              </div>
            ) : (
              pushTokens.map(token => (
                <div
                  key={token.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <Smartphone className='h-4 w-4 text-gray-500' />
                      <p className='font-medium text-sm'>
                        {token.userAgent?.includes('Mobile') ? '모바일 기기' : '데스크톱'}
                      </p>
                      {token.isActive && (
                        <Badge variant='outline' className='text-xs'>
                          활성
                        </Badge>
                      )}
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>
                      최종 사용: {new Date(token.lastUsed).toLocaleString('ko-KR')}
                    </p>
                    <p className='text-xs text-gray-400 mt-1 font-mono'>
                      {token.userAgent?.substring(0, 80)}...
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeleteToken(token)}
                    variant='ghost'
                    size='sm'
                    className='gap-1'
                  >
                    <Trash2 className='h-3 w-3' />
                    해제
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
