/**
 * 🛡️ 전역 에러 바운더리
 * React 컴포넌트 크래시 방지 및 우아한 에러 처리
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { safeConsole } from '@/lib/security-utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  level?: 'page' | 'component' | 'global'
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

/**
 * 에러 경계 (Error Boundary) 클래스 컴포넌트
 * Function Component에서는 에러 바운더리를 구현할 수 없어 Class Component 필요
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    }
  }

  /**
   * 에러 발생 시 호출되는 라이프사이클 메서드
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36),
    }
  }

  /**
   * 에러 정보 수집 및 로깅
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId()
    
    this.setState({
      errorInfo,
      errorId,
    })

    // 🔍 상세한 에러 정보 수집
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    }

    // 보안 로깅으로 에러 정보 기록
    safeConsole.error('React Error Boundary 활성화', error, errorReport)

    // 사용자 정의 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 🚨 에러 추적 서비스에 전송 (향후 Sentry 등 연동)
    this.reportErrorToService(errorReport)
  }

  /**
   * 고유한 에러 ID 생성
   */
  private generateErrorId(): string {
    return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`
  }

  /**
   * 에러 리포팅 서비스에 전송 (향후 확장)
   */
  private reportErrorToService(errorReport: any) {
    // TODO: Sentry, LogRocket, 또는 커스텀 에러 수집 서비스 연동
    if (process.env.NODE_ENV === 'production') {
      // 프로덕션에서만 외부 서비스로 전송
      // window.gtag?.('event', 'exception', { description: errorReport.message })
    }
  }

  /**
   * 컴포넌트 재시도 (상태 초기화)
   */
  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      
      safeConsole.log('에러 바운더리 재시도', {
        errorId: this.state.errorId,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries,
      })

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: this.generateErrorId(),
      })
    } else {
      safeConsole.warn('최대 재시도 횟수 초과', {
        errorId: this.state.errorId,
        retryCount: this.retryCount,
      })
    }
  }

  /**
   * 홈으로 이동
   */
  private handleGoHome = () => {
    window.location.href = '/'
  }

  /**
   * 페이지 새로고침
   */
  private handleRefresh = () => {
    window.location.reload()
  }

  /**
   * 에러 리포트 복사
   */
  private handleCopyError = async () => {
    const errorText = `
에러 ID: ${this.state.errorId}
메시지: ${this.state.error?.message}
시간: ${new Date().toLocaleString()}
페이지: ${window.location.href}

스택 트레이스:
${this.state.error?.stack}

컴포넌트 스택:
${this.state.errorInfo?.componentStack}
`.trim()

    try {
      await navigator.clipboard.writeText(errorText)
      // Toast 알림 표시 (향후 구현)
    } catch (err) {
      safeConsole.warn('에러 정보 복사 실패', err)
    }
  }

  render() {
    if (this.state.hasError) {
      // 🎨 사용자 정의 fallback이 있으면 우선 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 📱 레벨별 에러 UI 렌더링
      return this.renderErrorUI()
    }

    return this.props.children
  }

  /**
   * 레벨별 에러 UI 렌더링
   */
  private renderErrorUI() {
    const { level = 'component' } = this.props
    const { error, errorId } = this.state

    // 🌐 전역 레벨 에러 (전체 앱 크래시)
    if (level === 'global') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">
                앱에 오류가 발생했습니다
              </CardTitle>
              <CardDescription className="text-lg">
                예상치 못한 오류로 인해 애플리케이션이 중단되었습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">오류 ID: <code className="bg-gray-200 px-2 py-1 rounded">{errorId}</code></p>
                <p className="text-sm text-gray-800">{error?.message}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleRefresh} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  페이지 새로고침
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  홈으로 이동
                </Button>
                <Button onClick={this.handleCopyError} variant="outline" size="sm">
                  <Bug className="w-4 h-4 mr-2" />
                  오류 복사
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                문제가 지속되면 <a href="mailto:support@household-ledger.com" className="text-blue-600 hover:underline">고객지원</a>에 문의해주세요.
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // 📄 페이지 레벨 에러
    if (level === 'page') {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <CardTitle className="text-xl text-amber-800">
                페이지 로딩 중 오류 발생
              </CardTitle>
              <CardDescription>
                이 페이지를 불러오는 중에 문제가 발생했습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 p-3 rounded border border-amber-200">
                <p className="text-sm text-amber-800">{error?.message}</p>
                <p className="text-xs text-amber-600 mt-1">오류 ID: {errorId}</p>
              </div>
              
              <div className="flex gap-2">
                {this.retryCount < this.maxRetries && (
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    다시 시도 ({this.maxRetries - this.retryCount}회 남음)
                  </Button>
                )}
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  홈으로
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // 🧩 컴포넌트 레벨 에러 (기본)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-800">
              컴포넌트 렌더링 오류
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="mt-3 flex space-x-2">
              {this.retryCount < this.maxRetries && (
                <Button 
                  onClick={this.handleRetry} 
                  variant="outline" 
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  다시 시도
                </Button>
              )}
              <Button 
                onClick={this.handleCopyError} 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:bg-red-100"
              >
                오류 복사
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

/**
 * 🎯 함수형 컴포넌트용 에러 바운더리 래퍼
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  level?: 'page' | 'component' | 'global'
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export function ErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary {...props}>
      {children}
    </GlobalErrorBoundary>
  )
}

/**
 * 🚀 특화된 에러 바운더리들
 */

// 페이지 전체를 감싸는 에러 바운더리
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page">
      {children}
    </ErrorBoundary>
  )
}

// 폼 컴포넌트용 에러 바운더리
export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      level="component"
      fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-yellow-800 text-sm">
            폼 로딩 중 오류가 발생했습니다. 페이지를 새로고침해주세요.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// 차트/통계 컴포넌트용 에러 바운더리
export function ChartErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      level="component"
      fallback={
        <div className="bg-blue-50 border border-blue-200 rounded p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-blue-800 font-medium">차트를 불러올 수 없습니다</p>
          <p className="text-blue-600 text-sm">데이터를 다시 불러오거나 페이지를 새로고침해주세요.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * 🎛️ 에러 바운더리 사용 가이드
 * 
 * 1. 전역 레벨 (app/layout.tsx):
 * ```tsx
 * <ErrorBoundary level="global">
 *   <App />
 * </ErrorBoundary>
 * ```
 * 
 * 2. 페이지 레벨:
 * ```tsx
 * <PageErrorBoundary>
 *   <DashboardPage />
 * </PageErrorBoundary>
 * ```
 * 
 * 3. 컴포넌트 레벨:
 * ```tsx
 * <FormErrorBoundary>
 *   <TransactionForm />
 * </FormErrorBoundary>
 * ```
 * 
 * 4. 커스텀 fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <Component />
 * </ErrorBoundary>
 * ```
 */
