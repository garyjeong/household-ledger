'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { GroupSwitcher } from '@/components/layouts/group-switcher'
import { Plus, History, Users } from 'lucide-react'

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { groups, currentGroup } = useGroup()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-white/80 text-lg">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 경우: 트렌디한 로그인 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden flex items-center justify-center p-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce animation-delay-[0s]"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce animation-delay-[2s]"></div>
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce animation-delay-[4s]"></div>
        </div>
        
        <div className="max-w-md mx-auto space-y-8 relative z-10">
          {/* Header with Animation */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-75 w-24 h-24 mx-auto animate-pulse"></div>
              <div className="relative w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                <span className="text-4xl">💰</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              가계부
            </h1>
            <p className="text-purple-100/80 text-xl">
              스마트한 가계 관리를 시작하세요
            </p>
          </div>
          
          {/* Glassmorphism Card */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-center text-2xl bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent font-bold">
                로그인이 필요합니다
              </CardTitle>
              <CardDescription className="text-center text-white/70 text-base">
                가계부 기능을 사용하려면 로그인해주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6 relative z-10">
              <div className="flex gap-4 justify-center">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Link href="/login">로그인</Link>
                </Button>
                <Button 
                  variant="outline" 
                  asChild 
                  size="lg"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Link href="/signup">회원가입</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-white">가계부 대시보드</h1>
        <p className="text-white/70 mt-2">안녕하세요, {user?.nickname}님!</p>
      </div>
    </div>
  )
}