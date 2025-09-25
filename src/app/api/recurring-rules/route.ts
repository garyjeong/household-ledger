import { NextRequest, NextResponse } from 'next/server'
import { RecurringFrequency } from '@prisma/client'
import { z } from 'zod'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 반복 거래 규칙 생성 스키마
const createRecurringRuleSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
  frequency: z.enum(['MONTHLY', 'WEEKLY', 'DAILY']),
  dayRule: z.string().max(20, '날짜 규칙은 20자 이하여야 합니다'),
  amount: z.number().positive('금액은 0보다 커야 합니다'),
  categoryId: z.string().optional(),
  merchant: z.string().max(160, '가맹점명은 160자 이하여야 합니다').optional(),
  memo: z.string().max(1000, '메모는 1000자 이하여야 합니다').optional(),
})

// 반복 거래 규칙 조회
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const groupId = searchParams.get('groupId')

    // 반복 거래 규칙 조회
    const recurringRules = await prisma.recurringRule.findMany({
      where: {
        createdBy: BigInt(decoded.userId),
        ...(isActive !== null && { isActive: isActive === 'true' }),
        ...(groupId && { groupId: BigInt(groupId) }),
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
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })

    // BigInt를 string으로 변환
    const serializedRules = recurringRules.map(rule => ({
      ...rule,
      id: rule.id.toString(),
      groupId: rule.groupId?.toString() || null,
      createdBy: rule.createdBy.toString(),
      amount: rule.amount.toString(),
      categoryId: rule.categoryId?.toString() || null,
      category: rule.category
        ? {
            ...rule.category,
            id: rule.category.id.toString(),
          }
        : null,
      group: rule.group
        ? {
            ...rule.group,
            id: rule.group.id.toString(),
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      data: serializedRules,
    })
  } catch (error) {
    console.error('반복 거래 규칙 조회 오류:', error)
    return NextResponse.json({ error: '반복 거래 규칙 조회에 실패했습니다' }, { status: 500 })
  }
}

// 반복 거래 규칙 생성
export async function POST(request: NextRequest) {
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

    // 요청 데이터 검증
    const body = await request.json()
    const validatedData = createRecurringRuleSchema.parse(body)

    // 카테고리 존재 확인 (선택사항)
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: BigInt(validatedData.categoryId) },
      })
      if (!category) {
        return NextResponse.json({ error: '존재하지 않는 카테고리입니다' }, { status: 400 })
      }
    }

    // 사용자의 현재 그룹 확인
    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.userId) },
      select: { groupId: true },
    })

    // 반복 거래 규칙 생성
    const recurringRule = await prisma.recurringRule.create({
      data: {
        groupId: user?.groupId || null,
        createdBy: BigInt(decoded.userId),
        startDate: new Date(validatedData.startDate),
        frequency: validatedData.frequency as RecurringFrequency,
        dayRule: validatedData.dayRule,
        amount: BigInt(validatedData.amount * 100), // 원 단위를 센트 단위로 변환
        categoryId: validatedData.categoryId ? BigInt(validatedData.categoryId) : null,
        merchant: validatedData.merchant || null,
        memo: validatedData.memo || null,
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
      },
    })

    // BigInt를 string으로 변환
    const serializedRule = {
      ...recurringRule,
      id: recurringRule.id.toString(),
      groupId: recurringRule.groupId?.toString() || null,
      createdBy: recurringRule.createdBy.toString(),
      amount: recurringRule.amount.toString(),
      categoryId: recurringRule.categoryId?.toString() || null,
      category: recurringRule.category
        ? {
            ...recurringRule.category,
            id: recurringRule.category.id.toString(),
          }
        : null,
    }

    return NextResponse.json(
      {
        success: true,
        data: serializedRule,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      )
    }

    console.error('반복 거래 규칙 생성 오류:', error)
    return NextResponse.json({ error: '반복 거래 규칙 생성에 실패했습니다' }, { status: 500 })
  }
}
