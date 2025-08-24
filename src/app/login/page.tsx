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
  rememberMe: z.boolean().optional().default(false),
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
  } = useForm({
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce animation-delay-[0s]"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce animation-delay-[2s]"></div>
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce animation-delay-[4s]"></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header with Animation */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-75 w-20 h-20 mx-auto animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
              <span className="text-3xl">💰</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
            로그인
          </h1>
          <p className="text-purple-100/80 text-lg">Household Ledger에 오신 것을 환영합니다</p>
        </div>

        {/* Glassmorphism Login Form */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl relative overflow-hidden animate-slide-up">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          
          <CardHeader className="space-y-1 relative z-10">
            <CardTitle className="text-3xl text-center bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent font-bold">
              계정에 로그인
            </CardTitle>
            <CardDescription className="text-center text-white/70 text-base">
              이메일과 비밀번호를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3 group">
                <Label htmlFor="email" className="text-white/90 font-medium text-sm">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 transition-colors group-focus-within:text-purple-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="pl-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/10 focus:border-purple-300/50 focus:ring-purple-300/30 transition-all duration-300 rounded-xl"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-300 flex items-center gap-2 animate-fade-in">
                    <span className="w-1 h-1 bg-red-300 rounded-full"></span>
                    {errors.email.message}
                  </p>
                )}
                {rememberedEmail && (
                  <div className="flex items-center justify-between animate-fade-in">
                    <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-200 border-purple-300/30">
                      저장된 이메일
                    </Badge>
                    <button
                      type="button"
                      onClick={handleClearRememberedEmail}
                      className="text-xs text-white/60 hover:text-purple-300 transition-colors duration-200"
                    >
                      이메일 삭제
                    </button>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-3 group">
                <Label htmlFor="password" className="text-white/90 font-medium text-sm">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 transition-colors group-focus-within:text-purple-300" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-12 pr-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/10 focus:border-purple-300/50 focus:ring-purple-300/30 transition-all duration-300 rounded-xl"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 hover:text-purple-300 transition-all duration-200 hover:scale-110"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300 flex items-center gap-2 animate-fade-in">
                    <span className="w-1 h-1 bg-red-300 rounded-full"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-2">
                <Checkbox
                  label="이메일 저장"
                  className="text-white/80 text-sm"
                  {...register('rememberMe')}
                />
                <Link
                  href="/forgot-password"
                  className="text-sm text-purple-300 hover:text-white transition-colors duration-200 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {/* Error Message */}
              {errors.root && (
                <div className="p-4 bg-red-500/10 border border-red-400/30 rounded-xl backdrop-blur-sm animate-fade-in">
                  <p className="text-sm text-red-200 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    {errors.root.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg disabled:opacity-50 disabled:transform-none"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      로그인 중...
                    </>
                  ) : (
                    '로그인'
                  )}
                </span>
              </Button>

              {/* Demo Accounts */}
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white/5 px-3 py-1 text-white/60 rounded-full backdrop-blur-sm">테스트 계정</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 transition-all duration-200 rounded-lg"
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
                    className="flex-1 text-xs bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 transition-all duration-200 rounded-lg"
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
        <Card className="backdrop-blur-xl bg-white/5 border border-white/20 shadow-lg animate-slide-up animation-delay-[0.2s]">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-white/70">
                계정이 없으신가요?{' '}
                <Link
                  href="/signup"
                  className="text-purple-300 hover:text-white font-semibold transition-all duration-200 hover:underline"
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
