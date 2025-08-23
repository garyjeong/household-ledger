import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader, verifyCategoryOwnership } from '@/lib/auth'
import {
  categoryQuerySchema,
  createCategorySchema,
  formatCategoryForResponse,
  type CategoryResponse,
} from '@/lib/schemas/category'
import { getAvailableCategories, seedDefaultCategories } from '@/lib/seed-categories'

/**
 * GET /api/categories
 * 카테고리 목록 조회 (기본 + 커스텀)
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 쿼리 파라미터 검증
    const { searchParams } = new URL(request.url)
    const queryResult = categoryQuerySchema.safeParse({
      ownerType: searchParams.get('ownerType'),
      ownerId: searchParams.get('ownerId'),
      type: searchParams.get('type'),
      isDefault: searchParams.get('isDefault'),
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

    // 기본값 설정: ownerType과 ownerId가 없으면 현재 사용자 기준으로 조회
    const ownerType = query.ownerType || 'USER'
    const ownerId = query.ownerId || parseInt(user.userId, 10)

    // 소유권 검증 (그룹인 경우)
    if (ownerType === 'GROUP') {
      const ownershipResult = await verifyCategoryOwnership(
        user.userId,
        ownerType,
        ownerId.toString()
      )

      if (!ownershipResult.isValid) {
        return NextResponse.json(
          { error: ownershipResult.error || '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
          { status: 403 }
        )
      }
    }

    // 기본 카테고리가 없으면 시드 데이터 생성
    const defaultCategoryCount = await prisma.category.count({
      where: {
        ownerType: 'USER',
        ownerId: BigInt(0),
        isDefault: true,
      },
    })

    if (defaultCategoryCount === 0) {
      await seedDefaultCategories()
    }

    // 사용 가능한 카테고리 목록 조회
    const categories = await getAvailableCategories(ownerType, ownerId.toString(), query.type)

    // isDefault 필터 적용
    let filteredCategories = categories
    if (query.isDefault !== undefined) {
      filteredCategories = categories.filter(
        (category: any) => category.isDefault === query.isDefault
      )
    }

    // 응답 형태로 변환
    const categoryResponses: CategoryResponse[] = filteredCategories.map(formatCategoryForResponse)

    return NextResponse.json({
      categories: categoryResponses,
      count: filteredCategories.length,
    })
  } catch (error) {
    console.error('카테고리 목록 조회 중 오류:', error)
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
    // 인증 확인
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
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

    // 소유권 검증
    const ownershipResult = await verifyCategoryOwnership(
      user.userId,
      categoryData.ownerType,
      categoryData.ownerId.toString()
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        { error: ownershipResult.error || '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 중복 이름 검사 (같은 소유자 내에서 같은 타입)
    const existingCategory = await prisma.category.findFirst({
      where: {
        ownerType: categoryData.ownerType,
        ownerId: BigInt(categoryData.ownerId),
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
        ownerType: categoryData.ownerType,
        ownerId: BigInt(categoryData.ownerId),
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
    console.error('카테고리 생성 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
