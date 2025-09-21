import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { processRecurringRules, processRecurringRulesForDateRange } from '@/lib/recurring-scheduler'
import { z } from 'zod'

// 반복 거래 처리 요청 스키마
const processRequestSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '시작 날짜 형식이 올바르지 않습니다')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '종료 날짜 형식이 올바르지 않습니다')
    .optional(),
})

// 반복 거래 규칙 처리 (수동 실행)
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
    const validatedData = processRequestSchema.parse(body)

    let result

    if (validatedData.startDate && validatedData.endDate) {
      // 기간별 처리
      const startDate = new Date(validatedData.startDate)
      const endDate = new Date(validatedData.endDate)

      if (startDate > endDate) {
        return NextResponse.json(
          { error: '시작 날짜는 종료 날짜보다 이전이어야 합니다' },
          { status: 400 }
        )
      }

      // 최대 31일까지만 허용 (과도한 처리 방지)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 31) {
        return NextResponse.json(
          { error: '처리 기간은 최대 31일까지만 가능합니다' },
          { status: 400 }
        )
      }

      result = await processRecurringRulesForDateRange(startDate, endDate, decoded.userId)
    } else {
      // 단일 날짜 처리
      const targetDate = validatedData.date ? new Date(validatedData.date) : new Date()
      targetDate.setHours(0, 0, 0, 0)

      result = await processRecurringRules({
        date: targetDate,
        userId: decoded.userId,
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: '반복 거래 처리가 완료되었습니다',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 }
      )
    }

    console.error('반복 거래 처리 오류:', error)
    return NextResponse.json({ error: '반복 거래 처리에 실패했습니다' }, { status: 500 })
  }
}

// 오늘의 반복 거래 자동 처리 (크론잡 등에서 호출)
export async function GET(request: NextRequest) {
  try {
    // API 키 인증 (내부 시스템용)
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.RECURRING_SCHEDULER_API_KEY

    if (!expectedKey) {
      return NextResponse.json({ error: '스케줄러 API 키가 설정되지 않았습니다' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 오늘의 모든 반복 거래 처리
    const result = await processRecurringRules()

    return NextResponse.json({
      success: true,
      data: result,
      message: `오늘의 반복 거래 처리 완료: ${result.created}개 생성, ${result.skipped}개 건너뜀`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('자동 반복 거래 처리 오류:', error)
    return NextResponse.json({ error: '자동 반복 거래 처리에 실패했습니다' }, { status: 500 })
  }
}
