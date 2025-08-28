import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyCookieToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 푸시 토큰 등록 스키마
const registerTokenSchema = z.object({
  token: z.string().min(1, '푸시 토큰이 필요합니다'),
  endpoint: z.string().url('유효한 엔드포인트 URL이 필요합니다').optional(),
  keys: z
    .object({
      p256dh: z.string().optional(),
      auth: z.string().optional(),
    })
    .optional(),
  userAgent: z.string().max(500).optional(),
})

/**
 * GET /api/notifications/push-tokens
 * 사용자의 활성 푸시 토큰 목록 조회
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

    // 사용자의 활성 푸시 토큰 조회
    const pushTokens = await prisma.pushToken.findMany({
      where: {
        userId: BigInt(user.userId),
        isActive: true,
      },
      select: {
        id: true,
        token: true,
        endpoint: true,
        userAgent: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: {
        lastUsed: 'desc',
      },
    })

    // BigInt 변환
    const formattedTokens = pushTokens.map(token => ({
      ...token,
      id: token.id.toString(),
    }))

    return NextResponse.json({
      success: true,
      tokens: formattedTokens,
      count: formattedTokens.length,
    })
  } catch (error) {
    console.error('푸시 토큰 조회 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/push-tokens
 * 새 푸시 토큰 등록
 */
export async function POST(request: NextRequest) {
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
    const validationResult = registerTokenSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '잘못된 토큰 데이터입니다',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { token, endpoint, keys, userAgent } = validationResult.data

    // 기존 토큰이 있는지 확인 (중복 방지)
    const existingToken = await prisma.pushToken.findFirst({
      where: {
        userId: BigInt(user.userId),
        token: token,
      },
    })

    if (existingToken) {
      // 기존 토큰이 있으면 활성화 상태로 업데이트
      const updatedToken = await prisma.pushToken.update({
        where: {
          id: existingToken.id,
        },
        data: {
          isActive: true,
          lastUsed: new Date(),
          endpoint: endpoint || existingToken.endpoint,
          keys: keys || existingToken.keys,
          userAgent: userAgent || existingToken.userAgent,
        },
        select: {
          id: true,
          token: true,
          endpoint: true,
          userAgent: true,
          lastUsed: true,
          createdAt: true,
        },
      })

      return NextResponse.json({
        success: true,
        token: {
          ...updatedToken,
          id: updatedToken.id.toString(),
        },
        message: '기존 푸시 토큰이 업데이트되었습니다',
      })
    }

    // 새 토큰 등록
    const newToken = await prisma.pushToken.create({
      data: {
        userId: BigInt(user.userId),
        token: token,
        endpoint: endpoint,
        keys: keys,
        userAgent: userAgent,
        isActive: true,
        lastUsed: new Date(),
      },
      select: {
        id: true,
        token: true,
        endpoint: true,
        userAgent: true,
        lastUsed: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      token: {
        ...newToken,
        id: newToken.id.toString(),
      },
      message: '푸시 토큰이 성공적으로 등록되었습니다',
    })
  } catch (error) {
    console.error('푸시 토큰 등록 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/push-tokens
 * 모든 푸시 토큰 비활성화 (로그아웃 시 사용)
 */
export async function DELETE(request: NextRequest) {
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

    // 사용자의 모든 푸시 토큰 비활성화
    const result = await prisma.pushToken.updateMany({
      where: {
        userId: BigInt(user.userId),
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({
      success: true,
      deactivatedCount: result.count,
      message: '모든 푸시 토큰이 비활성화되었습니다',
    })
  } catch (error) {
    console.error('푸시 토큰 비활성화 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
