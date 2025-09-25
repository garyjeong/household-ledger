import { TransactionType, RecurringFrequency } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * 반복 거래 스케줄러
 * - 활성화된 반복 거래 규칙을 기반으로 실제 거래 생성
 * - 다양한 반복 주기 지원 (매일, 매주, 매월)
 * - 중복 생성 방지
 */

interface ProcessRecurringRulesOptions {
  date?: Date
  ruleId?: string
  userId?: string
}

/**
 * 날짜 규칙 파싱 및 검증
 */
function shouldCreateTransaction(
  dayRule: string,
  frequency: RecurringFrequency,
  targetDate: Date,
  startDate: Date
): boolean {
  // 시작 날짜 이전에는 생성하지 않음
  if (targetDate < startDate) {
    return false
  }

  const day = targetDate.getDate()
  const dayOfWeek = targetDate.getDay() // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isWeekday = !isWeekend

  switch (frequency) {
    case 'DAILY':
      if (dayRule === '매일') return true
      if (dayRule === '평일만' && isWeekday) return true
      if (dayRule === '주말만' && isWeekend) return true
      return false

    case 'WEEKLY':
      const weekDays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
      return dayRule.includes(weekDays[dayOfWeek])

    case 'MONTHLY':
      if (dayRule === '매월 말일') {
        // 다음 달 1일에서 하루 뺀 날이 말일
        const nextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1)
        const lastDay = new Date(nextMonth.getTime() - 24 * 60 * 60 * 1000).getDate()
        return day === lastDay
      }

      // "매월 5일" 형태 파싱
      const dayMatch = dayRule.match(/매월 (\d+)일/)
      if (dayMatch) {
        const targetDay = parseInt(dayMatch[1])
        return day === targetDay
      }

      // "매월 첫째주 금요일" 등의 복잡한 규칙은 추후 구현
      return false

    default:
      return false
  }
}

/**
 * 특정 날짜에 대해 반복 거래 규칙 처리
 */
export async function processRecurringRules(options: ProcessRecurringRulesOptions = {}) {
  const { date = new Date(), ruleId, userId } = options

  try {
    console.log(`반복 거래 처리 시작: ${date.toISOString().split('T')[0]}`)

    // 활성화된 반복 거래 규칙 조회
    const whereClause: any = {
      isActive: true,
      startDate: {
        lte: date, // 시작 날짜가 오늘 이전 또는 오늘인 규칙들
      },
    }

    if (ruleId) {
      whereClause.id = BigInt(ruleId)
    }

    if (userId) {
      whereClause.createdBy = BigInt(userId)
    }

    const recurringRules = await prisma.recurringRule.findMany({
      where: whereClause,
      include: {
        category: true,
      },
    })

    console.log(`처리할 반복 거래 규칙: ${recurringRules.length}개`)

    let createdCount = 0
    let skippedCount = 0

    for (const rule of recurringRules) {
      try {
        // 날짜 규칙 검증
        if (!shouldCreateTransaction(rule.dayRule, rule.frequency, date, rule.startDate)) {
          continue
        }

        // 해당 날짜에 이미 동일한 거래가 있는지 확인
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            ownerUserId: rule.createdBy,
            date: date,
            amount: rule.amount,
            categoryId: rule.categoryId,
            merchant: rule.merchant,
            memo: {
              contains: '(자동 생성)',
            },
          },
        })

        if (existingTransaction) {
          skippedCount++
          console.log(
            `중복 거래 건너뜀: Rule ${rule.id.toString()}, Date: ${date.toISOString().split('T')[0]}`
          )
          continue
        }

        // 거래 타입 결정
        let transactionType: TransactionType = 'EXPENSE'
        if (rule.category?.type === 'INCOME') {
          transactionType = 'INCOME'
        }

        // 실제 거래 생성
        const transaction = await prisma.transaction.create({
          data: {
            groupId: rule.groupId,
            ownerUserId: rule.createdBy,
            type: transactionType,
            date: date,
            amount: rule.amount,
            categoryId: rule.categoryId,
            merchant: rule.merchant,
            memo: `${rule.memo || ''} (자동 생성)`.trim(),
          },
        })

        createdCount++
        console.log(
          `거래 생성 완료: ${transaction.id.toString()}, Amount: ${rule.amount.toString()}`
        )
      } catch (error) {
        console.error(`반복 거래 규칙 ${rule.id.toString()} 처리 오류:`, error)
      }
    }

    console.log(`반복 거래 처리 완료: 생성 ${createdCount}개, 건너뜀 ${skippedCount}개`)

    return {
      success: true,
      created: createdCount,
      skipped: skippedCount,
      total: recurringRules.length,
    }
  } catch (error) {
    console.error('반복 거래 처리 오류:', error)
    throw error
  }
}

/**
 * 특정 기간에 대해 반복 거래 일괄 처리
 */
export async function processRecurringRulesForDateRange(
  startDate: Date,
  endDate: Date,
  userId?: string
) {
  const results = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const result = await processRecurringRules({
      date: new Date(currentDate),
      userId,
    })

    results.push({
      date: currentDate.toISOString().split('T')[0],
      ...result,
    })

    // 다음 날로 이동
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return results
}

/**
 * 오늘의 반복 거래 처리 (스케줄러에서 호출)
 */
export async function processTodayRecurringRules() {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // 시간을 00:00:00으로 설정

  return await processRecurringRules({ date: today })
}
