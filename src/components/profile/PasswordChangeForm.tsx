/**
 * 비밀번호 변경 폼 컴포넌트
 * T-023: 내 정보 페이지 개발
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Save, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword } from '@/hooks/use-profile'
import { useToast } from '@/hooks/use-toast'

// 비밀번호 변경 스키마
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: z
      .string()
      .min(8, '새 비밀번호는 최소 8자 이상이어야 합니다')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        '대문자, 소문자, 숫자, 특수문자를 포함해야 합니다'
      ),
    confirmPassword: z.string().min(1, '새 비밀번호 확인을 입력해주세요'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다',
    path: ['newPassword'],
  })

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

interface PasswordChangeFormProps {
  className?: string
}

// 비밀번호 강도 체크 함수
const getPasswordStrength = (
  password: string
): {
  score: number
  label: string
  color: string
} => {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[@$!%*?&]/.test(password)) score++

  if (score <= 2) {
    return { score, label: '약함', color: 'text-red-600' }
  } else if (score <= 4) {
    return { score, label: '보통', color: 'text-yellow-600' }
  } else {
    return { score, label: '강함', color: 'text-green-600' }
  }
}

export function PasswordChangeForm({ className }: PasswordChangeFormProps) {
  const { toast } = useToast()
  const changePassword = useChangePassword()

  // 비밀번호 표시/숨김 상태
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 폼 관리
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword')
  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null

  // 폼 제출 처리
  const onSubmit = async (data: PasswordChangeFormData) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      toast({
        title: '비밀번호 변경 완료',
        description: '비밀번호가 성공적으로 변경되었습니다.',
      })

      // 폼 리셋
      reset()
    } catch (error) {
      toast({
        title: '비밀번호 변경 실패',
        description: error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const isLoading = changePassword.isPending

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Lock className='h-5 w-5' />
          비밀번호 변경
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* 보안 안내 */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
              <div className='text-sm text-blue-800'>
                <p className='font-medium mb-1'>비밀번호 보안 규칙</p>
                <ul className='space-y-1 text-xs'>
                  <li>• 최소 8자 이상 (12자 이상 권장)</li>
                  <li>• 대문자, 소문자, 숫자, 특수문자 포함</li>
                  <li>• 현재 비밀번호와 다른 비밀번호 사용</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 현재 비밀번호 */}
          <div className='space-y-2'>
            <Label htmlFor='currentPassword'>현재 비밀번호</Label>
            <div className='relative'>
              <Input
                id='currentPassword'
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder='현재 비밀번호를 입력하세요'
                {...register('currentPassword')}
                disabled={isLoading}
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <EyeOff className='h-4 w-4 text-gray-400' />
                ) : (
                  <Eye className='h-4 w-4 text-gray-400' />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className='text-sm text-red-600'>{errors.currentPassword.message}</p>
            )}
          </div>

          {/* 새 비밀번호 */}
          <div className='space-y-2'>
            <Label htmlFor='newPassword'>새 비밀번호</Label>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showNewPassword ? 'text' : 'password'}
                placeholder='새 비밀번호를 입력하세요'
                {...register('newPassword')}
                disabled={isLoading}
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeOff className='h-4 w-4 text-gray-400' />
                ) : (
                  <Eye className='h-4 w-4 text-gray-400' />
                )}
              </Button>
            </div>

            {/* 비밀번호 강도 표시 */}
            {passwordStrength && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-gray-500'>비밀번호 강도</span>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength.score <= 2
                        ? 'bg-red-500'
                        : passwordStrength.score <= 4
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      width: `${(passwordStrength.score / 6) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {errors.newPassword && (
              <p className='text-sm text-red-600'>{errors.newPassword.message}</p>
            )}
          </div>

          {/* 새 비밀번호 확인 */}
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>새 비밀번호 확인</Label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='새 비밀번호를 다시 입력하세요'
                {...register('confirmPassword')}
                disabled={isLoading}
                className='pr-10'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-4 w-4 text-gray-400' />
                ) : (
                  <Eye className='h-4 w-4 text-gray-400' />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className='text-sm text-red-600'>{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className='flex justify-end gap-3 pt-6'>
            <Button type='button' variant='outline' onClick={() => reset()} disabled={isLoading}>
              취소
            </Button>
            <Button type='submit' disabled={isLoading || !isValid} className='gap-2'>
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  변경 중...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4' />
                  비밀번호 변경
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
