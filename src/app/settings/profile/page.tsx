'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, UserCheck, Save, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiGet, apiPut } from '@/lib/api-client'
import { useAlert } from '@/contexts/alert-context'


// 닉네임 업데이트 스키마
const nicknameUpdateSchema = z.object({
  name: z.string().min(1, '닉네임을 입력해주세요').max(50, '닉네임은 50자 이하로 입력해주세요'),
})

// 비밀번호 변경 스키마 (현재 비밀번호는 저장 시 확인)
const passwordChangeSchema = z
  .object({
    newPassword: z.string().min(8, '새 비밀번호는 최소 8자 이상이어야 합니다.'),
    confirmPassword: z.string().min(1, '새 비밀번호 확인을 입력해주세요.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })

type NicknameFormData = z.infer<typeof nicknameUpdateSchema>
type PasswordFormData = z.infer<typeof passwordChangeSchema>

export default function ProfilePage() {
  const { showSuccess, showError, showWarning } = useAlert()
  const [userInfo, setUserInfo] = useState<{
    name: string
    email: string
    createdAt?: string
  } | null>(null)
  const [isNicknameLoading, setIsNicknameLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 닉네임 변경 폼
  const nicknameForm = useForm<NicknameFormData>({
    resolver: zodResolver(nicknameUpdateSchema),
    defaultValues: {
      name: '',
    },
  })

  // 비밀번호 변경 폼 (현재 비밀번호는 저장 시 확인)
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await apiGet('/api/auth/profile')

        if (response.ok && response.data?.success && response.data?.user) {
          const user = response.data.user
          nicknameForm.setValue('name', user.name || '')
          setUserInfo({
            name: user.name || '',
            email: user.email || '',
            createdAt: user.createdAt,
          })
        } else {
          console.error('프로필 정보 로드 실패:', response.error)
        }
      } catch (error) {
        console.error('프로필 정보 로드 중 오류:', error)
      }
    }

    loadUserProfile()
  }, [nicknameForm])

  // 닉네임 업데이트
  const handleNicknameUpdate = async (data: NicknameFormData) => {
    setIsNicknameLoading(true)
    try {
      // 현재 이메일과 함께 닉네임만 업데이트
      const response = await apiPut('/api/auth/profile', {
        name: data.name,
        email: userInfo?.email || '', // 현재 이메일 유지
      })

      if (response.ok) {
        showSuccess('닉네임이 성공적으로 변경되었습니다.')
        // 업데이트된 정보로 화면 갱신
        if (response.data?.user) {
          const user = response.data.user
          setUserInfo({
            name: user.name || '',
            email: user.email || '',
            createdAt: user.createdAt,
          })
        }
      } else {
        throw new Error(response.error || '닉네임 변경에 실패했습니다')
      }
    } catch (error) {
      console.error('닉네임 변경 중 오류:', error)
      showError(error instanceof Error ? error.message : '닉네임 변경 중 오류가 발생했습니다.')
    } finally {
      setIsNicknameLoading(false)
    }
  }

  // 비밀번호 변경 (현재 비밀번호 확인 후 변경)
  const handlePasswordChange = async (data: PasswordFormData) => {
    // 현재 비밀번호 확인
    const currentPassword = prompt('현재 비밀번호를 입력해주세요:')
    if (!currentPassword) {
      showWarning('비밀번호 변경이 취소되었습니다.')
      return
    }

    setIsPasswordLoading(true)
    try {
      const response = await apiPut('/api/auth/change-password', {
        currentPassword: currentPassword,
        newPassword: data.newPassword,
      })

      if (response.ok) {
        showSuccess('비밀번호가 성공적으로 변경되었습니다.')
        passwordForm.reset()
      } else {
        throw new Error(response.error || '비밀번호 변경에 실패했습니다')
      }
    } catch (error) {
      console.error('비밀번호 변경 중 오류:', error)
      showError(error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 페이지 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">프로필 설정</h2>
        <p className="text-slate-600 text-sm">
          닉네임과 비밀번호를 변경할 수 있습니다.
        </p>
      </div>

      {/* 내 정보 (최상단) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-4 w-4 text-slate-600" />
            내 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label className="text-xs font-medium text-slate-500 mb-1">이메일 주소</Label>
              <p className="text-sm font-medium text-slate-900">{userInfo?.email || '-'}</p>
            </div>
            <div className="flex flex-col">
              <Label className="text-xs font-medium text-slate-500 mb-1">가입일</Label>
              <p className="text-sm font-medium text-slate-900">
                {userInfo?.createdAt 
                  ? new Date(userInfo.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : '-'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 닉네임 변경 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4 text-slate-600" />
            닉네임 변경
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={nicknameForm.handleSubmit(handleNicknameUpdate)}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Label htmlFor="nickname" className="text-xs font-medium text-slate-500 mb-1 block">닉네임</Label>
                <Input
                  id="nickname"
                  placeholder="닉네임을 입력하세요"
                  {...nicknameForm.register('name')}
                  disabled={isNicknameLoading}
                  className="text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={isNicknameLoading}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 mt-5"
              >
                {isNicknameLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1" />
                    저장중
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    변경
                  </>
                )}
              </Button>
            </div>
            {nicknameForm.formState.errors.name && (
              <p className="text-xs text-red-600 mt-2">
                {nicknameForm.formState.errors.name.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-4 w-4 text-slate-600" />
            비밀번호 변경
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 새 비밀번호 */}
              <div>
                <Label htmlFor="newPassword" className="text-xs font-medium text-slate-500 mb-1 block">새 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="새 비밀번호"
                    {...passwordForm.register('newPassword')}
                    disabled={isPasswordLoading}
                    className="text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-3 w-3 text-slate-400" />
                    ) : (
                      <Eye className="h-3 w-3 text-slate-400" />
                    )}
                  </Button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-500 mb-1 block">새 비밀번호 확인</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호 확인"
                    {...passwordForm.register('confirmPassword')}
                    disabled={isPasswordLoading}
                    className="text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3 w-3 text-slate-400" />
                    ) : (
                      <Eye className="h-3 w-3 text-slate-400" />
                    )}
                  </Button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPasswordLoading}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800"
              >
                {isPasswordLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1" />
                    변경중
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3 w-3 mr-1" />
                    비밀번호 저장
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
