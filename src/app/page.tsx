'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { groups } = useGroup()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-slate-600 text-base">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 경우: 세련된 모던 디자인
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(71 85 105) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}></div>
        </div>
        
        <div className="max-w-md mx-auto space-y-8 relative z-10">
          {/* Header with Clean Animation */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">💰</span>
              </div>
            </div>
            <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">
              우리집 가계부
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed font-light">
              스마트하고 직관적인<br/>가계부 관리 솔루션
            </p>
          </div>
          
          {/* Clean Modern Card */}
          <Card className="backdrop-blur-sm bg-white/90 border border-slate-200 shadow-xl animate-slide-up">
            <CardHeader>
              <CardTitle className="text-center text-xl text-slate-900 font-medium tracking-tight">
                시작하기
              </CardTitle>
              <CardDescription className="text-center text-slate-600">
                가계부 기능을 사용하려면 계정이 필요합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-col gap-3">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all duration-200 h-12 shadow-sm hover:shadow-md"
                >
                  <Link href="/login">이메일로 계속하기</Link>
                </Button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                이메일을 입력하면 계정이 있는지 확인하여<br/>
                로그인 또는 회원가입으로 자동 안내됩니다
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 로그인 후: 그룹 상태에 따른 분기 처리
  const hasGroups = groups.length > 0
  
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (!hasGroups) {
        // 그룹이 없는 경우: 그룹 관리 페이지로 리디렉션
        router.push('/groups')
      } else {
        // 그룹이 있는 경우: 가계부 페이지로 리디렉션
        router.push('/ledger')
      }
    }
  }, [isAuthenticated, isLoading, hasGroups, router])

  // 로그인된 사용자의 경우 리디렉션 대기 중 로딩 표시
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-slate-600 text-base">페이지 이동 중...</p>
        </div>
      </div>
    )
  }
}