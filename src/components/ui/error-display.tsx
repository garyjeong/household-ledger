/**
 * 에러 표시 컴포넌트
 * 다양한 에러 상황에 맞는 사용자 친화적 에러 메시지 제공
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ErrorReport } from '@/lib/error-handler'

interface ErrorDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message?: string
  error?: ErrorReport | Error | string
  variant?: 'default' | 'minimal' | 'detailed'
  showRetry?: boolean
  showDetails?: boolean
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorDisplay({
  className,
  title,
  message,
  error,
  variant = 'default',
  showRetry = true,
  showDetails = false,
  onRetry,
  onDismiss,
  ...props
}: ErrorDisplayProps) {
  const [showFullDetails, setShowFullDetails] = React.useState(false)

  // 에러 정보 추출
  const getErrorInfo = () => {
    if (!error) {
      return {
        title: title || '오류가 발생했습니다',
        message: message || '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        canRetry: true,
        severity: 'medium' as const,
      }
    }

    if (typeof error === 'string') {
      return {
        title: title || '오류가 발생했습니다',
        message: error,
        canRetry: true,
        severity: 'medium' as const,
      }
    }

    if (error instanceof Error) {
      return {
        title: title || '오류가 발생했습니다',
        message: message || error.message || '예상치 못한 오류가 발생했습니다.',
        canRetry: true,
        severity: 'medium' as const,
        stack: error.stack,
      }
    }

    // ErrorReport 타입
    return {
      title: title || getErrorTitle(error.category),
      message: message || error.userFriendlyMessage,
      canRetry: error.retryable,
      severity: error.severity,
      details: error.details,
      stack: error.details.stack,
    }
  }

  const getErrorTitle = (category: string) => {
    const titles = {
      network: '연결 오류',
      auth: '인증 오류',
      validation: '입력 오류',
      api: '서버 오류',
      runtime: '애플리케이션 오류',
    }
    return titles[category as keyof typeof titles] || '오류 발생'
  }

  const getErrorIcon = (severity: string) => {
    const icons = {
      low: '⚠️',
      medium: '❌',
      high: '🚨',
      critical: '💥',
    }
    return icons[severity as keyof typeof icons] || '❌'
  }

  const errorInfo = getErrorInfo()

  if (variant === 'minimal') {
    return (
      <div
        className={cn('flex items-center space-x-2 text-red-600 dark:text-red-400', className)}
        {...props}
      >
        <span>{getErrorIcon(errorInfo.severity)}</span>
        <span className='text-sm'>{errorInfo.message}</span>
        {onRetry && errorInfo.canRetry && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onRetry}
            className='text-red-600 hover:text-red-700 hover:bg-red-50'
          >
            재시도
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border rounded-lg p-6 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
        className
      )}
      {...props}
    >
      <div className='flex items-start space-x-3'>
        <div className='text-2xl'>{getErrorIcon(errorInfo.severity)}</div>
        <div className='flex-1 space-y-3'>
          <div>
            <h3 className='text-lg font-semibold text-red-800 dark:text-red-200'>
              {errorInfo.title}
            </h3>
            <p className='text-red-700 dark:text-red-300 mt-1'>{errorInfo.message}</p>
          </div>

          {variant === 'detailed' && errorInfo.details && (
            <div className='space-y-2'>
              <details className='text-sm'>
                <summary className='cursor-pointer text-red-600 hover:text-red-700'>
                  기술적 세부사항
                </summary>
                <div className='mt-2 p-3 bg-red-100 dark:bg-red-900/20 rounded border'>
                  <div className='space-y-1 text-xs font-mono'>
                    <div>
                      <strong>오류 ID:</strong> {errorInfo.details.code}
                    </div>
                    <div>
                      <strong>시간:</strong>{' '}
                      {new Date(errorInfo.details.timestamp).toLocaleString()}
                    </div>
                    {errorInfo.details.statusCode && (
                      <div>
                        <strong>상태 코드:</strong> {errorInfo.details.statusCode}
                      </div>
                    )}
                    {errorInfo.details.url && (
                      <div>
                        <strong>URL:</strong> {errorInfo.details.url}
                      </div>
                    )}
                  </div>
                </div>
              </details>

              {showDetails && errorInfo.stack && (
                <details className='text-sm'>
                  <summary
                    className='cursor-pointer text-red-600 hover:text-red-700'
                    onClick={() => setShowFullDetails(!showFullDetails)}
                  >
                    Stack Trace
                  </summary>
                  {showFullDetails && (
                    <pre className='mt-2 p-3 bg-red-100 dark:bg-red-900/20 rounded border text-xs overflow-x-auto'>
                      {errorInfo.stack}
                    </pre>
                  )}
                </details>
              )}
            </div>
          )}

          <div className='flex items-center space-x-3'>
            {onRetry && errorInfo.canRetry && (
              <Button
                variant='outline'
                size='sm'
                onClick={onRetry}
                className='border-red-300 text-red-700 hover:bg-red-100'
              >
                다시 시도
              </Button>
            )}
            {onDismiss && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onDismiss}
                className='text-red-600 hover:text-red-700 hover:bg-red-100'
              >
                닫기
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 빈 상태 컴포넌트
export function EmptyState({
  icon = '📭',
  title = '데이터가 없습니다',
  description = '아직 표시할 내용이 없습니다.',
  action,
  className,
  ...props
}: {
  icon?: string
  title?: string
  description?: string
  action?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-center py-12', className)} {...props}>
      <div className='text-6xl mb-4'>{icon}</div>
      <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>{title}</h3>
      <p className='text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto'>{description}</p>
      {action}
    </div>
  )
}

// 네트워크 에러 전용 컴포넌트
export function NetworkError({
  onRetry,
  className,
  ...props
}: { onRetry?: () => void } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ErrorDisplay
      title='연결 오류'
      message='인터넷 연결을 확인하고 다시 시도해주세요.'
      variant='default'
      showRetry={!!onRetry}
      onRetry={onRetry}
      className={className}
      {...props}
    />
  )
}

// 인증 에러 전용 컴포넌트
export function AuthError({
  onLogin,
  className,
  ...props
}: { onLogin?: () => void } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ErrorDisplay
      title='인증이 필요합니다'
      message='로그인이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.'
      variant='default'
      showRetry={false}
      className={className}
      {...props}
    >
      {onLogin && (
        <Button onClick={onLogin} className='mt-4'>
          로그인하기
        </Button>
      )}
    </ErrorDisplay>
  )
}

// 서버 에러 전용 컴포넌트
export function ServerError({
  onRetry,
  reportId,
  className,
  ...props
}: {
  onRetry?: () => void
  reportId?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ErrorDisplay
      title='서버 오류'
      message='서버에서 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      variant='default'
      showRetry={!!onRetry}
      onRetry={onRetry}
      className={className}
      {...props}
    >
      {reportId && (
        <p className='text-xs text-gray-500 mt-2'>
          문제가 지속되면 고객지원팀에 다음 ID를 알려주세요: {reportId}
        </p>
      )}
    </ErrorDisplay>
  )
}

// 폼 검증 에러 컴포넌트
export function ValidationError({
  errors,
  className,
  ...props
}: {
  errors: string | string[]
} & React.HTMLAttributes<HTMLDivElement>) {
  const errorList = Array.isArray(errors) ? errors : [errors]

  return (
    <div
      className={cn(
        'border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-md p-3',
        className
      )}
      {...props}
    >
      <div className='flex items-start space-x-2'>
        <span className='text-red-500'>⚠️</span>
        <div className='flex-1'>
          {errorList.length === 1 ? (
            <p className='text-red-700 dark:text-red-300 text-sm'>{errorList[0]}</p>
          ) : (
            <ul className='text-red-700 dark:text-red-300 text-sm space-y-1'>
              {errorList.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
