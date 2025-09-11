import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyAccessToken, findGroupsByUserId, createGroup } from '@/lib/auth'
import { safeConsole } from '@/lib/security-utils'
import { prisma } from '@/lib/prisma'

const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, '그룹 이름을 입력해주세요.')
    .max(50, '그룹 이름은 최대 50자까지 가능합니다.')
    .trim(),
})

// 그룹 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const user = verifyAccessToken(accessToken)
    if (!user) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 })
    }

    // 사용자의 그룹 목록 조회
    const groups = await findGroupsByUserId(user.userId)

    return NextResponse.json({
      success: true,
      groups,
    })
  } catch (error) {
    safeConsole.error('그룹 목록 조회 실패', error, {
      endpoint: '/api/groups',
      method: 'GET',
    })
    return NextResponse.json({ error: '그룹 목록 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 그룹 생성
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const user = verifyAccessToken(accessToken)
    if (!user) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 })
    }

    // 요청 데이터 검증
    const body = await request.json()
    const validationResult = createGroupSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => err.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { name } = validationResult.data

    // 사용자가 이미 소유한 그룹이 있는지 확인
    const existingOwnedGroup = await prisma.group.findFirst({
      where: { ownerId: BigInt(user.userId) },
    })

    if (existingOwnedGroup) {
      return NextResponse.json(
        {
          error: '이미 소유한 그룹이 있습니다. 계정당 하나의 그룹만 생성할 수 있습니다.',
          code: 'GROUP_LIMIT_EXCEEDED',
          existingGroup: {
            id: existingOwnedGroup.id.toString(),
            name: existingOwnedGroup.name,
          },
        },
        { status: 400 }
      )
    }

    // 그룹 생성
    const newGroup = await createGroup({
      name,
      ownerId: user.userId,
    })

    // 성공 로깅 - 비활성화
    // safeConsole.log('그룹 생성 성공', {
    //   groupId: newGroup.id,
    //   groupName: newGroup.name,
    //   ownerId: user.userId,
    // })

    return NextResponse.json(
      {
        success: true,
        group: newGroup,
      },
      { status: 201 }
    )
  } catch (error) {
    safeConsole.error('그룹 생성 실패', error, {
      endpoint: '/api/groups',
      method: 'POST',
    })
    return NextResponse.json({ error: '그룹 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
