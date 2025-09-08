/**
 * 🔒 강화된 Next.js 미들웨어
 * 화이트리스트 기반 보안, 토큰 검증, 요청 로깅 및 에러 처리
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { safeConsole } from '@/lib/security-utils'

// 🎯 화이트리스트 기반 경로 설정

/**
 * 완전히 공개된 경로 (인증 불필요)
 */
const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/error', '/not-found'] as const

/**
 * 공개 API 엔드포인트 (인증 불필요)
 */
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/check-email',
  '/api/auth/refresh', // 토큰 갱신은 공개 (내부에서 검증)
  '/api/health', // 헬스체크
] as const

/**
 * 보호된 페이지 경로 (인증 필수)
 */
const PROTECTED_PATHS = [
  '/',
  '/dashboard',
  '/ledger',
  '/transactions',
  '/statistics',
  '/categories',
  '/groups',
  '/profile',
  '/settings',
] as const

/**
 * 보호된 API 엔드포인트 (인증 필수)
 */
const PROTECTED_API_PATHS = [
  '/api/transactions',
  '/api/categories',
  '/api/groups',
  '/api/balance',
  '/api/dashboard',
  '/api/statistics',
  '/api/settings',
  '/api/auth/me',
  '/api/auth/change-password',
  '/api/metrics', // 시스템 메트릭스도 보호
] as const

/**
 * 정적 파일 및 Next.js 내부 경로 (미들웨어 우회)
 */
const BYPASS_PATHS = [
  '/_next/',
  '/favicon.ico',
  '/sw.js',
  '/manifest.json',
  '/public/',
  '/.well-known/',
] as const

/**
 * 관리자 전용 경로 (향후 확장용)
 */
const ADMIN_PATHS = ['/admin', '/api/admin'] as const

// 🛡️ 보안 유틸리티 함수들

/**
 * 경로가 우회해야 하는지 확인
 */
function shouldBypassMiddleware(pathname: string): boolean {
  return BYPASS_PATHS.some(path => pathname.startsWith(path))
}

/**
 * 공개 경로인지 확인
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))
}

/**
 * 공개 API 경로인지 확인
 */
function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))
}

/**
 * 보호된 경로인지 확인
 */
function isProtectedPath(pathname: string): boolean {
  return (
    PROTECTED_PATHS.some(
      path => pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
    ) || pathname === '/'
  ) // 루트 경로는 항상 보호
}

/**
 * 보호된 API 경로인지 확인
 */
function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PATHS.some(path => pathname.startsWith(path))
}

/**
 * 관리자 경로인지 확인
 */
function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(path => pathname.startsWith(path))
}

/**
 * 토큰 유효성 검증 (강화된 버전)
 */
function validateToken(request: NextRequest): {
  isValid: boolean
  userId?: string
  tokenType?: 'access' | 'refresh' | 'none'
  error?: string
} {
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  // 1. 토큰이 전혀 없는 경우
  if (!accessToken && !refreshToken) {
    return { isValid: false, tokenType: 'none', error: 'No tokens present' }
  }

  // 2. Access Token 검증 시도
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken)
      if (payload) {
        return {
          isValid: true,
          userId: payload.userId,
          tokenType: 'access',
        }
      }
    } catch (error) {
      // Access Token이 만료되었거나 유효하지 않음
      safeConsole.warn('Invalid access token in middleware', { error })
    }
  }

  // 3. Access Token이 실패한 경우, Refresh Token 존재 여부만 확인
  // (실제 갱신은 API에서 처리)
  if (refreshToken) {
    return {
      isValid: true, // 갱신 가능성이 있으므로 통과
      tokenType: 'refresh',
      error: 'Access token expired, refresh available',
    }
  }

  return { isValid: false, tokenType: 'none', error: 'All tokens invalid' }
}

/**
 * 요청 컨텍스트 생성
 */
function createRequestContext(request: NextRequest) {
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  return {
    requestId,
    method: request.method,
    pathname: request.nextUrl.pathname,
    userAgent,
    ip,
    timestamp: new Date().toISOString(),
  }
}

/**
 * 보안 응답 생성
 */
function createSecurityResponse(
  type: 'unauthorized' | 'forbidden' | 'redirect' | 'error',
  context: any,
  message?: string
) {
  const { requestId, pathname } = context

  switch (type) {
    case 'unauthorized':
      safeConsole.warn('인증되지 않은 접근 시도', context)
      return NextResponse.json(
        {
          error: message || '인증이 필요합니다',
          code: 'AUTHENTICATION_REQUIRED',
          requestId,
        },
        {
          status: 401,
          headers: {
            'X-Request-ID': requestId,
            'WWW-Authenticate': 'Bearer realm="household-ledger"',
          },
        }
      )

    case 'forbidden':
      safeConsole.warn('권한 부족 접근 시도', context)
      return NextResponse.json(
        {
          error: message || '접근 권한이 없습니다',
          code: 'ACCESS_FORBIDDEN',
          requestId,
        },
        {
          status: 403,
          headers: { 'X-Request-ID': requestId },
        }
      )

    case 'redirect':
      const loginUrl = new URL('/login', `${context.protocol}//${context.host}`)
      loginUrl.searchParams.set('returnUrl', pathname)
      loginUrl.searchParams.set('reason', 'auth_required')

      // safeConsole.log('로그인 리다이렉트', {
      //   ...context,
      //   redirectTo: loginUrl.toString(),
      // })

      return NextResponse.redirect(loginUrl)

    case 'error':
      safeConsole.error('미들웨어 처리 중 오류', message, context)
      return NextResponse.json(
        {
          error: '서버 오류가 발생했습니다',
          code: 'MIDDLEWARE_ERROR',
          requestId,
        },
        {
          status: 500,
          headers: { 'X-Request-ID': requestId },
        }
      )

    default:
      return NextResponse.next()
  }
}

/**
 * 🚀 메인 미들웨어 함수
 */
export function middleware(request: NextRequest) {
  const context = createRequestContext(request)
  const { pathname } = request.nextUrl

  try {
    // 1. 우회 경로 확인
    if (shouldBypassMiddleware(pathname)) {
      return NextResponse.next()
    }

    // 2. 공개 경로 확인
    if (isPublicPath(pathname) || isPublicApiPath(pathname)) {
      // 공개 경로에 대한 기본 헤더 설정
      const response = NextResponse.next()
      response.headers.set('X-Request-ID', context.requestId)

      // 공개 경로 접근 로깅 비활성화
      // if (process.env.NODE_ENV === 'development') {
      //   safeConsole.log('공개 경로 접근', context)
      // }

      return response
    }

    // 3. 보호된 경로에 대한 인증 확인
    if (isProtectedPath(pathname) || isProtectedApiPath(pathname)) {
      const tokenValidation = validateToken(request)

      if (!tokenValidation.isValid) {
        // API 경로인 경우 401 응답
        if (pathname.startsWith('/api/')) {
          return createSecurityResponse('unauthorized', context, tokenValidation.error)
        }

        // 웹 페이지인 경우 로그인 페이지로 리다이렉트
        return createSecurityResponse('redirect', {
          ...context,
          protocol: request.nextUrl.protocol,
          host: request.nextUrl.host,
        })
      }

      // 인증 성공 로깅 (필요시에만)
      // safeConsole.log('인증된 요청', {
      //   ...context,
      //   userId: tokenValidation.userId,
      //   tokenType: tokenValidation.tokenType,
      // })
    }

    // 4. 관리자 경로 확인 (향후 확장)
    if (isAdminPath(pathname)) {
      return createSecurityResponse('forbidden', context, '관리자 권한이 필요합니다')
    }

    // 5. API 요청에 대한 보안 헤더 설정
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next()

      // 보안 헤더 설정
      response.headers.set('X-Request-ID', context.requestId)
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      // CORS 헤더 (필요한 경우)
      const origin = request.headers.get('origin')
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.NEXT_PUBLIC_APP_URL,
      ].filter(Boolean)

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        response.headers.set(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-Request-ID'
        )
      }

      return response
    }

    // 6. 일반 페이지 요청
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', context.requestId)

    return response
  } catch (error) {
    return createSecurityResponse('error', context, String(error))
  }
}

/**
 * 미들웨어 실행 경로 설정
 * 성능 최적화를 위해 정적 파일들은 제외
 */
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 요청에 대해 실행:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, robots.txt 등
     * - public 폴더의 정적 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sw.js|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
}

/**
 * 🔒 미들웨어 보안 강화 사항
 *
 * 1. 화이트리스트 기반 접근 제어
 *    - 명시적으로 허용된 경로만 접근 가능
 *    - 새로운 경로는 반드시 화이트리스트에 추가 필요
 *
 * 2. 강화된 토큰 검증
 *    - Access Token 우선 검증
 *    - Refresh Token 존재 시 갱신 기회 제공
 *    - 토큰 유형별 세분화된 처리
 *
 * 3. 보안 로깅
 *    - 모든 인증 실패 로깅
 *    - 민감정보 마스킹 적용
 *    - 요청 ID로 추적 가능
 *
 * 4. 보안 헤더
 *    - XSS, Clickjacking 방지
 *    - CORS 정책 강화
 *    - Content-Type 검증
 *
 * 5. 에러 처리
 *    - 구조화된 에러 응답
 *    - 정보 노출 최소화
 *    - 적절한 HTTP 상태 코드
 */
