'use client'

import { useEffect } from 'react'
import { useToast } from './ToastProvider'

export function ErrorSystemInitializer() {
  const { error } = useToast()

  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      error('예상치 못한 오류가 발생했습니다.', '시스템 오류')
      event.preventDefault()
    }

    // Global error handler for JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      error('페이지에서 오류가 발생했습니다.', '실행 오류')
    }

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [error])

  // This component doesn't render anything
  return null
}

export default ErrorSystemInitializer
