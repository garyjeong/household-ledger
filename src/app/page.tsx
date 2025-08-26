'use client'

import React, { useState } from 'react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { MonthlyDashboard } from '@/components/couple-ledger/MonthlyDashboard'
import { QuickAddModal } from '@/components/couple-ledger/QuickAddModal'
import { defaultCategories } from '@/components/couple-ledger/CategoryPicker'
import { Transaction, MonthlyStats } from '@/types/couple-ledger'

// 더미 월요약 데이터
const createMonthlyStats = (period: string): MonthlyStats => ({
  period,
  totalExpense: 2450000,
  totalIncome: 4500000,
  myExpense: 980000,
  partnerExpense: 720000,
  sharedExpense: 750000,
  categoryBreakdown: [
    { categoryId: '1', categoryName: '식비', amount: 650000, percentage: 26.5, color: '#EF4444', icon: 'food' },
    { categoryId: '2', categoryName: '교통비', amount: 420000, percentage: 17.1, color: '#3B82F6', icon: 'transport' },
    { categoryId: '3', categoryName: '생활용품', amount: 380000, percentage: 15.5, color: '#10B981', icon: 'home' },
    { categoryId: '4', categoryName: '커피/음료', amount: 290000, percentage: 11.8, color: '#F59E0B', icon: 'coffee' },
    { categoryId: '5', categoryName: '쇼핑', amount: 260000, percentage: 10.6, color: '#EC4899', icon: 'shopping' },
  ],
  dailyTrend: [],
  budgetComparison: [
    { categoryId: '1', budgeted: 700000, spent: 650000, remaining: 50000, percentage: 92.9 },
    { categoryId: '2', budgeted: 400000, spent: 420000, remaining: -20000, percentage: 105.0 },
    { categoryId: '3', budgeted: 350000, spent: 380000, remaining: -30000, percentage: 108.6 },
  ],
})

/**
 * 신혼부부 가계부 메인 페이지
 * 
 * 기능:
 * - 월요약 대시보드
 * - 반응형 네비게이션 (모바일 하단탭 + 데스크탑 사이드바)
 * - 빠른입력 모달
 * - 실시간 통계 업데이트
 */
export default function HomePage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [monthlyStats, setMonthlyStats] = useState(() => createMonthlyStats(selectedMonth))

  // 월 변경 핸들러
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    setMonthlyStats(createMonthlyStats(month))
  }

  // 빠른입력 모달 열기
  const handleQuickAddClick = () => {
    setIsQuickAddOpen(true)
  }

  // 빠른입력 모달 닫기
  const handleQuickAddClose = () => {
    setIsQuickAddOpen(false)
  }

  // 거래 저장 핸들러
  const handleSaveTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // TODO: 실제 API 호출
      console.log('새 거래 저장:', transaction)
      
      // 임시: 통계 업데이트 (실제로는 API에서 다시 가져옴)
      setMonthlyStats(prev => ({
        ...prev,
        totalExpense: prev.totalExpense + transaction.amount,
        myExpense: transaction.person === 'me' ? prev.myExpense + transaction.amount : prev.myExpense,
        partnerExpense: transaction.person === 'partner' ? prev.partnerExpense + transaction.amount : prev.partnerExpense,
        sharedExpense: transaction.person === 'shared' ? prev.sharedExpense + transaction.amount : prev.sharedExpense,
      }))

      return Promise.resolve()
    } catch (error) {
      console.error('거래 저장 실패:', error)
      throw error
    }
  }

  return (
    <>
      {/* 반응형 레이아웃 */}
      <ResponsiveLayout onQuickAddClick={handleQuickAddClick}>
        {/* 메인 컨텐츠 */}
        <div className="w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          <MonthlyDashboard
            stats={monthlyStats}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
          />
        </div>
      </ResponsiveLayout>

      {/* 빠른입력 모달 */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={handleQuickAddClose}
        onSave={handleSaveTransaction}
        categories={defaultCategories}
        templates={[]} // TODO: 템플릿 데이터
      />
    </>
  )
}