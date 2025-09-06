import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCookieToken } from '@/lib/auth'

/**
 * GET /api/categories
 * 카테고리 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Categories API 호출됨')

    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyCookieToken(accessToken)
    console.log('👤 사용자 검증 성공:', user.userId)

    // 기본 카테고리 응답 (단순 버전)
    const categories = [
      { id: 'food', name: '식비', type: 'expense', icon: '🍽️' },
      { id: 'transport', name: '교통비', type: 'expense', icon: '🚗' },
      { id: 'entertainment', name: '문화생활', type: 'expense', icon: '🎬' },
      { id: 'salary', name: '급여', type: 'income', icon: '💰' },
    ]

    console.log('✅ 카테고리 조회 성공:', categories.length, '개')

    return NextResponse.json({
      categories,
      totalCount: categories.length,
      userId: user.userId,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ Categories API 에러:', error)
    return NextResponse.json(
      { error: '카테고리를 불러오는데 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
