import { NextRequest, NextResponse } from 'next/server'
import {
  verifyRefreshToken,
  findUserById,
  generateAccessToken,
  accessTokenCookieOptions,
  type JWTPayload,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 리프레시 토큰 가져오기
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: '리프레시 토큰이 없습니다.' }, { status: 401 })
    }

    // 리프레시 토큰 검증
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 리프레시 토큰입니다.' }, { status: 401 })
    }

    // 사용자 정보 조회
    const user = await findUserById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 새로운 액세스 토큰 생성
    const newTokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    }

    const newAccessToken = generateAccessToken(newTokenPayload)

    // 응답 생성
    const response = NextResponse.json(
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

    // 새로운 액세스 토큰을 쿠키에 설정
    response.cookies.set('accessToken', newAccessToken, accessTokenCookieOptions)

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json({ error: '토큰 갱신 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
