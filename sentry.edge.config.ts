// This file configures the initialization of Sentry for edge runtime.
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment 설정
  environment: process.env.NODE_ENV || 'development',
  
  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === 'development',
  
  // Edge runtime은 성능 모니터링 제한적
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Edge runtime 전용 설정
  beforeSend(event, hint) {
    // 개발 환경에서는 모든 이벤트 전송
    if (process.env.NODE_ENV === 'development') {
      return event
    }
    
    const error = hint.originalException
    
    // Edge runtime에서도 민감한 정보 필터링
    if (error instanceof Error) {
      const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /credential/i,
      ]
      
      if (sensitivePatterns.some(pattern => pattern.test(error.message))) {
        event.message = error.message.replace(/([a-zA-Z0-9+/=]{20,})/g, '[FILTERED]')
      }
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
    }
    
    return event
  },
  
  // Edge runtime 특화 에러 무시
  ignoreErrors: [
    // Edge runtime 특정 에러들
    'Dynamic Code Evaluation',
    'WebAssembly instantiation failed',
    
    // 네트워크 에러
    'NetworkError',
    'fetch failed',
    'AbortError',
    
    // 타임아웃 에러
    'TimeoutError',
    'Request timeout',
  ],
  
  // Edge runtime 태그
  initialScope: {
    tags: {
      component: 'edge',
      runtime: 'edge-runtime',
    },
  },
})

// Edge runtime 전용 유틸리티
export const edgeSentryUtils = {
  // 미들웨어 에러 캡처
  captureMiddlewareError: (error: Error, request?: Request) => {
    Sentry.withScope(scope => {
      scope.setTag('errorType', 'middleware')
      
      if (request) {
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          headers: {
            'user-agent': request.headers.get('user-agent'),
            'referer': request.headers.get('referer'),
          },
        })
      }
      
      Sentry.captureException(error)
    })
  },
  
  // Edge function 에러 캡처
  captureEdgeFunctionError: (error: Error, functionName: string, context?: Record<string, any>) => {
    Sentry.withScope(scope => {
      scope.setTag('errorType', 'edge-function')
      scope.setTag('functionName', functionName)
      
      if (context) {
        scope.setContext('function', context)
      }
      
      Sentry.captureException(error)
    })
  },
}
