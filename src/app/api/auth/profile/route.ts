import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findUserById, verifyCookieToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 프로필 업데이트 스키마
const updateProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하로 입력해주세요'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
})

/**
 * GET /api/auth/profile
 * 현재 사용자 프로필 정보 조회
 */
export async function GET(request: NextRequest) {
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

    // 사용자 정보 조회
    const userInfo = await findUserById(user.userId)
    if (!userInfo) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userInfo.id,
        name: userInfo.nickname,
        email: userInfo.email,
        createdAt: userInfo.createdAt,
      },
    })
  } catch (error) {
    console.error('프로필 조회 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/profile
 * 사용자 프로필 정보 업데이트
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
    const validationResult = updateProfileSchema.safeParse(body)

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

    const { name, email } = validationResult.data

    // 이메일 중복 확인 (현재 사용자 제외)
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: BigInt(user.userId) },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다', code: 'EMAIL_ALREADY_EXISTS' },
        { status: 409 }
      )
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(user.userId) },
      data: {
        nickname: name,
        email,
      },
    })

    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다',
      user: {
        id: updatedUser.id.toString(),
        name: updatedUser.nickname,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
      },
    })
  } catch (error) {
    console.error('프로필 업데이트 중 오류:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
