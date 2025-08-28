import { NextRequest, NextResponse } from 'next/server'
import { verifyCookieToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/notifications/push-tokens/[id]
 * 특정 푸시 토큰 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const tokenId = params.id

    // 토큰 ID 검증
    if (!tokenId || isNaN(Number(tokenId))) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰 ID입니다', code: 'INVALID_TOKEN_ID' },
        { status: 400 }
      )
    }

    // 푸시 토큰 조회 (본인의 토큰만)
    const pushToken = await prisma.pushToken.findFirst({
      where: {
        id: BigInt(tokenId),
        userId: BigInt(user.userId),
      },
      select: {
        id: true,
        token: true,
        endpoint: true,
        userAgent: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
      },
    })

    if (!pushToken) {
      return NextResponse.json(
        { error: '푸시 토큰을 찾을 수 없습니다', code: 'TOKEN_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      token: {
        ...pushToken,
        id: pushToken.id.toString(),
      },
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
 * PUT /api/notifications/push-tokens/[id]
 * 푸시 토큰 최종 사용 시간 업데이트
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const tokenId = params.id

    // 토큰 ID 검증
    if (!tokenId || isNaN(Number(tokenId))) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰 ID입니다', code: 'INVALID_TOKEN_ID' },
        { status: 400 }
      )
    }

    // 토큰 존재 여부 확인
    const existingToken = await prisma.pushToken.findFirst({
      where: {
        id: BigInt(tokenId),
        userId: BigInt(user.userId),
      },
    })

    if (!existingToken) {
      return NextResponse.json(
        { error: '푸시 토큰을 찾을 수 없습니다', code: 'TOKEN_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 최종 사용 시간 업데이트
    const updatedToken = await prisma.pushToken.update({
      where: {
        id: BigInt(tokenId),
      },
      data: {
        lastUsed: new Date(),
      },
      select: {
        id: true,
        token: true,
        endpoint: true,
        userAgent: true,
        isActive: true,
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
      message: '푸시 토큰 사용 시간이 업데이트되었습니다',
    })
  } catch (error) {
    console.error('푸시 토큰 업데이트 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/push-tokens/[id]
 * 특정 푸시 토큰 비활성화/삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const tokenId = params.id

    // 토큰 ID 검증
    if (!tokenId || isNaN(Number(tokenId))) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰 ID입니다', code: 'INVALID_TOKEN_ID' },
        { status: 400 }
      )
    }

    // 토큰 존재 여부 확인
    const existingToken = await prisma.pushToken.findFirst({
      where: {
        id: BigInt(tokenId),
        userId: BigInt(user.userId),
      },
    })

    if (!existingToken) {
      return NextResponse.json(
        { error: '푸시 토큰을 찾을 수 없습니다', code: 'TOKEN_NOT_FOUND' },
        { status: 404 }
      )
    }

    // URL 파라미터에서 영구 삭제 여부 확인
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    if (permanent) {
      // 영구 삭제
      await prisma.pushToken.delete({
        where: {
          id: BigInt(tokenId),
        },
      })

      return NextResponse.json({
        success: true,
        message: '푸시 토큰이 영구적으로 삭제되었습니다',
      })
    } else {
      // 비활성화만
      const deactivatedToken = await prisma.pushToken.update({
        where: {
          id: BigInt(tokenId),
        },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          token: true,
          endpoint: true,
          userAgent: true,
          isActive: true,
          lastUsed: true,
          createdAt: true,
        },
      })

      return NextResponse.json({
        success: true,
        token: {
          ...deactivatedToken,
          id: deactivatedToken.id.toString(),
        },
        message: '푸시 토큰이 비활성화되었습니다',
      })
    }
  } catch (error) {
    console.error('푸시 토큰 삭제 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
