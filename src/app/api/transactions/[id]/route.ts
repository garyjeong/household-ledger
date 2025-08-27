import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader, verifyAccountOwnership } from '@/lib/auth'
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
        account: true,
        category: true,
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

    // 계좌가 변경되는 경우 새 계좌 소유권 검증
    if (updateData.accountId && updateData.accountId !== existingTransaction.accountId.toString()) {
      const newAccount = await prisma.account.findUnique({
        where: { id: BigInt(updateData.accountId) },
      })

      if (!newAccount) {
        return NextResponse.json(
          { error: '새 계좌를 찾을 수 없습니다', code: 'ACCOUNT_NOT_FOUND' },
          { status: 404 }
        )
      }

      const accountOwnershipResult = await verifyAccountOwnership(
        user.userId,
        newAccount.ownerType,
        newAccount.ownerId.toString()
      )

      if (!accountOwnershipResult.isValid) {
        return NextResponse.json(
          {
            error: accountOwnershipResult.error || '새 계좌 접근 권한이 없습니다',
            code: 'ACCESS_DENIED',
          },
          { status: 403 }
        )
      }
    }

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
    const oldAmount = existingTransaction.amount
    const newAmount = updateData.amount ? BigInt(updateData.amount) : oldAmount
    const oldAccountId = existingTransaction.accountId
    const newAccountId = updateData.accountId ? BigInt(updateData.accountId) : oldAccountId
    const oldType = existingTransaction.type
    const newType = updateData.type || oldType

    // 이전 거래의 잔액 변화를 되돌림
    const oldBalanceChange = oldType === 'EXPENSE' ? oldAmount : -oldAmount

    // 새 거래의 잔액 변화 계산
    const newBalanceChange = newType === 'EXPENSE' ? -newAmount : newAmount

    // 거래 정보 업데이트
    const prismaUpdateData: Record<string, unknown> = { ...updateData }
    if (updateData.amount !== undefined) {
      prismaUpdateData.amount = BigInt(updateData.amount)
    }
    if (updateData.accountId !== undefined) {
      prismaUpdateData.accountId = BigInt(updateData.accountId)
    }
    if (updateData.categoryId !== undefined) {
      prismaUpdateData.categoryId = BigInt(updateData.categoryId)
    }

    const updatedTransaction = await prisma.$transaction(async tx => {
      // 거래 정보 업데이트
      const transaction = await tx.transaction.update({
        where: { id: BigInt(transactionId) },
        data: prismaUpdateData,
        include: {
          account: {
            select: { id: true, name: true, type: true },
          },
          category: {
            select: { id: true, name: true, color: true, type: true },
          },
        },
      })

      // 계좌 잔액 조정
      if (oldAccountId === newAccountId) {
        // 같은 계좌인 경우: 기존 영향을 취소하고 새 영향 적용
        await tx.account.update({
          where: { id: oldAccountId },
          data: {
            balance: {
              increment: oldBalanceChange + newBalanceChange,
            },
          },
        })
      } else {
        // 다른 계좌인 경우: 기존 계좌에서 취소, 새 계좌에 적용
        await tx.account.update({
          where: { id: oldAccountId },
          data: {
            balance: {
              increment: oldBalanceChange,
            },
          },
        })

        await tx.account.update({
          where: { id: newAccountId },
          data: {
            balance: {
              increment: newBalanceChange,
            },
          },
        })
      }

      return transaction
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
      include: {
        account: true,
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
        { error: '거래 삭제 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 계좌 잔액 복구를 위한 계산
    const balanceChange =
      existingTransaction.type === 'EXPENSE'
        ? existingTransaction.amount // 지출 취소 → 잔액 증가
        : -existingTransaction.amount // 수입 취소 → 잔액 감소

    // 거래 삭제 및 계좌 잔액 복구
    await prisma.$transaction(async tx => {
      // 거래 삭제
      await tx.transaction.delete({
        where: { id: BigInt(transactionId) },
      })

      // 계좌 잔액 복구
      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      })
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
        account: {
          select: { id: true, name: true, type: true },
        },
        category: {
          select: { id: true, name: true, color: true, type: true },
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
