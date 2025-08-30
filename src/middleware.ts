import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js 미들웨어 - 전역 에러 처리 및 요청 로깅
 */

// 보호된 경로 설정
const PROTECTED_PATHS = [
  '/', // 메인 페이지도 인증 필요
  '/dashboard',
  '/ledger',
  '/settings',
  '/api/accounts',
  '/api/categories',
  '/api/transactions',
  '/api/recurring-rules',
  '/api/balance',
  '/api/groups',
  '/api/dashboard', // 대시보드 API도 보호
]

// 인증이 필요하지 않은 API 경로
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/check-email',
]

// 정적 파일 및 인증 관련 경로
const BYPASS_PATHS = [
  '/_next',
  '/favicon.ico',
  '/login',
  '/signup',
  '/forgot-password',
  '/api/auth',
]

function shouldBypassMiddleware(pathname: string): boolean {
  return BYPASS_PATHS.some(path => pathname.startsWith(path))
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path))
}

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(path => pathname.startsWith(path))
}

function hasValidToken(request: NextRequest): boolean {
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  // 간단한 토큰 존재 여부 체크 (실제 검증은 API에서 수행)
  return !!(accessToken || refreshToken)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 로깅 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${request.method} ${pathname}`)
  }

  // 미들웨어를 건너뛸 경로들
  if (shouldBypassMiddleware(pathname)) {
    return NextResponse.next()
  }

  try {
    // 보호된 경로에 대한 인증 확인
    if (isProtectedPath(pathname)) {
      const hasToken = hasValidToken(request)

      if (!hasToken) {
        // API 경로인 경우 401 응답
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            {
              error: '인증이 필요합니다',
              code: 'AUTH_REQUIRED',
            },
            { status: 401 }
          )
        }

        // 웹 페이지인 경우 로그인 페이지로 리다이렉트
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // API 요청에 대한 추가 헤더 설정
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next()

      // CORS 헤더 설정 (필요한 경우)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      // 요청 ID 생성 (로깅 및 디버깅용)
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      response.headers.set('X-Request-ID', requestId)

      return response
    }

    return NextResponse.next()
  } catch (error) {
    // 미들웨어에서 발생한 에러 처리
    console.error('[Middleware Error]', error)

    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: '서버 오류가 발생했습니다',
          code: 'MIDDLEWARE_ERROR',
        },
        { status: 500 }
      )
    }

    // 웹 페이지 에러인 경우 에러 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/error', request.url))
  }
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 대해 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
