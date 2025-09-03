/**
 * ⏳ 스켈레톤 로더 컴포넌트
 * 콘텐츠 로딩 중 사용자 경험 향상을 위한 스켈레톤 UI
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/**
 * 기본 스켈레톤 컴포넌트
 */
interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-700",
        className
      )}
      style={{ width, height }}
      {...props}
    />
  )
}

/**
 * 거래 내역 리스트 스켈레톤
 */
export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
          {/* 카테고리 아이콘 */}
          <Skeleton className="w-10 h-10 rounded-full" />
          
          <div className="flex-1 space-y-2">
            {/* 거래명 */}
            <Skeleton className="h-4 w-32" />
            {/* 메모/상점 */}
            <Skeleton className="h-3 w-24" />
          </div>
          
          <div className="text-right space-y-2">
            {/* 금액 */}
            <Skeleton className="h-4 w-20" />
            {/* 날짜 */}
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 카테고리 그리드 스켈레톤
 */
export function CategoryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-4 bg-white rounded-lg border space-y-3">
          {/* 카테고리 아이콘 */}
          <Skeleton className="w-8 h-8 rounded-full mx-auto" />
          {/* 카테고리명 */}
          <Skeleton className="h-4 w-20 mx-auto" />
          {/* 사용 횟수 */}
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
  )
}

/**
 * 대시보드 카드 스켈레톤
 */
export function DashboardCardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-lg border space-y-4">
      {/* 제목 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="w-5 h-5 rounded" />
      </div>
      
      {/* 메인 숫자 */}
      <Skeleton className="h-8 w-32" />
      
      {/* 부가 정보 */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

/**
 * 월별 대시보드 스켈레톤
 */
export function MonthlyDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="w-24 h-8 rounded" />
          <Skeleton className="w-24 h-8 rounded" />
        </div>
      </div>

      {/* 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 트렌드 차트 */}
        <div className="p-6 bg-white rounded-lg border space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
        
        {/* 카테고리 차트 */}
        <div className="p-6 bg-white rounded-lg border space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-64 w-full rounded-full mx-auto" />
        </div>
      </div>

      {/* 최근 거래 */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <TransactionListSkeleton count={3} />
      </div>
    </div>
  )
}

/**
 * 통계 페이지 스켈레톤
 */
export function StatisticsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="w-20 h-8" />
          <Skeleton className="w-24 h-8" />
        </div>
      </div>

      {/* 필터 */}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-6 bg-white rounded-lg border space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-80 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 폼 스켈레톤
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      <div className="flex justify-end space-x-3">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

/**
 * 테이블 스켈레톤
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number
  columns?: number 
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </div>
      </div>
      
      {/* 테이블 행들 */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 프로필 스켈레톤
 */
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 프로필 헤더 */}
      <div className="text-center space-y-4">
        <Skeleton className="w-24 h-24 rounded-full mx-auto" />
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>

      {/* 정보 카드들 */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="p-6 bg-white rounded-lg border space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 로딩 스피너 (중앙 정렬)
 */
export function LoadingSpinner({ 
  size = 'md',
  text = '로딩 중...'
}: { 
  size?: 'sm' | 'md' | 'lg'
  text?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600", sizeClasses[size])} />
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  )
}

/**
 * 페이지 로딩 오버레이
 */
export function PageLoadingOverlay({ message = '페이지를 불러오는 중...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

/**
 * 인라인 로딩 (버튼 내부 등)
 */
export function InlineLoading({ 
  size = 'sm',
  className = ''
}: {
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  }

  return (
    <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-current", sizeClasses[size], className)} />
  )
}

/**
 * 컨텐츠 로딩 상태 래퍼
 */
interface LoadingWrapperProps {
  loading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LoadingWrapper({ loading, skeleton, children, fallback }: LoadingWrapperProps) {
  if (loading) {
    return <>{skeleton}</>
  }

  return <>{children}</>
}

/**
 * 🎯 스켈레톤 로더 사용 가이드
 * 
 * 1. 페이지 로딩:
 * ```tsx
 * {loading ? <MonthlyDashboardSkeleton /> : <DashboardContent />}
 * ```
 * 
 * 2. 리스트 로딩:
 * ```tsx
 * <LoadingWrapper
 *   loading={isLoading}
 *   skeleton={<TransactionListSkeleton count={10} />}
 * >
 *   <TransactionList data={transactions} />
 * </LoadingWrapper>
 * ```
 * 
 * 3. 버튼 로딩:
 * ```tsx
 * <Button disabled={loading}>
 *   {loading && <InlineLoading className="mr-2" />}
 *   저장하기
 * </Button>
 * ```
 * 
 * 4. 페이지 전환:
 * ```tsx
 * {pageLoading && <PageLoadingOverlay />}
 * ```
 */
