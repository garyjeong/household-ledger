import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TransactionType } from '@prisma/client'

// 반복 거래 규칙에서 실제 거래 생성
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 인증 확인
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const decoded = await verifyAccessToken(accessToken)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 })
    }

    const ruleId = params.id
    const body = await request.json()
    const { date } = body // 생성할 거래의 날짜

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: '올바른 날짜를 입력해주세요' }, { status: 400 })
    }

    // 반복 거래 규칙 조회
    const recurringRule = await prisma.recurringRule.findFirst({
      where: {
        id: BigInt(ruleId),
        createdBy: BigInt(decoded.userId),
        isActive: true,
      },
      include: {
        category: true,
      },
    })

    if (!recurringRule) {
      return NextResponse.json({ error: '반복 거래 규칙을 찾을 수 없습니다' }, { status: 404 })
    }

    // 해당 날짜에 이미 생성된 거래가 있는지 확인
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        ownerUserId: BigInt(decoded.userId),
        date: new Date(date),
        amount: recurringRule.amount,
        categoryId: recurringRule.categoryId,
        merchant: recurringRule.merchant,
        memo: `${recurringRule.memo || ''} (자동 생성)`,
      },
    })

    if (existingTransaction) {
      return NextResponse.json(
        { error: '해당 날짜에 이미 동일한 거래가 존재합니다' },
        { status: 400 }
      )
    }

    // 거래 타입 결정 (카테고리 타입 기반)
    let transactionType: TransactionType = 'EXPENSE'
    if (recurringRule.category?.type === 'INCOME') {
      transactionType = 'INCOME'
    }

    // 실제 거래 생성
    const transaction = await prisma.transaction.create({
      data: {
        groupId: recurringRule.groupId,
        ownerUserId: BigInt(decoded.userId),
        type: transactionType,
        date: new Date(date),
        amount: recurringRule.amount,
        categoryId: recurringRule.categoryId,
        merchant: recurringRule.merchant,
        memo: `${recurringRule.memo || ''} (자동 생성)`,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // BigInt를 string으로 변환
    const serializedTransaction = {
      ...transaction,
      id: transaction.id.toString(),
      groupId: transaction.groupId?.toString() || null,
      ownerUserId: transaction.ownerUserId.toString(),
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId?.toString() || null,
      tagId: transaction.tagId?.toString() || null,
      category: transaction.category
        ? {
            ...transaction.category,
            id: transaction.category.id.toString(),
          }
        : null,
      group: transaction.group
        ? {
            ...transaction.group,
            id: transaction.group.id.toString(),
          }
        : null,
    }

    return NextResponse.json(
      {
        success: true,
        data: serializedTransaction,
        message: '반복 거래에서 실제 거래가 생성되었습니다',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('반복 거래 생성 오류:', error)
    return NextResponse.json({ error: '반복 거래 생성에 실패했습니다' }, { status: 500 })
  }
}
