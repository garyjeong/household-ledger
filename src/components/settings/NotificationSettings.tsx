'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  BellOff, 
  Settings, 
  Smartphone,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useUpdateNotifications, useSettingsQuery } from '@/hooks/use-settings'
import { Switch } from '@/components/ui/switch'

interface NotificationSettingsProps {
  className?: string
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { toast } = useToast()
  const { data: settings } = useSettingsQuery()
  const updateNotifications = useUpdateNotifications()

  // 로컬 상태
  const [notificationPermission, setNotificationPermission] = 
    useState<NotificationPermission>('default')

  // 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
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

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        
        if (permission === 'granted') {
          toast({
            title: '알림 권한 허용됨',
            description: '이제 알림을 받을 수 있습니다.',
          })
        } else {
          toast({
            title: '알림 권한 거부됨',
            description: '브라우저 설정에서 알림을 허용해주세요.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: '오류',
          description: '알림 권한 요청 중 오류가 발생했습니다.',
          variant: 'destructive',
        })
      }
    }
  }

  // 테스트 알림
  const handleTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('💰 가계부 알림 테스트', {
          body: '알림이 정상적으로 작동하고 있습니다!',
          icon: '/favicon.ico'
        })
        toast({
          title: '테스트 알림 발송',
          description: '알림을 확인해보세요.',
        })
      } else {
        toast({
          title: '알림 권한 필요',
          description: '먼저 알림 권한을 허용해주세요.',
          variant: 'destructive',
        })
      }
    }
  }

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">허용됨</Badge>
      case 'denied':
        return <Badge variant="destructive">차단됨</Badge>
      default:
        return <Badge variant="secondary">대기 중</Badge>
    }
  }

  return (
    <div className={className}>
      {/* 브라우저 알림 권한 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              브라우저 알림 권한
            </CardTitle>
            {getPermissionBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">브라우저 알림</p>
                <p className="text-xs text-gray-500">
                  예산 초과, 중요한 거래 등에 대한 알림을 받으세요
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notificationPermission !== 'granted' && (
                <Button onClick={requestNotificationPermission} size="sm">
                  권한 허용
                </Button>
              )}
              {notificationPermission === 'granted' && (
                <Button onClick={handleTestNotification} variant="outline" size="sm">
                  테스트
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기본 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 일반 알림 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enable-notifications" className="text-base font-medium">
                일반 알림 활성화
              </Label>
              <p className="text-sm text-gray-500">
                앱 내 알림을 받을지 설정합니다
              </p>
            </div>
            <Switch
              id="enable-notifications"
              checked={settings?.enableNotifications ?? true}
              onCheckedChange={(checked) => handleBasicSettingChange('enableNotifications', checked)}
            />
          </div>

          {/* 예산 알림 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="budget-alerts" className="text-base font-medium">
                예산 초과 알림
              </Label>
              <p className="text-sm text-gray-500">
                예산을 초과했을 때 알림을 받습니다
              </p>
            </div>
            <Switch
              id="budget-alerts"
              checked={settings?.budgetAlerts ?? true}
              onCheckedChange={(checked) => handleBasicSettingChange('budgetAlerts', checked)}
              disabled={!settings?.enableNotifications}
            />
          </div>

          {/* 알림음 (단순화) */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notification-sound" className="text-base font-medium">
                알림음
              </Label>
              <p className="text-sm text-gray-500">
                알림과 함께 소리를 재생합니다
              </p>
            </div>
            <Switch
              id="notification-sound"
              checked={settings?.notificationSound ?? false}
              onCheckedChange={(checked) => handleBasicSettingChange('notificationSound', checked)}
              disabled={!settings?.enableNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* 간단한 도움말 */}
      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-900">알림 안내</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 브라우저 알림 권한을 허용하면 탭을 닫아도 알림을 받을 수 있습니다</li>
                <li>• 예산 초과 시 즉시 알림으로 과소비를 방지할 수 있습니다</li>
                <li>• 모바일에서는 홈 화면에 앱을 추가하면 더 나은 알림 환경을 제공합니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}