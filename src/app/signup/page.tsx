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
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-lg opacity-75 w-20 h-20 mx-auto animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl">
              <span className="text-3xl">🌟</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
            회원가입
          </h1>
          <p className="text-green-100/80 text-lg">새로운 계정을 만들어보세요</p>
        </div>

        {/* Glassmorphism Signup Form */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl relative overflow-hidden animate-slide-up">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          
          <CardHeader className="space-y-1 relative z-10">
            <CardTitle className="text-3xl text-center bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent font-bold">
              계정 만들기
            </CardTitle>
            <CardDescription className="text-center text-white/70 text-base">
              필요한 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-3 group">
                <Label htmlFor="email" className="text-white/90 font-medium text-sm">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 transition-colors group-focus-within:text-green-300" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="pl-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/10 focus:border-green-300/50 focus:ring-green-300/30 transition-all duration-300 rounded-xl"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-300 flex items-center gap-2 animate-fade-in">
                    <span className="w-1 h-1 bg-red-300 rounded-full"></span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Nickname Field */}
              <div className="space-y-3 group">
                <Label htmlFor="nickname" className="text-white/90 font-medium text-sm">닉네임</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 transition-colors group-focus-within:text-green-300" />
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    className="pl-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/10 focus:border-green-300/50 focus:ring-green-300/30 transition-all duration-300 rounded-xl"
                    {...register('nickname')}
                  />
                </div>
                {errors.nickname && (
                  <p className="text-sm text-red-300 flex items-center gap-2 animate-fade-in">
                    <span className="w-1 h-1 bg-red-300 rounded-full"></span>
                    {errors.nickname.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-3 group">
                <Label htmlFor="password" className="text-white/90 font-medium text-sm">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 transition-colors group-focus-within:text-green-300" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-12 pr-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/10 focus:border-green-300/50 focus:ring-green-300/30 transition-all duration-300 rounded-xl"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 hover:text-green-300 transition-all duration-200 hover:scale-110"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/70">비밀번호 강도:</span>
                      <span className="text-xs font-semibold text-white/90">
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={passwordStrength} 
                        className="h-2 bg-white/10 rounded-full overflow-hidden"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-300 flex items-center gap-2 animate-fade-in">
                    <span className="w-1 h-1 bg-red-300 rounded-full"></span>
                    {errors.password.message}
                  </p>
                )}
                <div className="text-xs text-white/60 space-y-2 bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                  <p className="font-medium text-white/80">비밀번호 조건:</p>
                  <ul className="space-y-1 ml-2">
                    <li className={`flex items-center gap-2 ${password && password.length >= 8 ? 'text-green-300' : 'text-white/60'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${password && password.length >= 8 ? 'bg-green-300' : 'bg-white/40'}`}></span>
                      최소 8자 이상
                    </li>
                    <li className={`flex items-center gap-2 ${password && /[A-Z]/.test(password) ? 'text-green-300' : 'text-white/60'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${password && /[A-Z]/.test(password) ? 'bg-green-300' : 'bg-white/40'}`}></span>
                      대문자 포함
                    </li>
                    <li className={`flex items-center gap-2 ${password && /[a-z]/.test(password) ? 'text-green-300' : 'text-white/60'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${password && /[a-z]/.test(password) ? 'bg-green-300' : 'bg-white/40'}`}></span>
                      소문자 포함
                    </li>
                    <li className={`flex items-center gap-2 ${password && /\d/.test(password) ? 'text-green-300' : 'text-white/60'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${password && /\d/.test(password) ? 'bg-green-300' : 'bg-white/40'}`}></span>
                      숫자 포함
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3 group">
                <Label htmlFor="confirmPassword" className="text-white/90 font-medium text-sm">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 transition-colors group-focus-within:text-green-300" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pl-12 pr-12 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/10 focus:border-green-300/50 focus:ring-green-300/30 transition-all duration-300 rounded-xl"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 hover:text-green-300 transition-all duration-200 hover:scale-110"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-300 flex items-center gap-2 animate-fade-in">
                    <span className="w-1 h-1 bg-red-300 rounded-full"></span>
                    {errors.confirmPassword.message}
                  </p>
                )}
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
                className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg disabled:opacity-50 disabled:transform-none"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      계정 생성 중...
                    </>
                  ) : (
                    '계정 만들기'
                  )}
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <Card className="backdrop-blur-xl bg-white/5 border border-white/20 shadow-lg animate-slide-up animation-delay-[0.2s]">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-white/70">
                이미 계정이 있으신가요?{' '}
                <Link
                  href="/login"
                  className="text-green-300 hover:text-white font-semibold transition-all duration-200 hover:underline"
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
