import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: '로그아웃되었습니다.' },
      { status: 200 }
    )

    // 쿠키에서 토큰 제거
    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // 즉시 만료
    })

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // 즉시 만료
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: '로그아웃 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
