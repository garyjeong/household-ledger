import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCookieToken } from '@/lib/auth'
import { getAvailableCategories } from '@/lib/seed-categories'
import { formatCategoryForResponse, createCategorySchema } from '@/lib/schemas/category'

/**
 * GET /api/categories
 * 카테고리 목록 조회 (기본 카테고리 + 그룹별 커스텀 카테고리)
 */
export async function GET(request: NextRequest) {
  try {
    // console.log('🔍 Categories API 호출됨')

    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      // console.log('❌ 액세스 토큰이 없습니다')
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // console.log('🔐 토큰 검증 시작')
    const user = await verifyCookieToken(accessToken)
    if (!user) {
      // console.log('❌ 토큰 검증 실패')
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }
    // console.log('👤 사용자 검증 성공:', user.userId)

    // 사용자의 그룹 정보 가져오기
    // console.log('📊 사용자 데이터 조회 시작')
    const userData = await prisma.user.findUnique({
      where: { id: BigInt(user!.userId) },
      select: { groupId: true },
    })
    // console.log('📊 사용자 데이터 조회 완료:', userData)

    const groupId = userData?.groupId?.toString() || null

    // URL 파라미터에서 거래 타입 필터 가져오기
    const url = new URL(request.url)
    const typeParam = url.searchParams.get('type')
    const transactionType =
      typeParam && ['EXPENSE', 'INCOME', 'TRANSFER'].includes(typeParam.toUpperCase())
        ? (typeParam.toUpperCase() as 'EXPENSE' | 'INCOME' | 'TRANSFER')
        : undefined

    // console.log('🔍 그룹 ID:', groupId, '거래 타입 필터:', transactionType)

    // 사용 가능한 카테고리 조회 (기본 + 그룹 커스텀)
    // console.log('📂 카테고리 조회 시작')
    const categories = await getAvailableCategories(groupId, transactionType)
    // console.log('📂 카테고리 조회 완료:', categories.length, '개')

    // 응답 형식에 맞게 변환
    const formattedCategories = categories.map(category => formatCategoryForResponse(category))

    // console.log('✅ 카테고리 조회 성공:', formattedCategories.length, '개')

    return NextResponse.json({
      categories: formattedCategories,
      totalCount: formattedCategories.length,
      userId: user.userId,
      groupId,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('❌ Categories API 에러:', error)
    return NextResponse.json(
      { error: '카테고리를 불러오는데 실패했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * 새 카테고리 생성
 */
export async function POST(request: NextRequest) {
  try {
    // console.log('🔧 카테고리 생성 API 호출됨')

    // 토큰 검증
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyCookieToken(accessToken)
    // console.log('👤 사용자 검증 성공:', user.userId)

    // 사용자의 그룹 정보 가져오기
    const userData = await prisma.user.findUnique({
      where: { id: BigInt(user!.userId) },
      select: { groupId: true },
    })

    const userGroupId = userData?.groupId || null

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

    const { name, type, color, groupId } = validationResult.data

    // 그룹 카테고리를 생성하려는 경우, 사용자가 해당 그룹에 속해있는지 확인
    let targetGroupId: bigint | null = null
    if (groupId !== undefined && groupId !== null) {
      if (userGroupId && userGroupId.toString() === groupId.toString()) {
        targetGroupId = BigInt(groupId)
      } else {
        return NextResponse.json(
          { error: '해당 그룹에 카테고리를 생성할 권한이 없습니다', code: 'ACCESS_DENIED' },
          { status: 403 }
        )
      }
    } else {
      // 그룹 ID가 지정되지 않았다면 사용자의 현재 그룹에 생성
      targetGroupId = userGroupId
    }

    // console.log('🎯 대상 그룹 ID:', targetGroupId?.toString() || 'null')

    // 중복 이름 검사 (같은 그룹 내에서 같은 타입의 카테고리명 중복 불가)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        groupId: targetGroupId,
        name,
        type,
      },
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: '이미 존재하는 카테고리명입니다', code: 'DUPLICATE_NAME' },
        { status: 409 }
      )
    }

    // 카테고리 생성
    const newCategory = await prisma.category.create({
      data: {
        groupId: targetGroupId,
        createdBy: BigInt(user!.userId),
        name,
        type,
        color: color || '#6B7280', // 기본 색상
        isDefault: false,
        budgetAmount: BigInt(0), // 기본 예산 0
      },
    })

    // console.log('✅ 카테고리 생성 성공:', newCategory.id.toString())

    return NextResponse.json(
      {
        message: '카테고리가 성공적으로 생성되었습니다',
        category: formatCategoryForResponse(newCategory),
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('❌ 카테고리 생성 중 오류:', error)

    // Prisma 에러 처리
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            error: '이미 존재하는 카테고리명입니다',
            code: 'DUPLICATE_NAME',
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: '카테고리 생성 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
