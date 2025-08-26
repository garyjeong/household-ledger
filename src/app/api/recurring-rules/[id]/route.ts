import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, verifyResourceOwnership } from '@/lib/auth'
import {
  updateRecurringRuleSchema,
  formatRecurringRuleForResponse,
} from '@/lib/schemas/recurring-rule'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/recurring-rules/[id]
 * 특정 고정 지출 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 인증 확인 (쿠키 기반)
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    const { id } = params

    // ID 유효성 검사
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: '올바른 고정 지출 ID가 필요합니다', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 고정 지출 규칙 조회
    const recurringRule = await prisma.recurringRule.findUnique({
      where: { id: BigInt(id) },
      include: {
        account: {
          select: { id: true, name: true, type: true },
        },
        category: {
          select: { id: true, name: true, color: true, type: true },
        },
      },
    })

    if (!recurringRule) {
      return NextResponse.json(
        { error: '고정 지출을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 소유권 검증
    const ownershipResult = await verifyResourceOwnership(
      user.userId,
      recurringRule.ownerType,
      recurringRule.ownerId.toString()
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        {
          error: ownershipResult.error || '접근 권한이 없습니다',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      )
    }

    // 응답 형태로 변환
    const formattedRule = formatRecurringRuleForResponse(recurringRule)

    return NextResponse.json({
      success: true,
      recurringRule: formattedRule,
    })
  } catch (error: unknown) {
    console.error('Recurring rule fetch error:', error)
    return NextResponse.json(
      { error: '고정 지출을 가져오는 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/recurring-rules/[id]
 * 특정 고정 지출 수정
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 인증 확인 (쿠키 기반)
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    const { id } = params

    // ID 유효성 검사
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: '올바른 고정 지출 ID가 필요합니다', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 기존 고정 지출 규칙 조회
    const existingRule = await prisma.recurringRule.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: '고정 지출을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 소유권 검증
    const ownershipResult = await verifyResourceOwnership(
      user.userId,
      existingRule.ownerType,
      existingRule.ownerId.toString()
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        {
          error: ownershipResult.error || '접근 권한이 없습니다',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = updateRecurringRuleSchema.safeParse({
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
    })

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

    // 계좌 변경 시 검증
    if (updateData.accountId && updateData.accountId !== existingRule.accountId.toString()) {
      const account = await prisma.account.findUnique({
        where: { id: BigInt(updateData.accountId) },
      })

      if (!account) {
        return NextResponse.json(
          { error: '계좌를 찾을 수 없습니다', code: 'ACCOUNT_NOT_FOUND' },
          { status: 404 }
        )
      }

      // 계좌 소유권 확인
      if (
        account.ownerType !== existingRule.ownerType ||
        account.ownerId.toString() !== existingRule.ownerId.toString()
      ) {
        return NextResponse.json(
          { error: '계좌에 대한 접근 권한이 없습니다', code: 'ACCOUNT_ACCESS_DENIED' },
          { status: 403 }
        )
      }
    }

    // 카테고리 변경 시 검증
    if (updateData.categoryId && updateData.categoryId !== existingRule.categoryId?.toString()) {
      const category = await prisma.category.findUnique({
        where: { id: BigInt(updateData.categoryId) },
      })

      if (!category) {
        return NextResponse.json(
          { error: '카테고리를 찾을 수 없습니다', code: 'CATEGORY_NOT_FOUND' },
          { status: 404 }
        )
      }

      // 카테고리 소유권 확인
      if (
        category.ownerType !== existingRule.ownerType ||
        category.ownerId.toString() !== existingRule.ownerId.toString()
      ) {
        return NextResponse.json(
          { error: '카테고리에 대한 접근 권한이 없습니다', code: 'CATEGORY_ACCESS_DENIED' },
          { status: 403 }
        )
      }
    }

    // 업데이트 데이터 준비
    const dataToUpdate: any = {}

    if (updateData.startDate !== undefined) dataToUpdate.startDate = updateData.startDate
    if (updateData.frequency !== undefined) dataToUpdate.frequency = updateData.frequency
    if (updateData.dayRule !== undefined) dataToUpdate.dayRule = updateData.dayRule
    if (updateData.amount !== undefined) dataToUpdate.amount = BigInt(updateData.amount)
    if (updateData.accountId !== undefined) dataToUpdate.accountId = BigInt(updateData.accountId)
    if (updateData.categoryId !== undefined) {
      dataToUpdate.categoryId = updateData.categoryId ? BigInt(updateData.categoryId) : null
    }
    if (updateData.merchant !== undefined) dataToUpdate.merchant = updateData.merchant || null
    if (updateData.memo !== undefined) dataToUpdate.memo = updateData.memo || null
    if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive

    // 고정 지출 규칙 업데이트
    const updatedRule = await prisma.recurringRule.update({
      where: { id: BigInt(id) },
      data: dataToUpdate,
      include: {
        account: {
          select: { id: true, name: true, type: true },
        },
        category: {
          select: { id: true, name: true, color: true, type: true },
        },
      },
    })

    // 응답 형태로 변환
    const formattedRule = formatRecurringRuleForResponse(updatedRule)

    return NextResponse.json({
      success: true,
      recurringRule: formattedRule,
      message: '고정 지출이 성공적으로 수정되었습니다',
    })
  } catch (error: unknown) {
    console.error('Recurring rule update error:', error)
    return NextResponse.json(
      { error: '고정 지출 수정 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recurring-rules/[id]
 * 특정 고정 지출 삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 인증 확인 (쿠키 기반)
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    const { id } = params

    // ID 유효성 검사
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: '올바른 고정 지출 ID가 필요합니다', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // 기존 고정 지출 규칙 조회
    const existingRule = await prisma.recurringRule.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: '고정 지출을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // 소유권 검증
    const ownershipResult = await verifyResourceOwnership(
      user.userId,
      existingRule.ownerType,
      existingRule.ownerId.toString()
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        {
          error: ownershipResult.error || '접근 권한이 없습니다',
          code: 'ACCESS_DENIED',
        },
        { status: 403 }
      )
    }

    // 고정 지출 규칙 삭제
    await prisma.recurringRule.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({
      success: true,
      message: '고정 지출이 성공적으로 삭제되었습니다',
    })
  } catch (error: unknown) {
    console.error('Recurring rule deletion error:', error)
    return NextResponse.json(
      { error: '고정 지출 삭제 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
