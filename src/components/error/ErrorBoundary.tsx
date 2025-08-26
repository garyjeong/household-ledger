'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { globalErrorHandler, type ErrorReport } from '@/lib/error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  level?: 'app' | 'page' | 'component'
  componentName?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorReport: ErrorReport | null
  showDetails: boolean
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorReport: null,
      showDetails: false,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorReport: null,
      showDetails: false,
      retryCount: 0,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 보고서 생성
    const errorReport = globalErrorHandler.handleError(error, {
      additionalContext: {
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: this.props.level || 'component',
        componentName: this.props.componentName,
        retryCount: this.state.retryCount,
      },
    })

    this.setState({ errorReport })

    // 커스텀 에러 핸들러 호출
    this.props.onError?.(error, errorInfo)

    // 개발 환경에서 상세 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Error Report:', errorReport)
      console.groupEnd()
    }
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return
    }

    this.setState({
      hasError: false,
      error: null,
      errorReport: null,
      showDetails: false,
      retryCount: this.state.retryCount + 1,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있는 경우
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return this.renderErrorUI()
    }

    return this.props.children
  }

  private renderErrorUI() {
    const { error, errorReport, showDetails, retryCount } = this.state
    const { level = 'component', componentName } = this.props
    const canRetry = retryCount < this.maxRetries

    return (
      <Card className="w-full max-w-2xl mx-auto my-8 border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Bug className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-900">
                {level === 'app' ? '애플리케이션 오류' : 
                 level === 'page' ? '페이지 오류' : '컴포넌트 오류'}
              </CardTitle>
              {componentName && (
                <p className="text-sm text-red-700 mt-1">
                  {componentName}에서 오류가 발생했습니다
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 에러 메시지 */}
          <div className="p-3 bg-white rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 mb-2">오류 내용</h4>
            <p className="text-red-700 text-sm">
              {errorReport?.userFriendlyMessage || error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
          </div>

          {/* 에러 상세 정보 */}
          {error && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={this.toggleDetails}
                className="text-red-700 hover:text-red-900 hover:bg-red-100"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    상세 정보 숨기기
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    상세 정보 보기
                  </>
                )}
              </Button>

              {showDetails && (
                <div className="mt-3 p-3 bg-gray-100 rounded-lg text-xs font-mono">
                  <div className="space-y-2">
                    <div>
                      <strong>에러 타입:</strong> {error.name}
                    </div>
                    <div>
                      <strong>에러 메시지:</strong> {error.message}
                    </div>
                    {errorReport && (
                      <>
                        <div>
                          <strong>에러 ID:</strong> {errorReport.id}
                        </div>
                        <div className="flex items-center gap-2">
                          <strong>심각도:</strong>
                          <Badge 
                            variant={
                              errorReport.severity === 'critical' ? 'destructive' :
                              errorReport.severity === 'high' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {errorReport.severity}
                          </Badge>
                        </div>
                        <div>
                          <strong>카테고리:</strong> {errorReport.category}
                        </div>
                      </>
                    )}
                    {retryCount > 0 && (
                      <div>
                        <strong>재시도 횟수:</strong> {retryCount}/{this.maxRetries}
                      </div>
                    )}
                  </div>
                  
                  {error.stack && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                        스택 트레이스
                      </summary>
                      <pre className="mt-2 text-xs whitespace-pre-wrap text-gray-800 max-h-40 overflow-y-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex flex-wrap gap-3">
            {canRetry && errorReport?.retryable && (
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                다시 시도 ({this.maxRetries - retryCount}회 남음)
              </Button>
            )}
            
            <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              페이지 새로고침
            </Button>

            {level !== 'app' && (
              <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                홈으로 가기
              </Button>
            )}
          </div>

          {/* 도움말 메시지 */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p>
              문제가 지속되면 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              {process.env.NODE_ENV === 'development' && (
                <> 개발 모드에서는 브라우저 콘솔에서 자세한 정보를 확인할 수 있습니다.</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
}

// 함수형 컴포넌트 래퍼 (사용하기 쉽도록)
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  level?: 'app' | 'page' | 'component'
  componentName?: string
  fallback?: ReactNode
}

export function ErrorBoundaryWrapper({ 
  children, 
  level = 'component',
  componentName,
  fallback 
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary 
      level={level}
      componentName={componentName}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  )
}

// HOC (Higher Order Component)
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary 
      componentName={Component.displayName || Component.name}
      {...errorBoundaryProps}
    >
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}
