// This file configures the initialization of Sentry on the browser/client side.
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment 설정
  environment: process.env.NODE_ENV || 'development',
  
  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === 'development',
  
  // 성능 모니터링
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // 세션 재생 (프로덕션에서만 일부 세션)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,
  replaysOnErrorSampleRate: 1.0,
  
  // 통합 설정
  integrations: [
    Sentry.replayIntegration({
      // 민감한 텍스트와 입력을 마스킹
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // 민감한 정보 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 모든 이벤트 전송
    if (process.env.NODE_ENV === 'development') {
      return event
    }
    
    // 민감한 정보가 포함된 에러 필터링
    const error = hint.originalException
    
    if (error instanceof Error) {
      // 비밀번호, 토큰 등이 포함된 에러 메시지 필터링
      const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /key/i,
        /auth/i,
        /credential/i,
      ]
      
      if (sensitivePatterns.some(pattern => pattern.test(error.message))) {
        // 민감한 정보를 마스킹
        event.message = error.message.replace(/([a-zA-Z0-9+/]{20,})/g, '[FILTERED]')
      }
    }
    
    // 요청 URL에서 민감한 정보 제거
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/([?&])(token|key|password)=([^&]*)/gi, '$1$2=[FILTERED]')
    }
    
    // 로컬 스토리지, 세션 스토리지 정보 제거
    if (event.contexts?.['Local Storage']) {
      delete event.contexts['Local Storage']
    }
    if (event.contexts?.['Session Storage']) {
      delete event.contexts['Session Storage']
    }
    
    // 사용자 정보에서 이메일 일부 마스킹
    if (event.user?.email) {
      const email = event.user.email
      const [local, domain] = email.split('@')
      if (local && domain) {
        event.user.email = `${local.slice(0, 2)}***@${domain}`
      }
    }
    
    return event
  },
  
  // 에러 무시 설정
  ignoreErrors: [
    // 네트워크 에러
    'Network Error',
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    
    // 취소된 요청
    'Request cancelled',
    'Request aborted',
    'AbortError',
    
    // 브라우저 확장 프로그램 에러
    'Script error.',
    'Non-Error promise rejection captured',
    
    // 개발 중 흔한 에러들
    'ResizeObserver loop limit exceeded',
    'ChunkLoadError',
  ],
  
  // 사용자 정보 설정
  initialScope: {
    tags: {
      component: 'client',
    },
  },
})

// 전역 에러 핸들러와의 통합을 위한 유틸리티 함수들
export const sentryUtils = {
  // 커스텀 에러 리포트를 Sentry로 전송
  captureErrorReport: (errorReport: any) => {
    Sentry.withScope(scope => {
      // 에러 카테고리와 심각도 설정
      scope.setTag('errorCategory', errorReport.category)
      scope.setLevel(mapSeverityToSentryLevel(errorReport.severity))
      
      // 컨텍스트 정보 추가
      if (errorReport.details?.userId) {
        scope.setUser({ id: errorReport.details.userId })
      }
      
      if (errorReport.details?.url) {
        scope.setContext('url', { url: errorReport.details.url })
      }
      
      if (errorReport.details?.context) {
        scope.setContext('additional', errorReport.details.context)
      }
      
      // 에러 전송
      Sentry.captureException(new Error(errorReport.details?.message || 'Unknown error'), {
        fingerprint: [errorReport.category, errorReport.details?.code || 'unknown'],
      })
    })
  },
  
  // 사용자 컨텍스트 설정
  setUserContext: (userId: string, email?: string) => {
    Sentry.setUser({
      id: userId,
      email: email,
    })
  },
  
  // 커스텀 태그 설정
  setCustomTag: (key: string, value: string) => {
    Sentry.setTag(key, value)
  },
}

// 심각도 매핑 함수
function mapSeverityToSentryLevel(severity: string): Sentry.SeverityLevel {
  switch (severity) {
    case 'critical':
      return 'fatal'
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'error'
  }
}
