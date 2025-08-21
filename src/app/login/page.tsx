'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  rememberMe: z.boolean().default(false),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, rememberedEmail, clearRememberedEmail } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // 저장된 이메일 자동 입력
  useEffect(() => {
    if (rememberedEmail) {
      setValue('email', rememberedEmail)
      setValue('rememberMe', true)
    }
  }, [rememberedEmail, setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    try {
      const result = await login(data.email, data.password, data.rememberMe)
      
      if (result.success) {
        router.push('/')
      } else {
        setError('root', { message: result.error || '로그인에 실패했습니다.' })
      }
    } catch (error) {
      setError('root', { message: '네트워크 오류가 발생했습니다.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearRememberedEmail = () => {
    clearRememberedEmail()
    setValue('email', '')
    setValue('rememberMe', false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-surface-page to-chip-lavender flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-text-900">로그인</h1>
          <p className="text-text-700">Household Ledger에 오신 것을 환영합니다</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">계정에 로그인</CardTitle>
            <CardDescription className="text-center">
              이메일과 비밀번호를 입력해주세요
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
                {rememberedEmail && (
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      저장된 이메일
                    </Badge>
                    <button
                      type="button"
                      onClick={handleClearRememberedEmail}
                      className="text-xs text-text-700 hover:text-brand-600 transition-colors"
                    >
                      이메일 삭제
                    </button>
                  </div>
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
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <Checkbox
                  label="이메일 저장"
                  {...register('rememberMe')}
                />
                <Link
                  href="/forgot-password"
                  className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
                >
                  비밀번호를 잊으셨나요?
                </Link>
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
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>

              {/* Demo Accounts */}
              <div className="space-y-2">
                <p className="text-xs text-text-700 text-center">테스트 계정:</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setValue('email', 'test@example.com')
                      setValue('password', 'password123')
                    }}
                  >
                    테스트 계정
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setValue('email', 'demo@demo.com')
                      setValue('password', 'password123')
                    }}
                  >
                    데모 계정
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-text-700">
                계정이 없으신가요?{' '}
                <Link
                  href="/signup"
                  className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
