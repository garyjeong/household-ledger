import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { verifyCookieToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 비밀번호 변경 스키마
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
  newPassword: z
    .string()
    .min(8, '새 비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '새 비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
})

/**
 * PUT /api/auth/change-password
 * 사용자 비밀번호 변경
 */
export async function PUT(request: NextRequest) {
  try {
    // 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = verifyCookieToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = changePasswordSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validationResult.data

    // 사용자 정보 조회
    const userInfo = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      select: {
        id: true,
        passwordHash: true,
      },
    })

    if (!userInfo) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 현재 비밀번호 검증
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userInfo.passwordHash)

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다', code: 'INVALID_CURRENT_PASSWORD' },
        { status: 400 }
      )
    }

    // 새 비밀번호가 현재 비밀번호와 같은지 확인
    const isSamePassword = await bcrypt.compare(newPassword, userInfo.passwordHash)
    if (isSamePassword) {
      return NextResponse.json(
        { error: '새 비밀번호는 현재 비밀번호와 달라야 합니다', code: 'SAME_PASSWORD' },
        { status: 400 }
      )
    }

    // 새 비밀번호 해시화
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: userInfo.id },
      data: {
        passwordHash: newPasswordHash,
      },
    })

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다',
    })
  } catch (error) {
    console.error('비밀번호 변경 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
