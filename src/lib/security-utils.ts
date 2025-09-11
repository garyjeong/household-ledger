/**
 * 보안 유틸리티 함수들
 * 민감한 정보 필터링 및 로깅 보안 강화
 */

// 민감한 정보 키워드 목록
const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'jwt',
  'bearer',
  'credentials',
  'apiKey',
  'privateKey',
  'cert',
  'certificate',
]

// 민감한 URL 패턴
const SENSITIVE_URL_PATTERNS = [
  /token=/i,
  /key=/i,
  /secret=/i,
  /password=/i,
  /jwt=/i,
  /bearer/i,
  /auth=/i,
]

/**
 * 객체에서 민감한 정보 제거
 */
export function sanitizeObject(obj: any, maxDepth = 3): any {
  if (maxDepth <= 0) return '[MAX_DEPTH_REACHED]'

  if (obj === null || obj === undefined) return obj

  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }

  if (obj instanceof Date) {
    return obj.toISOString()
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeString(obj.message),
      stack: process.env.NODE_ENV === 'development' ? sanitizeString(obj.stack || '') : undefined,
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth - 1))
  }

  if (typeof obj === 'object') {
    const sanitized: any = {}

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase()

      // 민감한 키인지 확인
      if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeObject(value, maxDepth - 1)
      }
    }

    return sanitized
  }

  return obj
}

/**
 * 문자열에서 민감한 정보 마스킹
 */
export function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return str

  // JWT 토큰 패턴 마스킹
  str = str.replace(
    /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
    '[JWT_TOKEN_REDACTED]'
  )

  // Bearer 토큰 마스킹
  str = str.replace(/Bearer\s+[A-Za-z0-9-_.+/=]+/gi, 'Bearer [TOKEN_REDACTED]')

  // 긴 해시값 마스킹 (32자 이상의 hex 문자열)
  str = str.replace(/[a-fA-F0-9]{32,}/g, '[HASH_REDACTED]')

  // 이메일 부분 마스킹
  str = str.replace(
    /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match, username, domain) => {
      const maskedUsername =
        username.length > 2 ? username.substring(0, 2) + '*'.repeat(username.length - 2) : username
      return `${maskedUsername}@${domain}`
    }
  )

  return str
}

/**
 * URL에서 민감한 정보 제거
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return url

  try {
    const urlObj = new URL(url, 'http://localhost') // 상대 URL 처리를 위한 기본 호스트

    // 쿼리 파라미터에서 민감한 정보 제거
    for (const [key, value] of urlObj.searchParams.entries()) {
      const lowerKey = key.toLowerCase()

      if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        urlObj.searchParams.set(key, '[REDACTED]')
      }
    }

    // 전체 URL에서 민감한 패턴 마스킹
    let sanitizedURL = urlObj.toString()

    // localhost 제거 (상대 URL인 경우)
    if (url.startsWith('/')) {
      sanitizedURL = urlObj.pathname + urlObj.search + urlObj.hash
    }

    return sanitizeString(sanitizedURL)
  } catch (error) {
    // URL 파싱 실패시 문자열로 처리
    return sanitizeString(url)
  }
}

/**
 * 로깅용 에러 객체 생성
 */
export function createSafeErrorLog(
  error: any,
  context?: Record<string, any>
): {
  error: any
  context?: any
  timestamp: string
  environment: string
} {
  return {
    error: sanitizeObject(error),
    context: context ? sanitizeObject(context) : undefined,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  }
}

/**
 * 안전한 콘솔 로깅
 */
export const safeConsole = {
  log: (message: string, data?: any) => {
    // 개발 환경에서도 로그 출력 비활성화
    // if (process.env.NODE_ENV === 'development') {
    //   console.log(message, data ? sanitizeObject(data) : '')
    // }
  },

  warn: (message: string, data?: any) => {
    // 특정 안내성 경고(레거시 페이지네이션)는 테스트 환경을 제외하고 출력 억제
    if (
      typeof message === 'string' &&
      message.includes('레거시 페이지네이션') &&
      process.env.NODE_ENV !== 'test'
    ) {
      return
    }

    if (!shouldLog('warn')) return
    console.warn(message, data ? sanitizeObject(data) : '')
  },

  error: (message: string, error?: any, context?: Record<string, any>) => {
    const safeLog = createSafeErrorLog(error, context)
    console.error(message, safeLog)
  },

  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(message, data ? sanitizeObject(data) : '')
    }
  },
}

/**
 * API 요청/응답 로깅을 위한 안전한 함수
 */
export function logApiCall(
  method: string,
  url: string,
  status?: number,
  duration?: number,
  error?: any
) {
  const sanitizedURL = sanitizeURL(url)

  if (error) {
    safeConsole.error(
      `[API Error] ${method} ${sanitizedURL} ${status ? `(${status})` : ''} ${duration ? `(${duration}ms)` : ''}`,
      error
    )
  } else if (process.env.NODE_ENV === 'development') {
    // safeConsole.log(
    //   `[API Success] ${method} ${sanitizedURL} ${status ? `(${status})` : ''} ${duration ? `(${duration}ms)` : ''}`
    // )
  }
}

/**
 * 프로덕션 환경에서 민감한 로그 방지
 */
export function isLoggingAllowed(level: 'debug' | 'info' | 'warn' | 'error' = 'info'): boolean {
  if (process.env.NODE_ENV === 'production') {
    return level === 'error' || level === 'warn'
  }
  return true
}

/**
 * 환경별 로그 레벨 확인
 */
export function shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
  const logLevel = process.env.LOG_LEVEL || 'info'
  const levels = ['debug', 'info', 'warn', 'error']
  const currentLevelIndex = levels.indexOf(logLevel)
  const requestedLevelIndex = levels.indexOf(level)

  return requestedLevelIndex >= currentLevelIndex && isLoggingAllowed(level)
}
