/**
 * 로딩 스켈레톤 컴포넌트
 * 다양한 콘텐츠 유형에 맞는 스켈레톤 UI 제공
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  lines = 1,
  ...props
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded'

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              i === lines - 1 ? 'w-3/4' : 'w-full', // 마지막 줄은 3/4 너비
              'h-4'
            )}
            style={{ width: i === lines - 1 ? '75%' : width, height }}
          />
        ))}
      </div>
    )
  }

  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
      {...props}
    />
  )
}

// 미리 정의된 스켈레톤 레이아웃들
export function CardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4 border rounded-lg space-y-3', className)} {...props}>
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='h-3 w-1/2' />
      <div className='space-y-2'>
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-5/6' />
      </div>
    </div>
  )
}

export function ListItemSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center space-x-3 p-3', className)} {...props}>
      <Skeleton variant='circular' className='h-10 w-10' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-3 w-1/2' />
      </div>
      <Skeleton className='h-6 w-16' />
    </div>
  )
}

export function TableRowSkeleton({
  columns = 4,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div
      className={cn('grid gap-4 p-4 border-b', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      {...props}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className='h-4' />
      ))}
    </div>
  )
}

export function TransactionSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between p-4 border rounded-lg', className)}
      {...props}
    >
      <div className='flex items-center space-x-3'>
        <Skeleton variant='circular' className='h-8 w-8' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-3 w-16' />
        </div>
      </div>
      <div className='text-right space-y-2'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-3 w-12' />
      </div>
    </div>
  )
}

export function StatisticsSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* 요약 카드들 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='p-4 border rounded-lg space-y-3'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-8 w-24' />
            <Skeleton className='h-3 w-20' />
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className='space-y-4'>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='h-64 w-full' />
      </div>

      {/* 카테고리 목록 */}
      <div className='space-y-3'>
        <Skeleton className='h-6 w-32' />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Skeleton variant='circular' className='h-4 w-4' />
              <Skeleton className='h-4 w-20' />
            </div>
            <Skeleton className='h-4 w-16' />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* 헤더 */}
      <div className='space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-32' />
      </div>

      {/* 요약 통계 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* 차트 및 최근 거래 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-48 w-full' />
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-6 w-24' />
          {Array.from({ length: 5 }).map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
