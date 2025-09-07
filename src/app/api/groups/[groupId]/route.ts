import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCookieToken } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    groupId: string
  }>
}

/**
 * GET /api/groups/[groupId]
 * 특정 그룹 상세 정보 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyCookieToken(accessToken)
    const { groupId } = await params

    // 그룹 존재 여부 및 접근 권한 확인
    const group = await prisma.group.findUnique({
      where: { id: BigInt(groupId) },
      include: {
        owner: {
          select: { id: true, nickname: true, email: true },
        },
        members: {
          select: { id: true, nickname: true, email: true },
        },
        _count: {
          select: {
            categories: true,
            transactions: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 그룹 멤버인지 확인
    const isMember =
      group.members.some(member => member.id.toString() === user.userId) ||
      group.ownerId.toString() === user.userId

    if (!isMember) {
      return NextResponse.json(
        { error: '그룹에 접근할 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 응답 데이터 포맷팅
    const formattedGroup = {
      id: group.id.toString(),
      name: group.name,
      ownerId: group.ownerId.toString(),
      owner: {
        id: group.owner.id.toString(),
        nickname: group.owner.nickname,
        email: group.owner.email,
      },
      members: group.members.map(member => ({
        id: member.id.toString(),
        nickname: member.nickname,
        email: member.email,
      })),
      counts: {
        categories: group._count.categories,
        transactions: group._count.transactions,
      },
      createdAt: group.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      group: formattedGroup,
    })
  } catch (error: any) {
    console.error('❌ 그룹 조회 중 오류:', error)
    return NextResponse.json(
      { error: '그룹 조회 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/groups/[groupId]
 * 그룹 삭제 (소유자만 가능)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('🗑️ 그룹 삭제 API 호출됨')

    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyCookieToken(accessToken)
    const { groupId } = await params

    console.log('👤 사용자 검증 성공:', user.userId, '그룹 ID:', groupId)

    // 그룹 존재 여부 및 소유권 확인
    const group = await prisma.group.findUnique({
      where: { id: BigInt(groupId) },
      include: {
        members: {
          select: { id: true, nickname: true },
        },
        _count: {
          select: {
            categories: true,
            transactions: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 소유자 권한 확인
    if (group.ownerId.toString() !== user.userId) {
      return NextResponse.json(
        {
          error: '그룹을 삭제할 권한이 없습니다. 소유자만 그룹을 삭제할 수 있습니다.',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      )
    }

    console.log(
      `🔍 삭제할 그룹 정보: ${group.name} (카테고리: ${group._count.categories}개, 거래: ${group._count.transactions}개, 멤버: ${group.members.length}명)`
    )

    // 트랜잭션으로 안전하게 삭제
    await prisma.$transaction(async tx => {
      // 1. 그룹 멤버들의 groupId를 null로 업데이트
      if (group.members.length > 0) {
        await tx.user.updateMany({
          where: { groupId: BigInt(groupId) },
          data: { groupId: null },
        })
        console.log('✅ 그룹 멤버들의 groupId 제거 완료')
      }

      // 2. 그룹 관련 카테고리 삭제 (기본 카테고리 제외)
      const deletedCategories = await tx.category.deleteMany({
        where: {
          groupId: BigInt(groupId),
          isDefault: false, // 기본 카테고리는 삭제하지 않음
        },
      })
      console.log(`✅ 그룹 카테고리 ${deletedCategories.count}개 삭제 완료`)

      // 3. 그룹 관련 거래를 개인 거래로 전환 (삭제하지 않고 보존)
      const updatedTransactions = await tx.transaction.updateMany({
        where: { groupId: BigInt(groupId) },
        data: { groupId: null },
      })
      console.log(`✅ 그룹 거래 ${updatedTransactions.count}개를 개인 거래로 전환 완료`)

      // 4. 그룹 삭제 (초대 코드는 CASCADE로 자동 삭제됨)
      await tx.group.delete({
        where: { id: BigInt(groupId) },
      })
      console.log('✅ 그룹 삭제 완료')
    })

    // 카테고리 캐시 클리어는 클라이언트 측에서 처리됩니다

    console.log('🎉 그룹 삭제 성공:', group.name)

    return NextResponse.json({
      success: true,
      message: '그룹이 성공적으로 삭제되었습니다.',
      deletedGroup: {
        id: group.id.toString(),
        name: group.name,
      },
    })
  } catch (error: any) {
    console.error('❌ 그룹 삭제 중 오류:', error)

    // 트랜잭션 오류 처리
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: '데이터 무결성 오류가 발생했습니다', code: 'INTEGRITY_ERROR' },
          { status: 400 }
        )
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: '삭제할 그룹을 찾을 수 없습니다', code: 'GROUP_NOT_FOUND' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: '그룹 삭제 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/groups/[groupId]
 * 그룹 정보 수정 (이름 변경)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyCookieToken(accessToken)
    const { groupId } = await params
    const body = await request.json()

    // 요청 데이터 검증
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: '그룹 이름을 입력해주세요', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const name = body.name.trim()
    if (name.length === 0 || name.length > 50) {
      return NextResponse.json(
        { error: '그룹 이름은 1자 이상 50자 이하여야 합니다', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // 그룹 존재 여부 및 소유권 확인
    const group = await prisma.group.findUnique({
      where: { id: BigInt(groupId) },
    })

    if (!group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (group.ownerId.toString() !== user.userId) {
      return NextResponse.json(
        { error: '그룹을 수정할 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 그룹 이름 업데이트
    const updatedGroup = await prisma.group.update({
      where: { id: BigInt(groupId) },
      data: { name },
    })

    return NextResponse.json({
      success: true,
      message: '그룹 정보가 수정되었습니다.',
      group: {
        id: updatedGroup.id.toString(),
        name: updatedGroup.name,
        ownerId: updatedGroup.ownerId.toString(),
        createdAt: updatedGroup.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('❌ 그룹 수정 중 오류:', error)
    return NextResponse.json(
      { error: '그룹 수정 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
