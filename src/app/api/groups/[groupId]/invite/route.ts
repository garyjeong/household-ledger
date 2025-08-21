import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, findGroupById, generateInviteCode } from '@/lib/auth'

interface RouteParams {
  params: {
    groupId: string
  }
}

// 초대 링크 생성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 인증 확인
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 })
    }

    const { groupId } = params

    // 그룹 존재 여부 및 권한 확인
    const group = await findGroupById(groupId, payload.userId)
    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 관리자 권한 확인 (OWNER 또는 ADMIN만 초대 가능)
    const userMember = group.members.find((member) => member.userId === payload.userId)
    if (!userMember || (userMember.role !== 'OWNER' && userMember.role !== 'ADMIN')) {
      return NextResponse.json({ error: '초대 권한이 없습니다.' }, { status: 403 })
    }

    // 초대 코드 생성
    const inviteResponse = await generateInviteCode(groupId, payload.userId)

    return NextResponse.json({
      success: true,
      inviteCode: inviteResponse.inviteCode,
      inviteUrl: inviteResponse.inviteUrl,
      expiresAt: inviteResponse.expiresAt,
    })
  } catch (error) {
    console.error('Generate invite error:', error)
    return NextResponse.json({ error: '초대 링크 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
