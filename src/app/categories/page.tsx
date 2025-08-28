/**
 * 카테고리 관리 페이지
 * T-022: 카테고리 관리 페이지 구현
 *
 * 기능:
 * - Supabase CRUD API를 React Query로 연동
 * - Headless UI 모달 폼과 Tailwind CSS 리스트 구현
 * - 중복 이름 방지 및 오류 알림 처리
 */

'use client'

import React from 'react'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
import { CategoryManagement } from '@/components/categories/CategoryManagement'

export default function CategoriesPage() {
  return (
    <ResponsiveLayout>
      <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
        <CategoryManagement />
      </div>
    </ResponsiveLayout>
  )
}
