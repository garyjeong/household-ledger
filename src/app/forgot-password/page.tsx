'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Mail, Eye, EyeOff, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 이메일 스키마
const emailSchema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요.'),
  domain: z.string().min(1, '도메인을 선택해주세요.'),
  customDomain: z.string().optional(),
})

// 도메인 목록
const EMAIL_DOMAINS = [
  'naver.com',
  'gmail.com',
  'daum.net',
  'kakao.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  '기타',
]

interface TempPasswordModalProps {
  isOpen: boolean
  tempPassword: string
  onClose: () => void
}

function TempPasswordModal({ isOpen, tempPassword, onClose }: TempPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-md bg-white'>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl font-bold text-slate-900'>임시 비밀번호 발급</CardTitle>
          <CardDescription className='text-slate-600'>
            아래 임시 비밀번호로 로그인 후 새 비밀번호를 설정해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label className='text-sm font-medium text-slate-700'>임시 비밀번호</Label>
            <div className='relative'>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={tempPassword}
                readOnly
                className='pr-20 font-mono bg-slate-50 border-slate-300'
              />
              <div className='absolute right-2 top-1/2 -translate-y-1/2 flex gap-1'>
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='p-1 text-slate-500 hover:text-slate-700 cursor-pointer'
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
                <button
                  type='button'
                  onClick={handleCopy}
                  className='p-1 text-slate-500 hover:text-slate-700 cursor-pointer'
                >
                  {copied ? (
                    <Check className='h-4 w-4 text-green-600' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
            <p className='text-sm text-amber-800'>
              <strong>중요:</strong> 임시 비밀번호는 보안상 즉시 새 비밀번호로 변경하시기 바랍니다.
            </p>
          </div>

          <div className='flex gap-3'>
            <Button variant='outline' className='flex-1 cursor-pointer' onClick={onClose}>
              닫기
            </Button>
            <Link href='/login' className='flex-1'>
              <Button className='w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer'>
                로그인하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      username: '',
      domain: '',
      customDomain: '',
    },
  })

  const selectedDomain = watch('domain')

  // 전체 이메일 주소 생성
  const getFullEmail = (data: any) => {
    const { username, domain, customDomain } = data
    if (!username || !domain) return ''

    if (domain === '기타') {
      return customDomain ? `${username}@${customDomain}` : ''
    }
    return `${username}@${domain}`
  }

  const onSubmit = async (data: any) => {
    const fullEmail = getFullEmail(data)

    if (!fullEmail) {
      setError('이메일 주소를 완전히 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: fullEmail }),
      })

      const result = await response.json()

      if (result.success) {
        setTempPassword(result.tempPassword)
        setShowModal(true)
      } else {
        setError(result.message || '비밀번호 찾기에 실패했습니다.')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <Card className='bg-white border-slate-200 shadow-sm'>
          <CardHeader className='space-y-1 pb-6'>
            <div className='flex items-center gap-3 mb-4'>
              <Link
                href='/login'
                className='flex items-center gap-2 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors duration-200'
              >
                <ArrowLeft className='h-4 w-4' />
                <span className='text-sm'>로그인으로 돌아가기</span>
              </Link>
            </div>

            <CardTitle className='text-2xl font-bold text-slate-900 text-center'>
              비밀번호 찾기
            </CardTitle>
            <CardDescription className='text-center text-slate-600'>
              등록된 이메일 주소로 임시 비밀번호를 발급해드립니다.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              {error && (
                <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='email' className='text-sm font-medium text-slate-700'>
                  이메일 주소
                </Label>
                <div className='flex items-center gap-2'>
                  <div className='flex-1'>
                    <Input
                      {...register('username')}
                      type='text'
                      placeholder='아이디'
                      className='border-slate-300 focus:border-slate-500 focus:ring-slate-300/30'
                    />
                  </div>
                  <span className='text-slate-500 font-medium'>@</span>
                  <div className='flex-1'>
                    <Select onValueChange={value => setValue('domain', value)} defaultValue=''>
                      <SelectTrigger className='border-slate-300 focus:border-slate-500 focus:ring-slate-300/30 cursor-pointer'>
                        <SelectValue placeholder='선택하기' />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_DOMAINS.map(domain => (
                          <SelectItem key={domain} value={domain} className='cursor-pointer'>
                            {domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 커스텀 도메인 입력 */}
                {selectedDomain === '기타' && (
                  <div className='mt-2'>
                    <Input
                      {...register('customDomain')}
                      type='text'
                      placeholder='직접 입력 (예: company.com)'
                      className='border-slate-300 focus:border-slate-500 focus:ring-slate-300/30'
                    />
                  </div>
                )}

                {/* 도메인 숨김 필드 */}
                <input type='hidden' {...register('domain')} />

                {(errors.username || errors.domain) && (
                  <p className='text-red-500 text-sm'>
                    {errors.username?.message || errors.domain?.message}
                  </p>
                )}
              </div>

              <Button
                type='submit'
                className='w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer'
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className='flex items-center gap-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    처리 중...
                  </div>
                ) : (
                  <div className='flex items-center gap-2'>
                    <Mail className='h-4 w-4' />
                    임시 비밀번호 발급
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 임시 비밀번호 모달 */}
      <TempPasswordModal
        isOpen={showModal}
        tempPassword={tempPassword}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
