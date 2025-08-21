import { z } from 'zod'

// Account 타입 정의
export const accountTypes = ['CASH', 'CARD', 'BANK', 'OTHER'] as const
export const ownerTypes = ['USER', 'GROUP'] as const

// 계좌 생성 스키마
export const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, '계좌명을 입력해주세요')
    .max(120, '계좌명은 120자 이하로 입력해주세요')
    .trim(),
  type: z.enum(['CASH', 'CARD', 'BANK', 'OTHER'], {
    errorMap: () => ({ message: '올바른 계좌 타입을 선택해주세요' }),
  }),
  currency: z.string().length(3, '통화 코드는 3자리여야 합니다').default('KRW').optional(),
  balance: z
    .number()
    .int('잔액은 정수여야 합니다')
    .min(-9999999999, '잔액이 너무 작습니다')
    .max(9999999999, '잔액이 너무 큽니다')
    .default(0)
    .optional(),
  ownerType: z.enum(['USER', 'GROUP'], {
    errorMap: () => ({ message: '소유자 타입을 선택해주세요' }),
  }),
  ownerId: z.number().int().positive('소유자 ID는 양수여야 합니다'),
})

// 계좌 수정 스키마 (모든 필드 선택적)
export const updateAccountSchema = z.object({
  name: z
    .string()
    .min(1, '계좌명을 입력해주세요')
    .max(120, '계좌명은 120자 이하로 입력해주세요')
    .trim()
    .optional(),
  type: z
    .enum(['CASH', 'CARD', 'BANK', 'OTHER'], {
      errorMap: () => ({ message: '올바른 계좌 타입을 선택해주세요' }),
    })
    .optional(),
  currency: z.string().length(3, '통화 코드는 3자리여야 합니다').optional(),
  balance: z
    .number()
    .int('잔액은 정수여야 합니다')
    .min(-9999999999, '잔액이 너무 작습니다')
    .max(9999999999, '잔액이 너무 큽니다')
    .optional(),
  isActive: z.boolean().optional(),
})

// 계좌 조회 스키마 (쿼리 파라미터)
export const accountQuerySchema = z.object({
  ownerType: z.enum(['USER', 'GROUP']).optional(),
  ownerId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional(),
  type: z.enum(['CASH', 'CARD', 'BANK', 'OTHER']).optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  currency: z.string().length(3).optional(),
})

// 타입 추출
export type CreateAccountData = z.infer<typeof createAccountSchema>
export type UpdateAccountData = z.infer<typeof updateAccountSchema>
export type AccountQuery = z.infer<typeof accountQuerySchema>

// 계좌 응답 타입 (BigInt를 string으로 변환)
export type AccountResponse = {
  id: string
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  name: string
  type: 'CASH' | 'CARD' | 'BANK' | 'OTHER'
  currency: string
  balance: string
  isActive: boolean
}

// BigInt를 string으로 변환하는 헬퍼 함수
export function formatAccountForResponse(account: any): AccountResponse {
  return {
    id: account.id.toString(),
    ownerType: account.ownerType,
    ownerId: account.ownerId.toString(),
    name: account.name,
    type: account.type,
    currency: account.currency,
    balance: account.balance.toString(),
    isActive: account.isActive,
  }
}
