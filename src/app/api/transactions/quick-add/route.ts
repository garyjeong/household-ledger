import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Quick Add Transaction Schema
const quickAddTransactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME'], {
    message: '올바른 거래 타입을 선택해주세요',
  }),
  amount: z
    .number()
    .int('금액은 정수여야 합니다')
    .positive('금액은 양수여야 합니다')
    .max(999999999, '금액이 너무 큽니다'),
  categoryName: z
    .string()
    .min(1, '카테고리를 입력해주세요')
    .max(50, '카테고리명은 50자 이하로 입력해주세요'),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해주세요').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  groupId: z.string().min(1, '그룹 ID가 필요합니다'),
})

/**
 * POST /api/transactions/quick-add
 * 빠른 거래 추가 (카테고리 자동 생성, 기본 계좌 사용)
 */
export async function POST(request: NextRequest) {
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

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = quickAddTransactionSchema.safeParse(body)

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

    const { type, amount, categoryName, memo, date, groupId } = validationResult.data

    // 그룹 멤버십 확인
    const groupMember = await prisma.groupMember.findFirst({
      where: {
        groupId: BigInt(groupId),
        userId: BigInt(user.userId),
      },
      include: {
        group: true,
      },
    })

    if (!groupMember) {
      return NextResponse.json(
        { error: '그룹에 접근 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 그룹의 기본 계좌 찾기 또는 생성
    let account = await prisma.account.findFirst({
      where: {
        ownerType: 'GROUP',
        ownerId: BigInt(groupId),
      },
      orderBy: {
        id: 'asc', // 가장 먼저 생성된 계좌 사용 (createdAt 대신 id 사용)
      },
    })

    if (!account) {
      // 기본 계좌 생성
      account = await prisma.account.create({
        data: {
          name: '기본 계좌',
          type: 'CASH',
          balance: BigInt(0),
          currency: 'KRW',
          ownerType: 'GROUP',
          ownerId: BigInt(groupId),
        },
      })
    }

    // 카테고리 찾기 또는 생성
    let category = await prisma.category.findFirst({
      where: {
        name: categoryName,
        type: type,
        ownerType: 'GROUP',
        ownerId: BigInt(groupId),
      },
    })

    if (!category) {
      // 새 카테고리 생성
      const colors = [
        '#ef4444',
        '#f97316',
        '#eab308',
        '#22c55e',
        '#06b6d4',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
      ]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      category = await prisma.category.create({
        data: {
          name: categoryName,
          type: type,
          color: randomColor,
          ownerType: 'GROUP',
          ownerId: BigInt(groupId),
        },
      })
    }

    // 거래 생성
    const newTransaction = await prisma.transaction.create({
      data: {
        type: type,
        date: new Date(date),
        amount: BigInt(amount),
        accountId: account.id,
        categoryId: category.id,
        memo: memo || null,
        ownerUserId: BigInt(user.userId),
        groupId: BigInt(groupId),
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

    // 계좌 잔액 업데이트
    const balanceChange = type === 'EXPENSE' ? -BigInt(amount) : BigInt(amount)

    await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: {
          increment: balanceChange,
        },
      },
    })

    // 응답 형태로 변환
    const formattedTransaction = {
      id: newTransaction.id.toString(),
      type: newTransaction.type,
      date: newTransaction.date.toISOString(),
      amount: newTransaction.amount.toString(),
      account: {
        id: newTransaction.account.id.toString(),
        name: newTransaction.account.name,
        type: newTransaction.account.type,
      },
      category: newTransaction.category
        ? {
            id: newTransaction.category.id.toString(),
            name: newTransaction.category.name,
            color: newTransaction.category.color,
            type: newTransaction.category.type,
          }
        : null,
      memo: newTransaction.memo,
      createdAt: newTransaction.createdAt.toISOString(),
      updatedAt: newTransaction.updatedAt.toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        transaction: formattedTransaction,
        message: '거래가 성공적으로 추가되었습니다',
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Quick add transaction error:', error)
    return NextResponse.json(
      { error: '거래 생성 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
