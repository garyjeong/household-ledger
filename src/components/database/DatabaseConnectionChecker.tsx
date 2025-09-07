'use client'

import { useEffect, useState } from 'react'
import { DatabaseErrorUI } from './DatabaseErrorUI'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface DatabaseStatus {
  status: 'checking' | 'connected' | 'error'
  error?: string
  retryCount: number
}

interface Props {
  children: React.ReactNode
}

/**
 * 애플리케이션 시작 시 데이터베이스 연결 상태를 확인하는 컴포넌트
 * 연결 실패 시 에러 UI를 표시하고 애플리케이션 로딩을 차단
 */
export function DatabaseConnectionChecker({ children }: Props) {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    status: 'checking',
    retryCount: 0,
  })

  const checkDatabaseConnection = async (retryCount = 0) => {
    try {
      setDbStatus(prev => ({ ...prev, status: 'checking', retryCount }))

      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(10000), // 10초 타임아웃
      })

      if (response.ok) {
        setDbStatus({
          status: 'connected',
          retryCount,
        })
      } else {
        throw new Error(`Database health check failed: HTTP ${response.status}`)
      }
    } catch (error: any) {
      console.error('Database connection check failed:', error)
      
      setDbStatus({
        status: 'error',
        error: error.message || 'Unknown database connection error',
        retryCount,
      })
    }
  }

  // 컴포넌트 마운트 시 데이터베이스 연결 확인
  useEffect(() => {
    checkDatabaseConnection(0)
  }, [])

  // 재시도 핸들러
  const handleRetry = () => {
    const newRetryCount = dbStatus.retryCount + 1
    checkDatabaseConnection(newRetryCount)
  }

  // 로딩 중일 때
  if (dbStatus.status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              시스템 초기화 중...
            </h2>
            <p className="text-gray-600">
              데이터베이스 연결을 확인하고 있습니다.
            </p>
            {dbStatus.retryCount > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                재시도 중... ({dbStatus.retryCount}회째)
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 에러 발생 시
  if (dbStatus.status === 'error') {
    return (
      <DatabaseErrorUI 
        error={dbStatus.error}
        retryCount={dbStatus.retryCount}
        onRetry={handleRetry}
      />
    )
  }

  // 연결 성공 시 정상적으로 애플리케이션 렌더링
  return <>{children}</>
}
