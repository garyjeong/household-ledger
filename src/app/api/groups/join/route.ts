import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken, validateInviteCode, joinGroup, findGroupById } from '@/lib/auth'

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, '초대 코드를 입력해주세요.'),
})

// 그룹 참여
export async function POST(request: NextRequest) {
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

    // 요청 데이터 검증
    const body = await request.json()
    const validationResult = joinGroupSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => err.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { inviteCode } = validationResult.data

    // 초대 코드 검증
    const codeValidation = await validateInviteCode(inviteCode)
    if (!codeValidation.isValid) {
      return NextResponse.json(
        {
          error: '유효하지 않거나 만료된 초대 코드입니다.',
        },
        { status: 400 }
      )
    }

    // 그룹 참여
    const joined = await joinGroup(codeValidation.groupId, payload.userId)
    if (!joined) {
      return NextResponse.json(
        {
          error: '이미 그룹에 참여했거나 그룹이 존재하지 않습니다.',
        },
        { status: 400 }
      )
    }

    // 참여한 그룹 정보 반환
    const group = await findGroupById(codeValidation.groupId)

    return NextResponse.json({
      success: true,
      group,
      message: '그룹에 성공적으로 참여했습니다.',
    })
  } catch (error) {
    console.error('Join group error:', error)
    return NextResponse.json({ error: '그룹 참여 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
