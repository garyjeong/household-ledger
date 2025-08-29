/**
 * 로딩 스피너 컴포넌트
 * 다양한 크기와 스타일의 로딩 인디케이터 제공
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'bars'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  text?: string
}

export function LoadingSpinner({
  className,
  size = 'md',
  variant = 'default',
  color = 'primary',
  text,
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  const spinnerContent = {
    default: (
      <svg
        className={cn('animate-spin', sizeClasses[size], colorClasses[color])}
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
      >
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
        />
        <path
          className='opacity-75'
          fill='currentColor'
          d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    ),
    dots: (
      <div className={cn('flex space-x-1', colorClasses[color])}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-current animate-pulse',
              size === 'sm'
                ? 'w-1 h-1'
                : size === 'md'
                  ? 'w-2 h-2'
                  : size === 'lg'
                    ? 'w-3 h-3'
                    : 'w-4 h-4'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s',
            }}
          />
        ))}
      </div>
    ),
    pulse: (
      <div
        className={cn(
          'rounded-full bg-current animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{ animationDuration: '2s' }}
      />
    ),
    bars: (
      <div className={cn('flex items-end space-x-1', colorClasses[color])}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'bg-current animate-pulse',
              size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : size === 'lg' ? 'w-2' : 'w-3'
            )}
            style={{
              height: `${20 + i * 5}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1.2s',
            }}
          />
        ))}
      </div>
    ),
  }

  return (
    <div
      className={cn('flex flex-col items-center justify-center space-y-2', className)}
      {...props}
    >
      {spinnerContent[variant]}
      {text && (
        <p className={cn('text-gray-600 dark:text-gray-400', textSizeClasses[size])}>{text}</p>
      )}
    </div>
  )
}

// 페이지 전체 로딩 오버레이
export function PageLoadingOverlay({
  text = '로딩 중...',
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50',
        'flex items-center justify-center',
        className
      )}
      {...props}
    >
      <LoadingSpinner size='lg' text={text} />
    </div>
  )
}

// 버튼 내 로딩 스피너
export function ButtonSpinner({
  size = 'sm',
  className,
  ...props
}: Omit<LoadingSpinnerProps, 'text' | 'variant'>) {
  return (
    <LoadingSpinner
      size={size}
      variant='default'
      className={cn('text-current', className)}
      {...props}
    />
  )
}

// 인라인 로딩 텍스트
export function InlineLoading({
  text = '로딩 중...',
  size = 'sm',
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)} {...props}>
      <LoadingSpinner size={size} variant='dots' />
      <span
        className={cn('text-gray-600 dark:text-gray-400', {
          'text-sm': size === 'sm',
          'text-base': size === 'md',
          'text-lg': size === 'lg',
          'text-xl': size === 'xl',
        })}
      >
        {text}
      </span>
    </div>
  )
}

// 카드 로딩 상태
export function CardLoading({
  title = '데이터를 불러오는 중...',
  className,
  ...props
}: { title?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 border rounded-lg bg-gray-50 dark:bg-gray-800', className)} {...props}>
      <LoadingSpinner size='md' text={title} />
    </div>
  )
}

// 리스트 로딩 상태
export function ListLoading({
  items = 3,
  text = '목록을 불러오는 중...',
  className,
  ...props
}: { items?: number; text?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div className='text-center py-4'>
        <LoadingSpinner size='md' text={text} />
      </div>
      <div className='space-y-2'>
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className='h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse' />
        ))}
      </div>
    </div>
  )
}
