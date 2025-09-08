'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, AtSign } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { emailStorage } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const signupSchema = z
  .object({
    username: z.string().min(1, '아이디를 입력해주세요.'),
    domain: z.string().min(1, '도메인을 선택해주세요.'),
    customDomain: z.string().optional(),
    password: z
      .string()
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 대소문자와 숫자를 포함해야 합니다.'),
    confirmPassword: z.string(),
    nickname: z
      .string()
      .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
      .max(20, '닉네임은 최대 20자까지 가능합니다.'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })
  .refine(
    data => {
      if (data.domain === 'custom') {
        return data.customDomain && data.customDomain.length > 0
      }
      return true
    },
    {
      message: '도메인을 입력해주세요.',
      path: ['customDomain'],
    }
  )

type SignupFormData = z.infer<typeof signupSchema>

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signup, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedDomains, setSuggestedDomains] = useState<string[]>([])
  const [recentUsernames, setRecentUsernames] = useState<string[]>([])

  const emailFromUrl = searchParams.get('email') || ''
  const isEmailFromUrl = Boolean(emailFromUrl)

  // URL에서 받은 이메일을 username@domain으로 분리
  const [usernameFromUrl, domainFromUrl] = emailFromUrl ? emailFromUrl.split('@') : ['', '']

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: usernameFromUrl,
      domain: domainFromUrl && domainFromUrl !== 'custom' ? domainFromUrl : '',
      customDomain:
        domainFromUrl &&
        !['naver.com', 'gmail.com', 'daum.net', 'kakao.com', 'outlook.com', 'yahoo.com'].includes(
          domainFromUrl
        )
          ? domainFromUrl
          : '',
      password: '',
      confirmPassword: '',
      nickname: '',
    },
  })

  const selectedDomain = watch('domain')

  // 이메일 주소를 조합하는 함수
  const getFullEmail = (data: SignupFormData) => {
    const domain = data.domain === 'custom' ? data.customDomain : data.domain
    if (!data.username || !domain) {
      return ''
    }
    return `${data.username}@${domain}`
  }

  const password = watch('password')

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // 캐시된 데이터 로드
  useEffect(() => {
    setSuggestedDomains(emailStorage.getSuggestedDomains())
    setRecentUsernames(emailStorage.getRecentUsernames())
  }, [])

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
      const fullEmail = getFullEmail(data)

      // 이메일이 올바르게 구성되었는지 확인
      if (!fullEmail) {
        setError('root', { message: '아이디와 도메인을 모두 입력해주세요.' })
        return
      }

      // 이메일 중복 확인
      const emailCheckRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail }),
      })
      const emailCheck = await emailCheckRes.json()

      if (!emailCheckRes.ok) {
        setError('root', { message: emailCheck.error || '이메일 확인 중 오류가 발생했습니다.' })
        return
      }

      if (emailCheck.exists) {
        setError('root', { message: '이미 가입된 이메일입니다. 로그인 페이지로 이동합니다.' })
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(fullEmail)}`)
        }, 2000)
        return
      }

      const result = await signup(fullEmail, data.password, data.nickname)

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
    <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md space-y-8'>
        {/* Header */}
        <div className='text-center space-y-3 animate-fade-in'>
          {isEmailFromUrl && (
            <div className='flex justify-start mb-4'>
              <button
                onClick={() => router.push('/login')}
                className='flex items-center gap-2 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors duration-200'
              >
                <ArrowLeft className='h-4 w-4' />
                <span className='text-sm'>로그인으로 돌아가기</span>
              </button>
            </div>
          )}
          <div className='w-16 h-16 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg'>
            <span className='text-2xl'>🌟</span>
          </div>
          <h1 className='text-3xl font-semibold text-slate-900 tracking-tight'>
            {isEmailFromUrl ? '계정 만들기' : '회원가입'}
          </h1>
          <p className='text-slate-600 text-base'>
            {isEmailFromUrl
              ? `${emailFromUrl}로 새 계정을 만들어보세요`
              : '새로운 계정을 만들어보세요'}
          </p>
        </div>

        <Card className='bg-white border border-slate-200 shadow-xl animate-slide-up'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-xl text-center text-slate-900 font-medium tracking-tight'>
              {isEmailFromUrl ? '추가 정보 입력' : '계정 만들기'}
            </CardTitle>
            <CardDescription className='text-center text-slate-600'>
              {isEmailFromUrl ? '나머지 정보를 입력해주세요' : '필요한 정보를 입력해주세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              {/* Email Field */}
              <div className='space-y-2'>
                <Label className='text-slate-900 font-medium text-sm'>이메일</Label>
                <div className='flex gap-2'>
                  {/* Username */}
                  <div className='flex-1 relative group'>
                    <AtSign className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-slate-900' />
                    <Input
                      placeholder='아이디'
                      className={`pl-10 h-10 text-slate-900 placeholder:text-slate-400 transition-all duration-200 rounded-lg ${
                        isEmailFromUrl
                          ? 'bg-slate-100 border-slate-300 cursor-not-allowed opacity-70'
                          : 'bg-white border-slate-300 focus:bg-white focus:border-slate-400 focus:ring-slate-300/30'
                      }`}
                      disabled={isEmailFromUrl}
                      {...register('username')}
                    />
                  </div>

                  {/* @ Symbol */}
                  <div className='flex items-center text-slate-500 font-medium'>@</div>

                  {/* Domain Select */}
                  <div className='flex-1'>
                    <Select
                      value={selectedDomain}
                      onValueChange={value => {
                        setValue('domain', value, { shouldValidate: true, shouldDirty: true })
                      }}
                      disabled={isEmailFromUrl}
                    >
                      <SelectTrigger className='h-10'>
                        <SelectValue placeholder='선택하기' />
                      </SelectTrigger>
                      <SelectContent>
                        {/* 최근 사용한 도메인 우선 표시 */}
                        {suggestedDomains.map(domain => (
                          <SelectItem key={domain} value={domain}>
                            {domain}
                            {emailStorage.getRecentDomains().includes(domain) && (
                              <Badge variant='secondary' className='ml-2 text-xs'>
                                최근 사용
                              </Badge>
                            )}
                          </SelectItem>
                        ))}
                        <SelectItem value='custom'>기타 (직접입력)</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Hidden input for form submission */}
                    <input type='hidden' {...register('domain')} />
                  </div>
                </div>

                {/* Custom Domain Input */}
                {selectedDomain === 'custom' && (
                  <div className='relative group'>
                    <Input
                      placeholder='도메인을 입력하세요 (예: company.com)'
                      className='h-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:ring-slate-300/30 transition-all duration-200 rounded-lg'
                      {...register('customDomain')}
                      disabled={isEmailFromUrl}
                    />
                  </div>
                )}

                {/* Error Messages */}
                {errors.username && (
                  <p className='text-sm text-red-600 flex items-center gap-2 animate-fade-in'>
                    <span className='w-1 h-1 bg-red-600 rounded-full'></span>
                    {errors.username.message}
                  </p>
                )}
                {errors.domain && (
                  <p className='text-sm text-red-600 flex items-center gap-2 animate-fade-in'>
                    <span className='w-1 h-1 bg-red-600 rounded-full'></span>
                    {errors.domain.message}
                  </p>
                )}
                {errors.customDomain && (
                  <p className='text-sm text-red-600 flex items-center gap-2 animate-fade-in'>
                    <span className='w-1 h-1 bg-red-600 rounded-full'></span>
                    {errors.customDomain.message}
                  </p>
                )}
              </div>

              {/* Nickname Field */}
              <div className='space-y-2 group'>
                <Label htmlFor='nickname' className='text-slate-900 font-medium text-sm'>
                  닉네임
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-slate-900' />
                  <Input
                    id='nickname'
                    type='text'
                    placeholder='닉네임을 입력하세요'
                    className='pl-10 h-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:ring-slate-300/30 transition-all duration-200 rounded-lg'
                    {...register('nickname')}
                  />
                </div>
                {errors.nickname && (
                  <p className='text-sm text-red-600 flex items-center gap-2 animate-fade-in'>
                    <span className='w-1 h-1 bg-red-600 rounded-full'></span>
                    {errors.nickname.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className='space-y-2 group'>
                <Label htmlFor='password' className='text-slate-900 font-medium text-sm'>
                  비밀번호
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-slate-900' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='비밀번호를 입력하세요'
                    autoComplete='new-password'
                    className='pl-10 pr-10 h-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:ring-slate-300/30 transition-all duration-200 rounded-lg'
                    {...register('password')}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center'
                  >
                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
                {password && (
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs text-white/70'>비밀번호 강도:</span>
                      <span className='text-xs font-semibold text-white/90'>
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className='relative'>
                      <Progress
                        value={passwordStrength}
                        className='h-2 bg-white/10 rounded-full overflow-hidden'
                      />
                      <div
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className='text-sm text-red-600 flex items-center gap-2 animate-fade-in'>
                    <span className='w-1 h-1 bg-red-600 rounded-full'></span>
                    {errors.password.message}
                  </p>
                )}
                <div className='text-xs text-slate-600 space-y-2 bg-slate-50 rounded-lg p-3'>
                  <p className='font-medium text-slate-800'>비밀번호 조건:</p>
                  <ul className='space-y-1 ml-2'>
                    <li
                      className={`flex items-center gap-2 ${password && password.length >= 8 ? 'text-emerald-600' : 'text-slate-500'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${password && password.length >= 8 ? 'bg-emerald-600' : 'bg-slate-300'}`}
                      ></span>
                      최소 8자 이상
                    </li>
                    <li
                      className={`flex items-center gap-2 ${password && /[A-Z]/.test(password) ? 'text-emerald-600' : 'text-slate-500'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${password && /[A-Z]/.test(password) ? 'bg-emerald-600' : 'bg-slate-300'}`}
                      ></span>
                      대문자 포함
                    </li>
                    <li
                      className={`flex items-center gap-2 ${password && /[a-z]/.test(password) ? 'text-emerald-600' : 'text-slate-500'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${password && /[a-z]/.test(password) ? 'bg-emerald-600' : 'bg-slate-300'}`}
                      ></span>
                      소문자 포함
                    </li>
                    <li
                      className={`flex items-center gap-2 ${password && /\d/.test(password) ? 'text-emerald-600' : 'text-slate-500'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${password && /\d/.test(password) ? 'bg-emerald-600' : 'bg-slate-300'}`}
                      ></span>
                      숫자 포함
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className='space-y-2 group'>
                <Label htmlFor='confirmPassword' className='text-slate-900 font-medium text-sm'>
                  비밀번호 확인
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-slate-900' />
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='비밀번호를 다시 입력하세요'
                    autoComplete='new-password'
                    className='pl-10 pr-10 h-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:ring-slate-300/30 transition-all duration-200 rounded-lg'
                    {...register('confirmPassword')}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center'
                  >
                    {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className='text-sm text-red-600 flex items-center gap-2 animate-fade-in'>
                    <span className='w-1 h-1 bg-red-600 rounded-full'></span>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {errors.root && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in'>
                  <p className='text-sm text-red-700 flex items-center gap-2'>
                    <span className='w-2 h-2 bg-red-500 rounded-full'></span>
                    {errors.root.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type='submit'
                className='w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50'
                disabled={isLoading}
              >
                <span className='flex items-center justify-center gap-2'>
                  {isLoading ? (
                    <>
                      <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin'></div>
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
        <Card className='bg-white border border-slate-200 shadow-md animate-slide-up animation-delay-[0.2s]'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <p className='text-sm text-slate-700'>
                이미 계정이 있으신가요?{' '}
                <Link
                  href='/login'
                  className='text-slate-900 hover:underline font-medium cursor-pointer'
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  )
}
