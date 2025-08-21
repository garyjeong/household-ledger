import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, findUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 })
    }

    // 토큰 검증
    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 })
    }

    // 사용자 정보 조회
    const user = await findUserById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
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
    return NextResponse.json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
