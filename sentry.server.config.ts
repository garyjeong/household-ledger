// This file configures the initialization of Sentry on the server side.
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment 설정
  environment: process.env.NODE_ENV || 'development',
  
  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === 'development',
  
  // 성능 모니터링 (서버 사이드는 더 높은 샘플링)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,
  
  // 서버 전용 통합
  integrations: [
    // Node.js 기본 통합 제거 (Sentry v8+에서는 자동 포함)
  ],
  
  // 민감한 정보 필터링 (서버 사이드)
  beforeSend(event, hint) {
    // 개발 환경에서는 모든 이벤트 전송
    if (process.env.NODE_ENV === 'development') {
      return event
    }
    
    const error = hint.originalException
    
    // 데이터베이스 연결 정보 필터링
    if (error instanceof Error) {
      const sensitivePatterns = [
        /database/i,
        /connection/i,
        /postgresql:\/\//i,
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /credential/i,
        /dsn/i,
      ]
      
      if (sensitivePatterns.some(pattern => pattern.test(error.message))) {
        event.message = error.message.replace(/([a-zA-Z0-9+/=]{20,})/g, '[FILTERED]')
        event.message = event.message.replace(/postgresql:\/\/[^@]+@[^/]+/g, 'postgresql://***:***@***/***')
      }
    }
    
    // 환경 변수 정보 제거
    if (event.contexts?.runtime?.environment) {
      const env = event.contexts.runtime.environment as any
      Object.keys(env).forEach(key => {
        if (key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('dsn')) {
          env[key] = '[FILTERED]'
        }
      })
    }
    
    // 요청 헤더에서 인증 정보 제거
    if (event.request?.headers) {
      const headers = event.request.headers as any
      if (headers.authorization) {
        headers.authorization = '[FILTERED]'
      }
      if (headers.cookie) {
        headers.cookie = '[FILTERED]'
      }
      if (headers['x-api-key']) {
        headers['x-api-key'] = '[FILTERED]'
      }
    }
    
    // 쿼리 파라미터에서 민감한 정보 제거  
    if (event.request?.query_string) {
      if (typeof event.request.query_string === 'string') {
        event.request.query_string = event.request.query_string.replace(
          /([?&])(token|key|password|secret)=([^&]*)/gi, 
          '$1$2=[FILTERED]'
        )
      }
    }
    
    return event
  },
  
  // 에러 무시 설정 (서버 전용)
  ignoreErrors: [
    // 데이터베이스 연결 에러 (일시적)
    'Connection terminated',
    'Connection reset by peer',
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    
    // Next.js 일반적인 에러들
    'NEXT_NOT_FOUND',
    'DYNAMIC_SERVER_USAGE',
    
    // 클라이언트 연결 중단
    'Client disconnected',
    'Request aborted',
    
    // 개발 중 흔한 에러들
    'Module not found',
    'Cannot resolve module',
  ],
  
  // 서버 컨텍스트 태그
  initialScope: {
    tags: {
      component: 'server',
      runtime: 'nodejs',
    },
  },
})

// 서버 전용 유틸리티 함수들
export const serverSentryUtils = {
  // API 에러 캡처
  captureApiError: (error: Error, req?: any, additionalContext?: Record<string, any>) => {
    Sentry.withScope(scope => {
      scope.setTag('errorType', 'api')
      
      if (req) {
        scope.setContext('request', {
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers?.['user-agent'],
            'referer': req.headers?.referer,
            // 민감한 헤더는 제외
          },
        })
      }
      
      if (additionalContext) {
        scope.setContext('additional', additionalContext)
      }
      
      Sentry.captureException(error)
    })
  },
  
  // 데이터베이스 에러 캡처
  captureDatabaseError: (error: Error, query?: string, params?: any[]) => {
    Sentry.withScope(scope => {
      scope.setTag('errorType', 'database')
      
      if (query) {
        // 쿼리에서 민감한 값들을 필터링
        const sanitizedQuery = query.replace(/('\w*[pP]assword\w*')/g, "'[FILTERED]'")
        scope.setContext('database', {
          query: sanitizedQuery,
          // params는 민감할 수 있으므로 길이만 기록
          paramCount: params?.length || 0,
        })
      }
      
      Sentry.captureException(error)
    })
  },
  
  // 인증 에러 캡처
  captureAuthError: (error: Error, userId?: string, action?: string) => {
    Sentry.withScope(scope => {
      scope.setTag('errorType', 'auth')
      
      if (userId) {
        scope.setUser({ id: userId })
      }
      
      if (action) {
        scope.setContext('auth', { action })
      }
      
      Sentry.captureException(error)
    })
  },
  
  // 성능 이슈 추적
  trackPerformance: (operationName: string, duration: number, additionalData?: Record<string, any>) => {
    if (duration > 1000) { // 1초 이상 걸린 작업만 추적
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${operationName} took ${duration}ms`,
        level: 'warning',
        data: {
          duration,
          operation: operationName,
          ...additionalData,
        },
      })
    }
  },
}

// Express 스타일 에러 핸들러 미들웨어
export function sentryErrorHandler(err: Error, req: any, res: any, next: any) {
  serverSentryUtils.captureApiError(err, req)
  next(err)
}
