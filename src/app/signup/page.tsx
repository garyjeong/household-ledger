'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

const signupSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 대소문자와 숫자를 포함해야 합니다.'),
  confirmPassword: z.string(),
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(20, '닉네임은 최대 20자까지 가능합니다.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { signup, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      nickname: '',
    },
  })

  const password = watch('password')

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // 비밀번호 강도 계산
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/\d/.test(password)) strength += 25
    return strength
  }

  const getPasswordStrengthText = (strength: number): string => {
    if (strength === 0) return ''
    if (strength <= 25) return '매우 약함'
    if (strength <= 50) return '약함'
    if (strength <= 75) return '보통'
    return '강함'
  }

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 25) return 'bg-red-500'
    if (strength <= 50) return 'bg-orange-500'
    if (strength <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    
    try {
      const result = await signup(data.email, data.password, data.nickname)
      
      if (result.success) {
        router.push('/')
      } else {
        setError('root', { message: result.error || '회원가입에 실패했습니다.' })
      }
    } catch (error) {
      setError('root', { message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = calculatePasswordStrength(password || '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-surface-page to-chip-lavender flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-text-900">회원가입</h1>
          <p className="text-text-700">새로운 계정을 만들어보세요</p>
        </div>

        {/* Signup Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">계정 만들기</CardTitle>
            <CardDescription className="text-center">
              필요한 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-text-700" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Nickname Field */}
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-text-700" />
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    className="pl-10"
                    {...register('nickname')}
                  />
                </div>
                {errors.nickname && (
                  <p className="text-sm text-red-600">{errors.nickname.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-text-700" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-text-700 hover:text-brand-600 transition-colors"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-700">비밀번호 강도:</span>
                      <span className="text-xs font-medium">
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <Progress 
                      value={passwordStrength} 
                      className={`h-2 ${getPasswordStrengthColor(passwordStrength)}`}
                    />
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
                <div className="text-xs text-text-700 space-y-1">
                  <p>비밀번호는 다음 조건을 만족해야 합니다:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>최소 8자 이상</li>
                    <li>대문자 포함</li>
                    <li>소문자 포함</li>
                    <li>숫자 포함</li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-text-700" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pl-10 pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-text-700 hover:text-brand-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Error Message */}
              {errors.root && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '계정 생성 중...' : '계정 만들기'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-text-700">
                이미 계정이 있으신가요?{' '}
                <Link
                  href="/login"
                  className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
