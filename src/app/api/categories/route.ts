import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyToken,
  extractTokenFromHeader,
  verifyCategoryOwnership,
  verifyCookieToken,
} from '@/lib/auth'
import {
  categoryQuerySchema,
  createCategorySchema,
  formatCategoryForResponse,
  type CategoryResponse,
} from '@/lib/schemas/category'
import { getAvailableCategories, seedDefaultCategories } from '@/lib/seed-categories'
import { safeConsole } from '@/lib/security-utils'

/**
 * GET /api/categories
 * 카테고리 목록 조회 (기본 + 커스텀)
 */
export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터 검증
    const { searchParams } = new URL(request.url)
    const queryResult = categoryQuerySchema.safeParse({
      groupId: searchParams.get('groupId') || undefined,
      type: searchParams.get('type') || undefined,
      isDefault: searchParams.get('isDefault') || undefined,
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: '잘못된 쿼리 파라미터입니다',
          code: 'INVALID_QUERY',
          details: queryResult.error.issues,
        },
        { status: 400 }
      )
    }

    const query = queryResult.data

    // 사용자 그룹 정보 가져오기
    const userInfo = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      select: { groupId: true }
    })

    if (!userInfo) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 그룹 ID 결정: 쿼리에서 지정된 groupId 또는 사용자의 groupId 사용
    const targetGroupId = query.groupId ? BigInt(query.groupId) : userInfo.groupId

    // 기본 카테고리가 없으면 시드 데이터 생성
    const defaultCategoryCount = await prisma.category.count({
      where: {
        groupId: null,
        isDefault: true,
      },
    })

    if (defaultCategoryCount === 0) {
      await seedDefaultCategories()
    }

    // 카테고리 조회: 기본 카테고리 + 그룹 카테고리
    const whereConditions: any = {
      OR: [
        // 기본 카테고리 (모든 사용자가 볼 수 있음)
        { groupId: null, isDefault: true },
        // 그룹 카테고리 (해당 그룹 멤버만 볼 수 있음)
        ...(targetGroupId ? [{ groupId: targetGroupId, isDefault: false }] : [])
      ]
    }

    // 타입 필터 추가
    if (query.type) {
      whereConditions.type = query.type
    }

    // isDefault 필터 추가
    if (query.isDefault !== undefined) {
      whereConditions.isDefault = query.isDefault
    }

    const categories = await prisma.category.findMany({
      where: whereConditions,
      orderBy: [
        { isDefault: 'desc' }, // 기본 카테고리 먼저
        { name: 'asc' }        // 이름 순
      ]
    })

    // 응답 형태로 변환
    const categoryResponses: CategoryResponse[] = categories.map(formatCategoryForResponse)

    return NextResponse.json({
      categories: categoryResponses,
      count: categories.length,
    })
  } catch (error) {
    safeConsole.error('카테고리 목록 조회 중 오류', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * 새 커스텀 카테고리 생성
 */
export async function POST(request: NextRequest) {
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

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = createCategorySchema.safeParse(body)

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

    const categoryData = validationResult.data

    // 사용자 그룹 정보 가져오기
    const userInfo = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      select: { groupId: true }
    })

    if (!userInfo) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 그룹 ID 결정: 요청에서 지정된 groupId 또는 사용자의 groupId 사용
    const targetGroupId = categoryData.groupId ? BigInt(categoryData.groupId) : userInfo.groupId

    // 그룹이 없는 경우 기본 카테고리만 생성 가능 (관리자 권한 필요)
    if (!targetGroupId && !categoryData.groupId) {
      return NextResponse.json(
        { error: '그룹 멤버만 카테고리를 생성할 수 있습니다', code: 'GROUP_REQUIRED' },
        { status: 403 }
      )
    }

    // 중복 이름 검사 (같은 그룹 내에서 같은 타입)
    const existingCategory = await prisma.category.findFirst({
      where: {
        groupId: targetGroupId,
        name: categoryData.name,
        type: categoryData.type,
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: '이미 존재하는 카테고리명입니다', code: 'DUPLICATE_NAME' },
        { status: 409 }
      )
    }

    // 커스텀 카테고리 생성
    const newCategory = await prisma.category.create({
      data: {
        groupId: targetGroupId,
        createdBy: BigInt(user.userId),
        name: categoryData.name,
        type: categoryData.type,
        color: categoryData.color,
        isDefault: false, // 커스텀 카테고리는 항상 false
      },
    })

    return NextResponse.json(
      {
        message: '카테고리가 성공적으로 생성되었습니다',
        category: formatCategoryForResponse(newCategory),
      },
      { status: 201 }
    )
  } catch (error) {
    safeConsole.error('카테고리 생성 중 오류', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
