import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  findUserByEmail,
  verifyUserPassword,
  generateAccessToken,
  generateRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  type JWTPayload,
} from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  rememberMe: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 입력 데이터 검증
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => err.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { email, password, rememberMe } = validationResult.data

    // 사용자 존재 여부 확인
    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 검증
    const isPasswordValid = await verifyUserPassword(email, password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // JWT 토큰 생성
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

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

    // 토큰을 쿠키에 설정 (rememberMe에 따라 만료 시간 조정)
    const accessCookieOptions = rememberMe
      ? { ...accessTokenCookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 } // 30일
      : accessTokenCookieOptions

    const refreshCookieOptions = rememberMe
      ? { ...refreshTokenCookieOptions, maxAge: 90 * 24 * 60 * 60 * 1000 } // 90일
      : refreshTokenCookieOptions

    response.cookies.set('accessToken', accessToken, accessCookieOptions)
    response.cookies.set('refreshToken', refreshToken, refreshCookieOptions)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '로그인 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
