/**
 * 전역 에러 핸들러 시스템
 * API 에러, 네트워크 에러, 애플리케이션 에러를 체계적으로 처리
 */

export interface ErrorDetails {
  code: string
  message: string
  statusCode?: number
  timestamp: string
  userId?: string
  url?: string
  userAgent?: string
  stack?: string
  context?: Record<string, unknown>
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorReport {
  id: string
  severity: ErrorSeverity
  category: 'api' | 'network' | 'auth' | 'validation' | 'runtime' | 'unknown'
  details: ErrorDetails
  userFriendlyMessage: string
  shouldNotifyUser: boolean
  retryable: boolean
}

// 에러 카테고리별 설정
const ERROR_CONFIGS = {
  network: {
    severity: 'medium' as ErrorSeverity,
    shouldNotifyUser: true,
    retryable: true,
    userMessage: '네트워크 연결을 확인해주세요.',
  },
  auth: {
    severity: 'high' as ErrorSeverity,
    shouldNotifyUser: true,
    retryable: false,
    userMessage: '인증이 만료되었습니다. 다시 로그인해주세요.',
  },
  validation: {
    severity: 'low' as ErrorSeverity,
    shouldNotifyUser: true,
    retryable: false,
    userMessage: '입력한 정보를 다시 확인해주세요.',
  },
  api: {
    severity: 'medium' as ErrorSeverity,
    shouldNotifyUser: true,
    retryable: true,
    userMessage: '요청 처리 중 오류가 발생했습니다.',
  },
  runtime: {
    severity: 'high' as ErrorSeverity,
    shouldNotifyUser: true,
    retryable: false,
    userMessage: '일시적인 오류가 발생했습니다. 페이지를 새로고침해주세요.',
  },
  unknown: {
    severity: 'medium' as ErrorSeverity,
    shouldNotifyUser: true,
    retryable: false,
    userMessage: '알 수 없는 오류가 발생했습니다.',
  },
} as const

// 에러 ID 생성
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 에러 카테고리 분류
function categorizeError(error: Error, statusCode?: number): ErrorReport['category'] {
  const message = error.message.toLowerCase()

  // 네트워크 에러
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network'
  }

  // 인증 에러
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    message.includes('auth') ||
    message.includes('token')
  ) {
    return 'auth'
  }

  // 유효성 검증 에러
  if (statusCode === 400 || message.includes('validation') || message.includes('invalid')) {
    return 'validation'
  }

  // API 에러
  if (statusCode && statusCode >= 500) {
    return 'api'
  }

  // 런타임 에러
  if (error instanceof TypeError || error instanceof ReferenceError) {
    return 'runtime'
  }

  return 'unknown'
}

// 에러 보고서 생성
export function createErrorReport(
  error: Error,
  context?: {
    statusCode?: number
    url?: string
    userId?: string
    additionalContext?: Record<string, unknown>
  }
): ErrorReport {
  const category = categorizeError(error, context?.statusCode)
  const config = ERROR_CONFIGS[category] || ERROR_CONFIGS.api
  const id = generateErrorId()

  const details: ErrorDetails = {
    code: error.name || 'UnknownError',
    message: error.message,
    statusCode: context?.statusCode,
    timestamp: new Date().toISOString(),
    userId: context?.userId,
    url: context?.url || (typeof window !== 'undefined' ? window.location.href : undefined),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    stack: error.stack,
    context: context?.additionalContext,
  }

  return {
    id,
    severity: config.severity,
    category,
    details,
    userFriendlyMessage: config.userMessage,
    shouldNotifyUser: config.shouldNotifyUser,
    retryable: config.retryable,
  }
}

// 에러 로깅 시스템
class ErrorLogger {
  private logs: ErrorReport[] = []
  private maxLogs = 100

  log(report: ErrorReport) {
    // 로컬 저장
    this.logs.unshift(report)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // 콘솔 로깅
    const logLevel = report.severity === 'critical' || report.severity === 'high' ? 'error' : 'warn'
    console[logLevel](`[${report.category.toUpperCase()}] ${report.details.message}`, {
      id: report.id,
      details: report.details,
    })

    // 로컬스토리지에 중요한 에러 저장 (개발/디버깅용)
    if (typeof window !== 'undefined' && report.severity !== 'low') {
      try {
        const stored = localStorage.getItem('error_logs') || '[]'
        const logs = JSON.parse(stored) as ErrorReport[]
        logs.unshift(report)
        localStorage.setItem('error_logs', JSON.stringify(logs.slice(0, 50)))
      } catch (e) {
        console.warn('Failed to store error log:', e)
      }
    }
  }

  getLogs(): ErrorReport[] {
    return [...this.logs]
  }

  getStoredLogs(): ErrorReport[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem('error_logs') || '[]'
      return JSON.parse(stored) as ErrorReport[]
    } catch {
      return []
    }
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_logs')
    }
  }
}

// 전역 에러 로거 인스턴스
export const errorLogger = new ErrorLogger()

// 전역 에러 핸들러
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private notificationCallbacks: ((report: ErrorReport) => void)[] = []

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  // 에러 처리 메인 함수
  handleError(error: Error, context?: Parameters<typeof createErrorReport>[1]): ErrorReport {
    const report = createErrorReport(error, context)

    // 에러 로깅
    errorLogger.log(report)

    // 사용자 알림
    if (report.shouldNotifyUser) {
      this.notifyUser(report)
    }

    return report
  }

  // 사용자 알림 콜백 등록
  onNotification(callback: (report: ErrorReport) => void) {
    this.notificationCallbacks.push(callback)

    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback)
    }
  }

  private notifyUser(report: ErrorReport) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(report)
      } catch (e) {
        console.error('Error in notification callback:', e)
      }
    })
  }

  // 브라우저 전역 에러 리스너 설정
  setupGlobalListeners() {
    if (typeof window === 'undefined') return

    // JavaScript 런타임 에러
    window.addEventListener('error', event => {
      this.handleError(new Error(event.message), {
        url: event.filename,
        additionalContext: {
          line: event.lineno,
          column: event.colno,
        },
      })
    })

    // Promise rejection 에러
    window.addEventListener('unhandledrejection', event => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      this.handleError(error, {
        additionalContext: {
          type: 'unhandledPromiseRejection',
        },
      })
    })
  }
}

// 전역 에러 핸들러 인스턴스
export const globalErrorHandler = GlobalErrorHandler.getInstance()

// 에러 처리 헬퍼 함수들
export function handleApiError(error: unknown, url?: string, userId?: string): ErrorReport {
  const statusCode =
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status: number }).status
      : undefined
  const message =
    (typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : undefined) || '알 수 없는 API 오류가 발생했습니다.'

  return globalErrorHandler.handleError(new Error(message), {
    statusCode,
    url,
    userId,
    additionalContext: {
      apiError: true,
      originalError: error,
    },
  })
}

export function handleNetworkError(error: unknown, url?: string): ErrorReport {
  const message =
    (typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : undefined) || '네트워크 연결 오류가 발생했습니다.'

  return globalErrorHandler.handleError(new Error(message), {
    url,
    additionalContext: {
      networkError: true,
      originalError: error,
    },
  })
}

export function handleValidationError(errors: unknown, context?: string): ErrorReport {
  const message = typeof errors === 'string' ? errors : '입력 정보가 올바르지 않습니다.'

  return globalErrorHandler.handleError(new Error(message), {
    statusCode: 400,
    additionalContext: {
      validationError: true,
      validationDetails: errors,
      context,
    },
  })
}

// 에러 재시도 헬퍼
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        break
      }

      // 재시도 가능한 에러인지 확인
      const report = createErrorReport(lastError)
      if (!report.retryable) {
        break
      }

      // 지연 후 재시도
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError!
}
