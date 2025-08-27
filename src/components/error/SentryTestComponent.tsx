'use client'

import React from 'react'
import { AlertTriangle, Bug, Zap, Info } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { errorLogger, globalErrorHandler } from '@/lib/error-handler'

// 개발 환경에서만 렌더링되는 Sentry 테스트 컴포넌트
export function SentryTestComponent() {
  // 프로덕션 환경에서는 렌더링하지 않음
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const handleManualError = () => {
    try {
      throw new Error('Manual test error from SentryTestComponent')
    } catch (error) {
      globalErrorHandler.handleError(error as Error, {
        url: window.location.href,
        additionalContext: {
          testType: 'manual',
          component: 'SentryTestComponent',
        },
      })
    }
  }

  const handleAsyncError = async () => {
    try {
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Async test error from SentryTestComponent'))
        }, 100)
      })
    } catch (error) {
      globalErrorHandler.handleError(error as Error, {
        url: window.location.href,
        additionalContext: {
          testType: 'async',
          component: 'SentryTestComponent',
        },
      })
    }
  }

  const handleNetworkError = async () => {
    try {
      // 존재하지 않는 API 엔드포인트 호출
      await fetch('/api/non-existent-endpoint')
    } catch (error) {
      globalErrorHandler.handleError(error as Error, {
        statusCode: 404,
        url: window.location.href,
        additionalContext: {
          testType: 'network',
          component: 'SentryTestComponent',
          endpoint: '/api/non-existent-endpoint',
        },
      })
    }
  }

  const handleSentryDirectTest = () => {
    // Sentry에 직접 메시지 전송
    Sentry.captureMessage('Direct Sentry test message', 'info')

    // 커스텀 태그와 컨텍스트로 에러 전송
    Sentry.withScope(scope => {
      scope.setTag('testType', 'direct')
      scope.setTag('component', 'SentryTestComponent')
      scope.setUser({
        id: 'test-user',
        email: 'test@example.com',
      })
      scope.setContext('testData', {
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent,
        url: window.location.href,
      })

      Sentry.captureException(new Error('Direct Sentry test exception'))
    })
  }

  const handlePerformanceTrace = () => {
    // 성능 추적 테스트 (Sentry v8+ API)
    Sentry.startSpan(
      {
        name: 'Test Performance Trace',
        op: 'test',
      },
      () => {
        // 시뮬레이션된 작업
        return new Promise(resolve => {
          setTimeout(() => {
            Sentry.startSpan(
              {
                name: 'Simulated heavy operation',
                op: 'test-operation',
              },
              () => {
                return new Promise(innerResolve => {
                  setTimeout(() => {
                    innerResolve(undefined)
                    resolve(undefined)
                  }, 500)
                })
              }
            )
          }, 200)
        })
      }
    )
  }

  const checkSentryStatus = () => {
    const client = Sentry.getClient()
    if (client) {
      console.log('✅ Sentry client is initialized')
      console.log('DSN:', client.getDsn()?.toString())
      console.log('Options:', client.getOptions())
    } else {
      console.log('❌ Sentry client is not initialized')
    }

    // 로컬 에러 로그 확인
    const logs = errorLogger.getLogs()
    console.log('📊 Local error logs:', logs.length, 'errors')

    // 로컬 스토리지 에러 로그 확인
    const storedLogs = errorLogger.getStoredLogs()
    console.log('💾 Stored error logs:', storedLogs.length, 'errors')
  }

  return (
    <div className='fixed bottom-4 right-4 bg-white border-2 border-orange-200 rounded-lg shadow-lg p-4 max-w-sm z-50'>
      <div className='flex items-center gap-2 mb-3'>
        <Bug className='h-5 w-5 text-orange-600' />
        <h3 className='font-semibold text-gray-900'>Sentry 테스트</h3>
        <span className='text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded'>DEV ONLY</span>
      </div>

      <div className='space-y-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={handleManualError}
          className='w-full justify-start'
        >
          <AlertTriangle className='h-4 w-4 mr-2' />
          동기 에러 테스트
        </Button>

        <Button
          size='sm'
          variant='outline'
          onClick={handleAsyncError}
          className='w-full justify-start'
        >
          <Zap className='h-4 w-4 mr-2' />
          비동기 에러 테스트
        </Button>

        <Button
          size='sm'
          variant='outline'
          onClick={handleNetworkError}
          className='w-full justify-start'
        >
          <AlertTriangle className='h-4 w-4 mr-2' />
          네트워크 에러 테스트
        </Button>

        <Button
          size='sm'
          variant='outline'
          onClick={handleSentryDirectTest}
          className='w-full justify-start'
        >
          <Bug className='h-4 w-4 mr-2' />
          Sentry 직접 테스트
        </Button>

        <Button
          size='sm'
          variant='outline'
          onClick={handlePerformanceTrace}
          className='w-full justify-start'
        >
          <Zap className='h-4 w-4 mr-2' />
          성능 추적 테스트
        </Button>

        <Button
          size='sm'
          variant='outline'
          onClick={checkSentryStatus}
          className='w-full justify-start'
        >
          <Info className='h-4 w-4 mr-2' />
          Sentry 상태 확인
        </Button>
      </div>

      <p className='text-xs text-gray-500 mt-3'>
        개발 환경에서만 표시되는 테스트 도구입니다. 각 버튼을 클릭하여 Sentry 연동을 테스트하세요.
      </p>
    </div>
  )
}
