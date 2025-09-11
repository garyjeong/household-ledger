import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  findUserByEmail,
  createUser,
  generateAccessToken,
  generateRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  validateInviteCode,
  joinGroup,
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
  inviteCode: z
    .string()
    .optional()
    .refine(
      code => {
        if (!code || code.trim() === '') return true
        return /^[A-Z0-9]{10,12}$/.test(code.trim())
      },
      {
        message: '초대 코드는 10-12자리 대문자와 숫자로 구성되어야 합니다.',
      }
    ),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 입력 데이터 검증
    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => err.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { email, password, nickname, inviteCode } = validationResult.data

    // 이미 존재하는 이메일인지 확인
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }

    // 초대 코드가 제공된 경우 유효성 검증
    let targetGroupId: string | null = null
    if (inviteCode && inviteCode.trim()) {
      const codeValidation = await validateInviteCode(inviteCode.trim())
      if (!codeValidation.isValid) {
        return NextResponse.json(
          {
            error: '유효하지 않거나 만료된 초대 코드입니다.',
          },
          { status: 400 }
        )
      }
      targetGroupId = codeValidation.groupId
    }

    // 새 사용자 생성
    const newUser = await createUser({ email, password, nickname })

    // 초대 코드가 유효한 경우 해당 그룹에 참여
    let joinedGroup = null
    if (targetGroupId) {
      const joined = await joinGroup(targetGroupId, newUser.id)
      if (!joined) {
        console.warn(`Failed to join group ${targetGroupId} for user ${newUser.id}`)
        // 그룹 참여 실패해도 회원가입은 성공으로 처리 (개인 그룹으로 시작)
      } else {
        // 참여한 그룹 정보 가져오기
        const { findGroupById } = await import('@/lib/auth')
        joinedGroup = await findGroupById(targetGroupId)
      }
    }

    // JWT 토큰 생성
    const tokenPayload: JWTPayload = {
      userId: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // 응답 생성
    const responseData: {
      success: boolean
      user: {
        id: string
        email: string
        nickname: string
        avatarUrl: string | null
      }
      joinedGroup?: {
        id: string
        name: string
        members: number
      }
    } = {
      success: true,
      user: {
        id: newUser.id.toString(),
        email: newUser.email,
        nickname: newUser.nickname,
        avatarUrl: newUser.avatarUrl,
      },
    }

    // 그룹 참여 성공 시 그룹 정보 포함
    if (joinedGroup) {
      responseData.joinedGroup = {
        id: joinedGroup.id,
        name: joinedGroup.name,
        memberCount: joinedGroup.memberCount,
      }
      responseData.message = `회원가입이 완료되었습니다. ${joinedGroup.name} 그룹에 참여했습니다.`
    }

    const response = NextResponse.json(responseData, { status: 201 })

    // 토큰을 쿠키에 설정
    response.cookies.set('accessToken', accessToken, accessTokenCookieOptions)
    response.cookies.set('refreshToken', refreshToken, refreshTokenCookieOptions)

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: '회원가입 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
