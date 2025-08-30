'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  level: 'app' | 'page' | 'component'
  componentName?: string
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary - ${this.props.level}] Error caught:`, error, errorInfo)

    // 에러 정보 저장
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center'>
              <AlertTriangle className='h-8 w-8 text-red-600' />
            </div>

            <h1 className='text-xl font-bold text-gray-900 mb-2'>오류가 발생했습니다</h1>

            <p className='text-gray-600 mb-4'>
              {this.props.componentName && `${this.props.componentName}에서 `}
              예상치 못한 오류가 발생했습니다.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='text-left mb-4 p-3 bg-gray-100 rounded text-sm'>
                <summary className='cursor-pointer font-medium'>오류 세부사항</summary>
                <pre className='mt-2 whitespace-pre-wrap text-xs'>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className='flex gap-2 justify-center'>
              <Button variant='outline' onClick={this.handleReset} className='cursor-pointer'>
                다시 시도
              </Button>

              <Button
                onClick={this.handleReload}
                className='bg-slate-900 hover:bg-slate-800 cursor-pointer'
              >
                페이지 새로고침
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
