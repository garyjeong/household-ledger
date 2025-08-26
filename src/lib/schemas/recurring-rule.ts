import { z } from 'zod'

// RecurringRule 생성 스키마
export const createRecurringRuleSchema = z.object({
  ownerType: z.enum(['USER', 'GROUP'], {
    message: '소유자 타입은 USER 또는 GROUP이어야 합니다',
  }),
  ownerId: z.string().min(1, '소유자 ID가 필요합니다'),
  startDate: z.date({
    message: '시작 날짜가 필요합니다',
  }),
  frequency: z.enum(['MONTHLY', 'WEEKLY'], {
    message: '반복 주기는 MONTHLY 또는 WEEKLY여야 합니다',
  }),
  dayRule: z
    .string()
    .min(1, '날짜 규칙이 필요합니다')
    .max(20, '날짜 규칙은 20자 이하여야 합니다')
    .refine(
      (value) => {
        // D1-D31 (월별 특정일) 또는 MON, TUE, WED, THU, FRI, SAT, SUN (주별 특정요일)
        const monthlyPattern = /^D([1-9]|[12][0-9]|3[01])$/
        const weeklyPattern = /^(MON|TUE|WED|THU|FRI|SAT|SUN)$/
        return monthlyPattern.test(value) || weeklyPattern.test(value)
      },
      {
        message: '날짜 규칙은 D1-D31 또는 MON,TUE,WED,THU,FRI,SAT,SUN 형식이어야 합니다',
      }
    ),
  amount: z
    .number()
    .int('금액은 정수여야 합니다')
    .positive('금액은 양수여야 합니다')
    .max(999999999, '금액이 너무 큽니다'),
  accountId: z.string().min(1, '계좌 ID가 필요합니다'),
  categoryId: z.string().min(1, '카테고리 ID가 필요합니다').optional(),
  merchant: z.string().max(160, '상점명은 160자 이하여야 합니다').optional(),
  memo: z.string().max(1000, '메모는 1000자 이하여야 합니다').optional(),
  isActive: z.boolean().default(true),
})

// RecurringRule 업데이트 스키마 (모든 필드 선택적)
export const updateRecurringRuleSchema = createRecurringRuleSchema.partial()

// RecurringRule 조회 쿼리 스키마
export const recurringRuleQuerySchema = z.object({
  ownerType: z.enum(['USER', 'GROUP']).optional(),
  ownerId: z.string().optional(),
  frequency: z.enum(['MONTHLY', 'WEEKLY']).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    }),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, '페이지는 1 이상이어야 합니다'),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, '한 페이지당 항목은 1-100개여야 합니다'),
})

// 응답 포맷터
export function formatRecurringRuleForResponse(recurringRule: any) {
  return {
    id: recurringRule.id.toString(),
    ownerType: recurringRule.ownerType,
    ownerId: recurringRule.ownerId.toString(),
    startDate: recurringRule.startDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
    frequency: recurringRule.frequency,
    dayRule: recurringRule.dayRule,
    amount: Number(recurringRule.amount),
    accountId: recurringRule.accountId.toString(),
    categoryId: recurringRule.categoryId?.toString() || null,
    merchant: recurringRule.merchant,
    memo: recurringRule.memo,
    isActive: recurringRule.isActive,
    account: recurringRule.account
      ? {
          id: recurringRule.account.id.toString(),
          name: recurringRule.account.name,
          type: recurringRule.account.type,
        }
      : null,
    category: recurringRule.category
      ? {
          id: recurringRule.category.id.toString(),
          name: recurringRule.category.name,
          color: recurringRule.category.color,
          type: recurringRule.category.type,
        }
      : null,
  }
}

// 타입 정의
export type CreateRecurringRuleRequest = z.infer<typeof createRecurringRuleSchema>
export type UpdateRecurringRuleRequest = z.infer<typeof updateRecurringRuleSchema>
export type RecurringRuleQueryRequest = z.infer<typeof recurringRuleQuerySchema>
