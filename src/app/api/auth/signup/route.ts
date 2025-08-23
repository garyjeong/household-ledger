import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  findUserByEmail,
  createUser,
  generateAccessToken,
  generateRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  type JWTPayload,
} from '@/lib/auth'

const signupSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 대소문자와 숫자를 포함해야 합니다.'),
  nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(20, '닉네임은 최대 20자까지 가능합니다.'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 입력 데이터 검증
    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => err.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { email, password, nickname } = validationResult.data

    // 이미 존재하는 이메일인지 확인
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }

    // 새 사용자 생성
    const newUser = await createUser({ email, password, nickname })

    // JWT 토큰 생성
    const tokenPayload: JWTPayload = {
      userId: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // 응답 생성
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          nickname: newUser.nickname,
          avatarUrl: newUser.avatarUrl,
        },
      },
      { status: 201 }
    )

    // 토큰을 쿠키에 설정
    response.cookies.set('accessToken', accessToken, accessTokenCookieOptions)
    response.cookies.set('refreshToken', refreshToken, refreshTokenCookieOptions)

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: '회원가입 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
