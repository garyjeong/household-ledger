/**
 * 카테고리 설정 페이지
 * T-025: 설정 하위 메뉴 - 카테고리 관리
 */

'use client'

import React, { useState } from 'react'
import { Settings, Eye, SortAsc, RotateCcw, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryManagement } from '@/components/categories/CategoryManagement'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import {
  useCategoryDisplaySettings,
  useUpdateCategoryDisplay,
  useSettingsQuery,
} from '@/hooks/use-settings'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'

export default function CategorySettingsPage() {
  const { toast } = useToast()
  const { isLoading: settingsLoading } = useSettingsQuery()
  const categoryDisplay = useCategoryDisplaySettings()
  const updateCategoryDisplay = useUpdateCategoryDisplay()

  const [activeTab, setActiveTab] = useState('display')

  // 카테고리 표시 설정 업데이트
  const handleDisplaySettingChange = async (
    key: keyof typeof categoryDisplay,
    value: boolean | string
  ) => {
    try {
      await updateCategoryDisplay.mutateAsync({
        [key]: value,
      })

      toast({
        title: '설정 저장됨',
        description: '카테고리 표시 설정이 업데이트되었습니다.',
      })
    } catch (error) {
      toast({
        title: '설정 저장 실패',
        description: error instanceof Error ? error.message : '설정 저장에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 설정 초기화
  const handleResetSettings = async () => {
    const confirmed = window.confirm(
      '카테고리 표시 설정을 초기화하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.'
    )

    if (confirmed) {
      try {
        await updateCategoryDisplay.mutateAsync({
          showIcons: true,
          iconStyle: 'default',
          colorStyle: 'vibrant',
          groupByType: true,
          sortBy: 'name',
        })

        toast({
          title: '설정 초기화 완료',
          description: '카테고리 표시 설정이 기본값으로 초기화되었습니다.',
        })
      } catch (error) {
        toast({
          title: '초기화 실패',
          description: error instanceof Error ? error.message : '설정 초기화에 실패했습니다.',
          variant: 'destructive',
        })
      }
    }
  }

  if (settingsLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-500'>설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>설정</h1>
          <p className='text-gray-500'>카테고리 표시, 알림, 관리 옵션을 설정합니다</p>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleResetSettings}
            disabled={updateCategoryDisplay.isPending}
            className='gap-2'
          >
            <RotateCcw className='h-4 w-4' />
            초기화
          </Button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='display' className='gap-2'>
            <Eye className='h-4 w-4' />
            표시 설정
          </TabsTrigger>
          <TabsTrigger value='notifications' className='gap-2'>
            <Bell className='h-4 w-4' />
            알림 설정
          </TabsTrigger>
          <TabsTrigger value='management' className='gap-2'>
            <Settings className='h-4 w-4' />
            카테고리 관리
          </TabsTrigger>
        </TabsList>

        {/* 표시 설정 탭 */}
        <TabsContent value='display' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* 기본 표시 옵션 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Eye className='h-5 w-5' />
                  기본 표시 옵션
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* 아이콘 표시 */}
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <Label className='text-sm font-medium'>아이콘 표시</Label>
                    <p className='text-xs text-gray-500'>카테고리에 아이콘을 표시합니다</p>
                  </div>
                  <Switch
                    checked={categoryDisplay.showIcons}
                    onCheckedChange={checked => handleDisplaySettingChange('showIcons', checked)}
                    disabled={updateCategoryDisplay.isPending}
                  />
                </div>

                {/* 아이콘 스타일 */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>아이콘 스타일</Label>
                  <Select
                    value={categoryDisplay.iconStyle}
                    onValueChange={value => handleDisplaySettingChange('iconStyle', value)}
                    disabled={!categoryDisplay.showIcons || updateCategoryDisplay.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='default'>기본</SelectItem>
                      <SelectItem value='modern'>모던</SelectItem>
                      <SelectItem value='minimal'>미니멀</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 색상 스타일 */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>색상 스타일</Label>
                  <Select
                    value={categoryDisplay.colorStyle}
                    onValueChange={value => handleDisplaySettingChange('colorStyle', value)}
                    disabled={updateCategoryDisplay.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='vibrant'>선명한 색상</SelectItem>
                      <SelectItem value='pastel'>파스텔 색상</SelectItem>
                      <SelectItem value='monochrome'>단색</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 정렬 및 그룹화 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <SortAsc className='h-5 w-5' />
                  정렬 및 그룹화
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* 타입별 그룹화 */}
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <Label className='text-sm font-medium'>타입별 그룹화</Label>
                    <p className='text-xs text-gray-500'>수입/지출 카테고리를 분리하여 표시</p>
                  </div>
                  <Switch
                    checked={categoryDisplay.groupByType}
                    onCheckedChange={checked => handleDisplaySettingChange('groupByType', checked)}
                    disabled={updateCategoryDisplay.isPending}
                  />
                </div>

                {/* 정렬 방식 */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>정렬 방식</Label>
                  <Select
                    value={categoryDisplay.sortBy}
                    onValueChange={value => handleDisplaySettingChange('sortBy', value)}
                    disabled={updateCategoryDisplay.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='name'>이름순</SelectItem>
                      <SelectItem value='usage'>사용빈도순</SelectItem>
                      <SelectItem value='amount'>금액순</SelectItem>
                      <SelectItem value='recent'>최근 사용순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 미리보기 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Eye className='h-5 w-5' />
                미리보기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Badge variant='outline'>현재 설정 적용됨</Badge>
                  <span>•</span>
                  <span>아이콘: {categoryDisplay.showIcons ? '표시' : '숨김'}</span>
                  <span>•</span>
                  <span>
                    색상:{' '}
                    {categoryDisplay.colorStyle === 'vibrant'
                      ? '선명한'
                      : categoryDisplay.colorStyle === 'pastel'
                        ? '파스텔'
                        : '단색'}
                  </span>
                  <span>•</span>
                  <span>
                    정렬:{' '}
                    {categoryDisplay.sortBy === 'name'
                      ? '이름순'
                      : categoryDisplay.sortBy === 'usage'
                        ? '사용빈도순'
                        : categoryDisplay.sortBy === 'amount'
                          ? '금액순'
                          : '최근 사용순'}
                  </span>
                </div>

                <div className='p-4 bg-gray-50 rounded-lg'>
                  <p className='text-sm text-gray-600 text-center'>
                    카테고리 목록에서 변경된 설정을 확인할 수 있습니다
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 설정 탭 */}
        <TabsContent value='notifications'>
          <NotificationSettings />
        </TabsContent>

        {/* 카테고리 관리 탭 */}
        <TabsContent value='management'>
          <CategoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
