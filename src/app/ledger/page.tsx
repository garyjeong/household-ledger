'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  Download,
  Upload,
  ArrowLeft,
  Lightbulb,
  Zap,
  List,
  Plus,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react'

export default function LedgerPage() {
  const router = useRouter()
  const [showPresets, setShowPresets] = useState(true)
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { user, isAuthenticated, logout } = useAuth()
  const { currentGroup } = useGroup()

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-slate-600 text-base">로그인이 필요합니다...</p>
          <Link href="/login">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
              로그인하기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/groups" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">그룹으로</span>
              </Link>
              
              <div className="h-6 w-px bg-slate-300"></div>
              
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {currentGroup?.name || '가계부'}
                </h1>
                <p className="text-xs text-slate-500">
                  {currentGroup ? `${currentGroup.memberCount}명 참여` : '그룹 선택 필요'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant={showPresets ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPresets(!showPresets)}
              className="cursor-pointer"
            >
              <Zap className="h-4 w-4 mr-2" />
              {showPresets ? '프리셋 숨기기' : '프리셋 보기'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="cursor-pointer"
            >
              <Upload className="h-4 w-4 mr-2" />
              일괄입력
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">이번 달 수입</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₩0</div>
              <p className="text-xs text-slate-500">전월 대비 +0%</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">이번 달 지출</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₩0</div>
              <p className="text-xs text-slate-500">전월 대비 +0%</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">잔액</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₩0</div>
              <p className="text-xs text-slate-500">사용 가능 금액</p>
            </CardContent>
          </Card>
        </div>

        {/* Main content layout */}
        <div className={`grid gap-6 ${showPresets ? 'lg:grid-cols-5' : 'lg:grid-cols-1'}`}>
          {/* Left sidebar - Presets and Tools */}
          {showPresets && (
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    빠른 입력
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      점심식사
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      교통비
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      커피
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    팁
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="text-sm text-slate-600">
                      💡 영수증 사진을 업로드하면 자동으로 금액과 카테고리를 인식합니다
                    </div>
                    <div className="text-sm text-slate-600">
                      🔄 반복 거래를 설정하면 정기적인 지출을 자동으로 기록합니다
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content - Transaction list */}
          <div className={showPresets ? 'lg:col-span-4' : 'lg:col-span-1'}>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <List className="h-5 w-5 text-slate-600" />
                    최근 거래 내역
                  </span>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    0건
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <List className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    아직 거래 내역이 없습니다
                  </h3>
                  <p className="text-slate-500 mb-6">
                    첫 번째 거래를 추가하여 가계부를 시작해보세요
                  </p>
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    거래 추가
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile floating actions */}
        {isMobile && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-lg bg-white border-slate-300 hover:bg-slate-50 w-12 h-12 cursor-pointer"
              onClick={() => setShowBulkInput(!showBulkInput)}
            >
              <Upload className="h-5 w-5 text-slate-700" />
            </Button>
            
            <Button
              variant={showPresets ? "default" : "outline"}
              size="sm"
              className={`rounded-full shadow-lg w-12 h-12 cursor-pointer ${
                showPresets 
                  ? "bg-slate-900 hover:bg-slate-800 text-white" 
                  : "bg-white border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => setShowPresets(!showPresets)}
            >
              <Zap className={`h-5 w-5 ${showPresets ? "text-white" : "text-slate-700"}`} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}