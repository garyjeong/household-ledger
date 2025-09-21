import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RecurringFrequency } from '@prisma/client'
import { z } from 'zod'

// 반복 거래 규칙 수정 스키마
const updateRecurringRuleSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .optional(),
  frequency: z.enum(['MONTHLY', 'WEEKLY', 'DAILY']).optional(),
  dayRule: z.string().max(20, '날짜 규칙은 20자 이하여야 합니다').optional(),
  amount: z.number().positive('금액은 0보다 커야 합니다').optional(),
  categoryId: z.string().optional(),
  merchant: z.string().max(160, '가맹점명은 160자 이하여야 합니다').optional(),
  memo: z.string().max(1000, '메모는 1000자 이하여야 합니다').optional(),
  isActive: z.boolean().optional(),
})

// 반복 거래 규칙 상세 조회
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // 반복 거래 규칙 조회
    const recurringRule = await prisma.recurringRule.findFirst({
      where: {
        id: BigInt(ruleId),
        createdBy: BigInt(decoded.userId),
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

    if (!recurringRule) {
      return NextResponse.json({ error: '반복 거래 규칙을 찾을 수 없습니다' }, { status: 404 })
    }

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
      group: recurringRule.group
        ? {
            ...recurringRule.group,
            id: recurringRule.group.id.toString(),
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      data: serializedRule,
    })
  } catch (error) {
    console.error('반복 거래 규칙 조회 오류:', error)
    return NextResponse.json({ error: '반복 거래 규칙 조회에 실패했습니다' }, { status: 500 })
  }
}

// 반복 거래 규칙 수정
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // 요청 데이터 검증
    const body = await request.json()
    const validatedData = updateRecurringRuleSchema.parse(body)

    // 기존 반복 거래 규칙 확인
    const existingRule = await prisma.recurringRule.findFirst({
      where: {
        id: BigInt(ruleId),
        createdBy: BigInt(decoded.userId),
      },
    })

    if (!existingRule) {
      return NextResponse.json({ error: '반복 거래 규칙을 찾을 수 없습니다' }, { status: 404 })
    }

    // 카테고리 존재 확인 (변경하는 경우)
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: BigInt(validatedData.categoryId) },
      })
      if (!category) {
        return NextResponse.json({ error: '존재하지 않는 카테고리입니다' }, { status: 400 })
      }
    }

    // 반복 거래 규칙 수정
    const updatedRule = await prisma.recurringRule.update({
      where: { id: BigInt(ruleId) },
      data: {
        ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
        ...(validatedData.frequency && {
          frequency: validatedData.frequency as RecurringFrequency,
        }),
        ...(validatedData.dayRule && { dayRule: validatedData.dayRule }),
        ...(validatedData.amount && { amount: BigInt(validatedData.amount * 100) }),
        ...(validatedData.categoryId !== undefined && {
          categoryId: validatedData.categoryId ? BigInt(validatedData.categoryId) : null,
        }),
        ...(validatedData.merchant !== undefined && { merchant: validatedData.merchant }),
        ...(validatedData.memo !== undefined && { memo: validatedData.memo }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
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
      ...updatedRule,
      id: updatedRule.id.toString(),
      groupId: updatedRule.groupId?.toString() || null,
      createdBy: updatedRule.createdBy.toString(),
      amount: updatedRule.amount.toString(),
      categoryId: updatedRule.categoryId?.toString() || null,
      category: updatedRule.category
        ? {
            ...updatedRule.category,
            id: updatedRule.category.id.toString(),
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      data: serializedRule,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      )
    }

    console.error('반복 거래 규칙 수정 오류:', error)
    return NextResponse.json({ error: '반복 거래 규칙 수정에 실패했습니다' }, { status: 500 })
  }
}

// 반복 거래 규칙 삭제
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // 기존 반복 거래 규칙 확인
    const existingRule = await prisma.recurringRule.findFirst({
      where: {
        id: BigInt(ruleId),
        createdBy: BigInt(decoded.userId),
      },
    })

    if (!existingRule) {
      return NextResponse.json({ error: '반복 거래 규칙을 찾을 수 없습니다' }, { status: 404 })
    }

    // 반복 거래 규칙 삭제
    await prisma.recurringRule.delete({
      where: { id: BigInt(ruleId) },
    })

    return NextResponse.json({
      success: true,
      message: '반복 거래 규칙이 삭제되었습니다',
    })
  } catch (error) {
    console.error('반복 거래 규칙 삭제 오류:', error)
    return NextResponse.json({ error: '반복 거래 규칙 삭제에 실패했습니다' }, { status: 500 })
  }
}
