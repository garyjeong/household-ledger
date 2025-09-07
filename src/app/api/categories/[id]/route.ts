import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCookieToken } from '@/lib/auth'
import { updateCategorySchema, formatCategoryForResponse } from '@/lib/schemas/category'
import { canEditCategory, canDeleteCategory, isDefaultCategory } from '@/lib/seed-categories'

/**
 * PATCH /api/categories/[id]
 * 카테고리 정보 수정 (커스텀 카테고리만)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const categoryId = id

    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyCookieToken(accessToken)

    // 카테고리 존재 확인
    const existingCategory = await prisma.category.findUnique({
      where: { id: BigInt(categoryId) },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 기본 카테고리 수정 방지
    if (isDefaultCategory(existingCategory)) {
      return NextResponse.json(
        { error: '기본 카테고리는 수정할 수 없습니다', code: 'DEFAULT_CATEGORY_READONLY' },
        { status: 403 }
      )
    }

    // 사용자의 그룹 정보 가져오기
    const userData = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      select: { groupId: true },
    })

    const userGroupId = userData?.groupId?.toString() || null

    // 수정 권한 확인
    if (!canEditCategory(existingCategory, user.userId, userGroupId)) {
      return NextResponse.json(
        { error: '카테고리를 수정할 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = updateCategorySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // 중복 이름 검사 (이름이나 타입을 변경하는 경우)
    if (
      (updateData.name && updateData.name !== existingCategory.name) ||
      (updateData.type && updateData.type !== existingCategory.type)
    ) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          groupId: existingCategory.groupId,
          name: updateData.name || existingCategory.name,
          type: updateData.type || existingCategory.type,
          id: { not: BigInt(categoryId) }, // 현재 카테고리 제외
        },
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: '이미 존재하는 카테고리명입니다', code: 'DUPLICATE_NAME' },
          { status: 409 }
        )
      }
    }

    // 카테고리 정보 업데이트
    const updatedCategory = await prisma.category.update({
      where: { id: BigInt(categoryId) },
      data: updateData,
    })

    return NextResponse.json({
      message: '카테고리 정보가 성공적으로 수정되었습니다',
      category: formatCategoryForResponse(updatedCategory),
    })
  } catch (error) {
    console.error('카테고리 수정 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 * 카테고리 삭제 (커스텀 카테고리만)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = id

    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyCookieToken(accessToken)

    // 카테고리 존재 확인
    const existingCategory = await prisma.category.findUnique({
      where: { id: BigInt(categoryId) },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 기본 카테고리 삭제 방지
    if (isDefaultCategory(existingCategory)) {
      return NextResponse.json(
        { error: '기본 카테고리는 삭제할 수 없습니다', code: 'DEFAULT_CATEGORY_READONLY' },
        { status: 403 }
      )
    }

    // 사용자의 그룹 정보 가져오기
    const userData = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      select: { groupId: true },
    })

    const userGroupId = userData?.groupId?.toString() || null

    // 삭제 권한 확인
    if (!canDeleteCategory(existingCategory, user.userId, userGroupId)) {
      return NextResponse.json(
        { error: '카테고리를 삭제할 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 연관된 거래가 있는지 확인 (선택사항 - 현재는 구현하지 않음)
    // TODO: 추후 Transaction 모델이 구현되면 연관 거래 확인 로직 추가

    // 카테고리 삭제
    await prisma.category.delete({
      where: { id: BigInt(categoryId) },
    })

    return NextResponse.json({
      message: '카테고리가 성공적으로 삭제되었습니다',
    })
  } catch (error) {
    console.error('카테고리 삭제 중 오류:', error)

    // Prisma 에러 처리
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        {
          error: '연관된 거래가 있어 카테고리를 삭제할 수 없습니다',
          code: 'FOREIGN_KEY_CONSTRAINT',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/categories/[id]
 * 특정 카테고리 정보 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const categoryId = id

    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyCookieToken(accessToken)

    // 카테고리 존재 확인
    const category = await prisma.category.findUnique({
      where: { id: BigInt(categoryId) },
    })

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다', code: 'CATEGORY_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 기본 카테고리는 모든 사용자가 조회 가능
    if (!isDefaultCategory(category)) {
      // 커스텀 카테고리는 소유권 검증
      const userData = await prisma.user.findUnique({
        where: { id: BigInt(user.userId) },
        select: { groupId: true },
      })

      const userGroupId = userData?.groupId?.toString() || null

      // 그룹 카테고리인 경우 같은 그룹 멤버인지 확인
      if (category.groupId) {
        if (!userGroupId || category.groupId.toString() !== userGroupId) {
          return NextResponse.json(
            { error: '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
            { status: 403 }
          )
        }
      } else {
        // 개인 카테고리인 경우 생성자인지 확인
        if (category.createdBy.toString() !== user.userId) {
          return NextResponse.json(
            { error: '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
            { status: 403 }
          )
        }
      }
    }

    return NextResponse.json({
      category: formatCategoryForResponse(category),
    })
  } catch (error) {
    console.error('카테고리 조회 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
