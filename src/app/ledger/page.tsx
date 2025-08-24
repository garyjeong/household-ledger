'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuickAddBar } from '@/components/ledger/QuickAddBar'
import { InboxList } from '@/components/ledger/InboxList'
import { PresetPanel } from '@/components/ledger/PresetPanel'
import { BulkInput } from '@/components/ledger/BulkInput'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { useContextBridge } from '@/lib/adapters/context-bridge'
import { useLedgerStore } from '@/stores/ledger-store'
import { formatAmount } from '@/lib/schemas/transaction'
import { GroupSwitcher } from '@/components/layouts/group-switcher'
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
} from 'lucide-react'

export default function LedgerPage() {
  const [quickAddData, setQuickAddData] = useState(null)
  const [showPresets, setShowPresets] = useState(true)
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { user, isAuthenticated } = useAuth()
  const { currentGroup } = useGroup()
  const { getStats, transactions } = useLedgerStore()
  
  // Sync Context with Zustand
  useContextBridge()

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-brand-600" />
            </div>
            <h2 className="text-xl font-semibold text-text-900 mb-2">로그인이 필요합니다</h2>
            <p className="text-text-600 mb-4">
              가계부 기능을 사용하려면 로그인해주세요
            </p>
            <div className="flex gap-2">
              <Link href="/login" className="flex-1">
                <Button className="w-full">로그인</Button>
              </Link>
              <Link href="/signup" className="flex-1">
                <Button variant="outline" className="w-full">회원가입</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getStats()

  // Handle preset application (pass data to QuickAddBar)
  const handleApplyPreset = (presetData: any) => {
    setQuickAddData(presetData)
  }

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Fixed QuickAdd Bar at top */}
      <QuickAddBar 
        position="top" 
        autoFocus={!isMobile}
        className="border-b"
      />

      {/* Header with navigation */}
      <div className="bg-white border-b border-stroke-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-text-600 hover:text-text-900">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">홈으로</span>
              </Link>
              
              <div className="h-6 w-px bg-stroke-200" />
              
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-brand-600" />
                <div>
                  <h1 className="text-xl font-semibold text-text-900">수동 입력 가계부</h1>
                  <p className="text-sm text-text-600">빠른 거래 기록 및 관리</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Group Switcher */}
              {currentGroup && (
                <div className="hidden sm:block">
                  <GroupSwitcher />
                </div>
              )}

              {/* Settings link */}
              <Link href="/settings/accounts">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome message and stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-text-900">
                안녕하세요, {user?.nickname}님! 👋
              </h2>
              <p className="text-text-600">
                {currentGroup ? `${currentGroup.name} 그룹` : '개인'} 가계부에서 거래를 관리하세요
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
              >
                {showPresets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPresets ? '프리셋 숨기기' : '프리셋 보기'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkInput(!showBulkInput)}
              >
                <Upload className="h-4 w-4 mr-2" />
                일괄입력
              </Button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-600">이번 달 지출</p>
                    <p className="text-lg font-bold text-text-900">
                      {formatAmount(stats.thisMonth.expense)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-600">이번 달 수입</p>
                    <p className="text-lg font-bold text-text-900">
                      {formatAmount(stats.thisMonth.income)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-600">순자산 변화</p>
                    <p className={`text-lg font-bold ${
                      stats.thisMonth.income - stats.thisMonth.expense >= 0 
                        ? 'text-blue-600' 
                        : 'text-red-600'
                    }`}>
                      {stats.thisMonth.income - stats.thisMonth.expense >= 0 ? '+' : ''}
                      {formatAmount(stats.thisMonth.income - stats.thisMonth.expense)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <List className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-600">전체 거래</p>
                    <p className="text-lg font-bold text-text-900">
                      {stats.transactionCount}건
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main content grid */}
        <div className={`grid gap-6 ${showPresets ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
          {/* Left sidebar - Presets and Tools */}
          {showPresets && (
            <div className="lg:col-span-1 space-y-6">
              <PresetPanel onApplyPreset={handleApplyPreset} />
              
              {showBulkInput && (
                <BulkInput />
              )}

              {/* Quick tips */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-brand-600" />
                    사용 팁
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 text-text-600">
                  <div className="flex items-start gap-2">
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd>
                    <span>저장 후 닫기</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Shift+Enter</kbd>
                    <span>저장 후 계속</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">1-9</kbd>
                    <span>프리셋 바로 적용</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">E</kbd>
                    <span>선택된 거래 편집</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Del</kbd>
                    <span>선택된 거래 삭제</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content - Transaction list */}
          <div className={showPresets ? 'lg:col-span-3' : 'lg:col-span-1'}>
            <InboxList showGrouping={true} pageSize={20} />
          </div>
        </div>

        {/* Mobile floating actions */}
        {isMobile && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-lg bg-white"
              onClick={() => setShowBulkInput(!showBulkInput)}
            >
              <Upload className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline" 
              size="sm"
              className="rounded-full shadow-lg bg-white"
              onClick={() => setShowPresets(!showPresets)}
            >
              <Zap className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Toast container for undo functionality */}
      <div id="toast-container" className="fixed bottom-4 right-4 z-50 space-y-2">
        {/* Toast messages will be rendered here by the toast system */}
      </div>
    </div>
  )
}
