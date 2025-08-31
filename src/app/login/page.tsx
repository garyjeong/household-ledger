'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AtSign } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 이메일 단계 스키마
const emailStageSchema = z
  .object({
    username: z.string().min(1, '아이디를 입력해주세요.'),
    domain: z.string().min(1, '도메인을 선택해주세요.'),
    customDomain: z.string().optional(),
    password: z.string().optional(),
    rememberMe: z.boolean(),
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

// 비밀번호 단계 스키마
const passwordStageSchema = z
  .object({
    username: z.string().min(1, '아이디를 입력해주세요.'),
    domain: z.string().min(1, '도메인을 선택해주세요.'),
    customDomain: z.string().optional(),
    password: z.string().min(1, '비밀번호를 입력해주세요.'),
    rememberMe: z.boolean(),
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

// Union type for both stages with explicit rememberMe type
type LoginFormData = {
  username: string
  domain: string
  customDomain?: string
  password?: string
  rememberMe: boolean
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, rememberedEmail, clearRememberedEmail } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const emailFromUrl = searchParams.get('email') || ''
  const isEmailFromUrl = Boolean(emailFromUrl)
  const [stage, setStage] = useState<'email' | 'password'>(isEmailFromUrl ? 'password' : 'email')

  // URL에서 받은 이메일을 username@domain으로 분리
  const [usernameFromUrl, domainFromUrl] = emailFromUrl ? emailFromUrl.split('@') : ['', '']

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(stage === 'email' ? emailStageSchema : passwordStageSchema),
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
      rememberMe: false,
    },
  })

  const selectedDomain = watch('domain')
  const rememberMeValue = watch('rememberMe')

  // 이메일 주소를 조합하는 함수
  const getFullEmail = (data: LoginFormData) => {
    const domain = data.domain === 'custom' ? data.customDomain : data.domain
    if (!data.username || !domain) {
      return ''
    }
    return `${data.username}@${domain}`
  }

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // 저장된 이메일 자동 입력
  useEffect(() => {
    if (rememberedEmail) {
      const [savedUsername, savedDomain] = rememberedEmail.split('@')
      if (savedUsername && savedDomain) {
        setValue('username', savedUsername)
        if (
          ['naver.com', 'gmail.com', 'daum.net', 'kakao.com', 'outlook.com', 'yahoo.com'].includes(
            savedDomain
          )
        ) {
          setValue('domain', savedDomain)
        } else {
          setValue('domain', 'custom')
          setValue('customDomain', savedDomain)
        }
        setValue('rememberMe', true)
      }
    }
  }, [rememberedEmail, setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const fullEmail = getFullEmail(data)

      if (stage === 'email') {
        // 이메일이 올바르게 구성되었는지 확인
        if (!fullEmail) {
          setError('root', { message: '아이디와 도메인을 모두 입력해주세요.' })
          return
        }

        // 이메일 존재 여부 확인
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: fullEmail }),
        })
        const payload = await res.json()
        if (!res.ok) {
          setError('root', { message: payload.error || '이메일 확인 중 오류가 발생했습니다.' })
          return
        }
        if (payload.exists) {
          setStage('password')
          return
        }
        // 신규 사용자는 회원가입으로 이동 (이메일 전달)
        router.push(`/signup?email=${encodeURIComponent(fullEmail)}`)
        return
      }

      const result = await login(fullEmail, data.password!, data.rememberMe)

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
    setValue('username', '')
    setValue('domain', '')
    setValue('customDomain', '')
    setValue('rememberMe', false)
  }

  return (
    <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md space-y-6'>
        {/* Header */}
        <div className='text-center space-y-2 animate-fade-in'>
          {stage === 'password' && (
            <div className='flex justify-start mb-3'>
              <button
                onClick={() => setStage('email')}
                className='flex items-center gap-2 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors duration-200'
              >
                <ArrowLeft className='h-4 w-4' />
                <span className='text-sm'>다른 이메일로 로그인</span>
              </button>
            </div>
          )}
          <div className='w-14 h-14 mx-auto bg-slate-900 rounded-xl flex items-center justify-center shadow-md'>
            <span className='text-xl'>💰</span>
          </div>
          <h1 className='text-2xl font-semibold text-slate-900 tracking-tight'>로그인</h1>
          <p className='text-slate-600 text-sm'>
            {stage === 'password' && isEmailFromUrl
              ? `${emailFromUrl}로 로그인`
              : '계정으로 계속하기'}
          </p>
        </div>

        <Card className='bg-white border border-slate-200 shadow-lg animate-slide-up'>
          <CardHeader className='space-y-1 pb-4'>
            <CardTitle className='text-lg text-center text-slate-900 font-medium tracking-tight'>
              {stage === 'email' ? '이메일로 계속하기' : '비밀번호 입력'}
            </CardTitle>
            <CardDescription className='text-center text-slate-600 text-sm'>
              {stage === 'email' ? '내 계정이 있는지 확인합니다' : '계정 비밀번호를 입력해주세요'}
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
                      className='pl-10 h-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:ring-slate-300/30 transition-all duration-200 rounded-lg'
                      {...register('username')}
                      disabled={stage === 'password'}
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
                    >
                      <SelectTrigger className='h-10' disabled={stage === 'password'}>
                        <SelectValue placeholder='선택하기' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='naver.com'>naver.com</SelectItem>
                        <SelectItem value='gmail.com'>gmail.com</SelectItem>
                        <SelectItem value='daum.net'>daum.net</SelectItem>
                        <SelectItem value='kakao.com'>kakao.com</SelectItem>
                        <SelectItem value='outlook.com'>outlook.com</SelectItem>
                        <SelectItem value='yahoo.com'>yahoo.com</SelectItem>
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

              {/* Password Field */}
              {stage === 'password' && (
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
                  {errors.password && (
                    <p className='text-sm text-red-600 flex items-center gap-2 animate-fade-in'>
                      <span className='w-1 h-1 bg-red-600 rounded-full'></span>
                      {errors.password.message}
                    </p>
                  )}
                </div>
              )}

              {/* Remember Me */}
              {stage === 'password' && (
                <div className='flex items-center justify-between'>
                  <Checkbox
                    label='이메일 저장'
                    checked={rememberMeValue}
                    onChange={e => {
                      setValue('rememberMe', e.target.checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }}
                  />
                  <Link
                    href='/forgot-password'
                    className='text-sm text-slate-600 hover:text-slate-900 cursor-pointer transition-colors duration-200'
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
              )}

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
                      {stage === 'email' ? '확인 중...' : '로그인 중...'}
                    </>
                  ) : stage === 'email' ? (
                    '계속하기'
                  ) : (
                    '로그인'
                  )}
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
