import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessTokenDetailed, findUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        {
          error: '인증 토큰이 없습니다',
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
        { status: 401 }
      )
    }

    // 상세한 토큰 검증
    const verificationResult = verifyAccessTokenDetailed(accessToken)

    if (!verificationResult.isValid) {
      // 토큰 만료, 형식 오류 등에 따라 다른 응답 제공
      return NextResponse.json(
        {
          error: verificationResult.message || '토큰이 유효하지 않습니다',
          code: verificationResult.error,
          message: 'Token verification failed',
          details: {
            errorType: verificationResult.error,
            canRefresh: verificationResult.error === 'EXPIRED', // 만료된 경우에만 refresh 가능
          },
        },
        { status: 401 }
      )
    }

    const { payload } = verificationResult

    if (!payload) {
      return NextResponse.json(
        {
          error: '토큰 페이로드가 유효하지 않습니다',
          code: 'INVALID_PAYLOAD',
          message: 'Invalid token payload',
        },
        { status: 401 }
      )
    }

    // 사용자 정보 조회
    const user = await findUserById(payload.userId)
    if (!user) {
      return NextResponse.json(
        {
          error: '사용자를 찾을 수 없습니다',
          code: 'USER_NOT_FOUND',
          message: 'User not found in database',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Me endpoint error:', error)
    return NextResponse.json(
      {
        error: '사용자 정보 조회 중 오류가 발생했습니다',
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching user information',
      },
      { status: 500 }
    )
  }
}
