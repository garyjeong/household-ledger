import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { updateTransactionSchema, formatTransactionForResponse } from '@/lib/schemas/transaction'

/**
 * PATCH /api/transactions/[id]
 * 거래 정보 수정
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const transactionId = id

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

    // 거래 존재 확인 및 소유권 검증
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: BigInt(transactionId) },
      include: {
        category: true,
        tag: true,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: '거래를 찾을 수 없습니다', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (existingTransaction.ownerUserId !== BigInt(user.userId)) {
      return NextResponse.json(
        { error: '거래 수정 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = updateTransactionSchema.safeParse({
      ...body,
      date: body.date ? new Date(body.date) : undefined,
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

    // 계좌 관련 검증 제거됨 - 단순화된 스키마

    // 카테고리가 변경되는 경우 검증
    if (
      updateData.categoryId &&
      updateData.categoryId !== existingTransaction.categoryId?.toString()
    ) {
      const newCategory = await prisma.category.findUnique({
        where: { id: BigInt(updateData.categoryId) },
      })

      if (!newCategory) {
        return NextResponse.json(
          { error: '새 카테고리를 찾을 수 없습니다', code: 'CATEGORY_NOT_FOUND' },
          { status: 404 }
        )
      }

      // 카테고리 타입과 거래 타입 일치 확인
      const transactionType = updateData.type || existingTransaction.type
      if (newCategory.type !== transactionType) {
        return NextResponse.json(
          { error: '카테고리 타입과 거래 타입이 일치하지 않습니다', code: 'TYPE_MISMATCH' },
          { status: 400 }
        )
      }
    }

    // 계좌 잔액 조정 계산
    // 간소화된 스키마에서는 계좌 잔액 계산이 비즈니스 로직에서 처리됨

    // 거래 정보 업데이트
    const prismaUpdateData: Record<string, unknown> = { ...updateData }
    if (updateData.amount !== undefined) {
      prismaUpdateData.amount = BigInt(updateData.amount)
    }
    // accountId 제거됨
    if (updateData.categoryId !== undefined) {
      prismaUpdateData.categoryId = BigInt(updateData.categoryId)
    }

    // 거래 정보 업데이트 (계좌 잔액은 비즈니스 로직에서 계산)
    const updatedTransaction = await prisma.transaction.update({
      where: { id: BigInt(transactionId) },
      data: prismaUpdateData,
      include: {
        category: {
          select: { id: true, name: true, color: true, type: true },
        },
        tag: {
          select: { id: true, name: true },
        },
      },
    })

    // 응답 형태로 변환
    const formattedTransaction = formatTransactionForResponse(updatedTransaction)

    return NextResponse.json({
      success: true,
      transaction: formattedTransaction,
      message: '거래가 성공적으로 수정되었습니다',
    })
  } catch (error: unknown) {
    console.error('Transaction update error:', error)
    return NextResponse.json(
      { error: '거래 수정 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions/[id]
 * 거래 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transactionId = id

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

    // 거래 존재 확인 및 소유권 검증
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: BigInt(transactionId) },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: '거래를 찾을 수 없습니다', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (existingTransaction.ownerUserId !== BigInt(user.userId)) {
      return NextResponse.json(
        { error: '거래 삭제 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 거래 삭제 (잔액은 비즈니스 로직에서 계산됨)
    await prisma.transaction.delete({
      where: { id: BigInt(transactionId) },
    })

    return NextResponse.json({
      success: true,
      message: '거래가 성공적으로 삭제되었습니다',
    })
  } catch (error: unknown) {
    console.error('Transaction deletion error:', error)
    return NextResponse.json(
      { error: '거래 삭제 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/transactions/[id]
 * 특정 거래 상세 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const transactionId = id

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

    // 거래 조회
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: BigInt(transactionId),
        ownerUserId: BigInt(user.userId), // 소유권 확인
      },
      include: {
        category: {
          select: { id: true, name: true, color: true, type: true },
        },
        tag: {
          select: { id: true, name: true },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: '거래를 찾을 수 없습니다', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 응답 형태로 변환
    const formattedTransaction = formatTransactionForResponse(transaction)

    return NextResponse.json({
      success: true,
      transaction: formattedTransaction,
    })
  } catch (error: unknown) {
    console.error('Transaction get error:', error)
    return NextResponse.json(
      { error: '거래 조회 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
