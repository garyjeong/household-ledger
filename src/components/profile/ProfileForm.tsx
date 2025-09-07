/**
 * 프로필 정보 수정 폼 컴포넌트
 * T-023: 내 정보 페이지 개발
 */

'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfile, useUpdateProfile, UserProfile } from '@/hooks/use-profile'
import { useToast } from '@/hooks/use-toast'

// 프로필 업데이트 스키마
const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .max(50, '이름은 50자 이하로 입력해주세요')
    .regex(/^[a-zA-Z가-힣\s]+$/, '이름은 한글, 영문, 공백만 사용할 수 있습니다'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  className?: string
}

export function ProfileForm({ className }: ProfileFormProps) {
  const { toast } = useToast()

  // API hooks
  const { data: profile, isLoading: profileLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  // 폼 관리
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  // 프로필 데이터가 로드되면 폼 초기화
  React.useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        email: profile.email,
      })
    }
  }, [profile, reset])

  // 폼 제출 처리
  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data)
      toast({
        title: '프로필 업데이트 완료',
        description: '프로필 정보가 성공적으로 업데이트되었습니다.',
      })
    } catch (error) {
      toast({
        title: '업데이트 실패',
        description: error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 폼 리셋
  const handleReset = () => {
    if (profile) {
      reset({
        name: profile.name,
        email: profile.email,
      })
    }
  }

  const isLoading = profileLoading || updateProfile.isPending

  if (profileLoading) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span className='ml-2'>프로필 정보를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>프로필 정보를 불러올 수 없습니다.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          프로필 수정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* 기본 정보 */}
          <div className='bg-slate-50 rounded-lg p-4'>
            <h3 className='text-sm font-medium text-slate-700 mb-3'>기본 정보</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
              <div>
                <span className='text-slate-500'>이름</span>
                <div className='font-medium text-slate-900'>{profile.name}</div>
              </div>
              <div>
                <span className='text-slate-500'>이메일</span>
                <div className='font-medium text-slate-900'>{profile.email}</div>
              </div>
              <div>
                <span className='text-slate-500'>가입일</span>
                <div className='font-medium text-slate-900'>
                  {new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          </div>

          {/* 프로필 정보 입력 필드 */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* 이름 */}
            <div className='space-y-2'>
              <Label htmlFor='name'>이름</Label>
              <Input
                id='name'
                placeholder='이름을 입력하세요'
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && <p className='text-sm text-red-600'>{errors.name.message}</p>}
            </div>

            {/* 이메일 */}
            <div className='space-y-2'>
              <Label htmlFor='email'>이메일</Label>
              <Input
                id='email'
                type='email'
                placeholder='이메일을 입력하세요'
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className='flex justify-end gap-3 pt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={handleReset}
              disabled={isLoading || !isDirty}
            >
              취소
            </Button>
            <Button type='submit' disabled={isLoading || !isDirty} className='gap-2'>
              {updateProfile.isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4' />
                  저장
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
