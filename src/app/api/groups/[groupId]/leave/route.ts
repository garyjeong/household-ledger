import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, findGroupById, leaveGroup } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    groupId: string
  }>
}

// 그룹 탈퇴
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

    const { groupId } = await params

    // 그룹 존재 여부 및 멤버십 확인
    const group = await findGroupById(groupId, payload.userId)
    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      )
    }

    // 소유자인지 확인 (소유자는 탈퇴할 수 없음)
    const userMember = group.members.find((member) => member.userId === payload.userId)
    if (userMember?.role === 'OWNER') {
      return NextResponse.json(
        {
          error: '그룹 소유자는 탈퇴할 수 없습니다. 다른 멤버에게 소유권을 이전한 후 탈퇴해주세요.',
        },
        { status: 400 }
      )
    }

    // 그룹 탈퇴
    const left = await leaveGroup(groupId, payload.userId)
    if (!left) {
      return NextResponse.json(
        {
          error: '그룹 탈퇴에 실패했습니다.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '그룹에서 성공적으로 탈퇴했습니다.',
    })
  } catch (error) {
    console.error('Leave group error:', error)
    return NextResponse.json({ error: '그룹 탈퇴 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
