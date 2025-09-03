import { NextRequest, NextResponse } from 'next/server'
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  findUserById,
  type JWTPayload,
} from '@/lib/auth'
import { safeConsole } from '@/lib/security-utils'

/**
 * POST /api/auth/refresh
 * Refresh Token을 사용하여 새로운 Access Token 발급
 */
export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 Refresh Token 가져오기
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: 'Refresh Token이 없습니다',
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required for token renewal',
        },
        { status: 401 }
      )
    }

    // Refresh Token 검증
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        {
          error: 'Refresh Token이 유효하지 않거나 만료되었습니다',
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
        { status: 401 }
      )
    }

    // 사용자 존재 확인
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

    // 새로운 토큰 생성
    const newTokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    }

    const newAccessToken = generateAccessToken(newTokenPayload)
    const newRefreshToken = generateRefreshToken(newTokenPayload)

    // 응답 생성
    const response = NextResponse.json(
      {
        success: true,
        message: '토큰이 성공적으로 갱신되었습니다',
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
      },
      { status: 200 }
    )

    // 새로운 토큰을 쿠키에 설정
    response.cookies.set('accessToken', newAccessToken, accessTokenCookieOptions)
    response.cookies.set('refreshToken', newRefreshToken, refreshTokenCookieOptions)

    return response
  } catch (error) {
    safeConsole.error('Token refresh error', error, { endpoint: '/api/auth/refresh' })
    return NextResponse.json(
      {
        error: '토큰 갱신 중 오류가 발생했습니다',
        code: 'TOKEN_REFRESH_ERROR',
        message: 'An error occurred while refreshing tokens',
      },
      { status: 500 }
    )
  }
}
