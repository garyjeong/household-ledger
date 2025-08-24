import { z } from 'zod'

// Transaction type enum
export const transactionTypes = ['EXPENSE', 'INCOME', 'TRANSFER'] as const

// Transaction creation schema
export const createTransactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'], {
    message: '올바른 거래 타입을 선택해주세요',
  }),
  date: z.date().max(new Date(), '미래 날짜는 입력할 수 없습니다'),
  amount: z
    .number()
    .int('금액은 정수여야 합니다')
    .positive('금액은 양수여야 합니다')
    .max(999999999, '금액이 너무 큽니다'),
  accountId: z.string().min(1, '계좌를 선택해주세요'),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  merchant: z.string().max(160, '가맹점명은 160자 이하로 입력해주세요').optional(),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해주세요').optional(),
})

// Transaction update schema (모든 필드 선택적)
export const updateTransactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).optional(),
  date: z.date().max(new Date()).optional(),
  amount: z.number().int().positive().max(999999999).optional(),
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  merchant: z.string().max(160).optional(),
  memo: z.string().max(1000).optional(),
})

// Transaction query schema (검색 및 필터링)
export const transactionQuerySchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  search: z.string().max(100).optional(), // 메모, 가맹점 검색
  page: z
    .string()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100)),
})

// Bulk import schema
export const bulkImportSchema = z.object({
  transactions: z.array(createTransactionSchema).min(1).max(100),
})

// Quick Add form validation schema
export const quickAddSchema = z.object({
  date: z.date().max(new Date(), '미래 날짜는 입력할 수 없습니다'),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'], {
    message: '거래 타입을 선택해주세요',
  }),
  amount: z
    .string()
    .min(1, '금액을 입력해주세요')
    .regex(/^\d+$/, '금액은 숫자만 입력할 수 있습니다')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(999999999)),
  categoryId: z.string().min(1, '카테고리를 선택해주세요'),
  accountId: z.string().min(1, '계좌를 선택해주세요'),
  memo: z.string().max(1000, '메모는 1000자 이하로 입력해주세요').optional(),
})

// 타입 추출
export type CreateTransactionData = z.infer<typeof createTransactionSchema>
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>
export type TransactionQuery = z.infer<typeof transactionQuerySchema>
export type QuickAddData = z.infer<typeof quickAddSchema>
export type BulkImportData = z.infer<typeof bulkImportSchema>

// 거래 응답 타입 (BigInt를 string으로 변환)
export type TransactionResponse = {
  id: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  date: string // ISO string
  amount: string
  account: {
    id: string
    name: string
    type: 'CASH' | 'CARD' | 'BANK' | 'OTHER'
  }
  category: {
    id: string
    name: string
    color?: string
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  }
  merchant?: string
  memo?: string
  createdAt: string
  updatedAt: string
}

// BigInt를 string으로 변환하는 헬퍼 함수
export function formatTransactionForResponse(transaction: {
  id: bigint
  type: string
  date: Date
  amount: bigint
  account: {
    id: bigint
    name: string
    type: string
  }
  category: {
    id: bigint
    name: string
    color?: string | null
    type: string
  } | null
  merchant?: string | null
  memo?: string | null
  createdAt: Date
  updatedAt: Date
}): TransactionResponse {
  return {
    id: transaction.id.toString(),
    type: transaction.type as 'EXPENSE' | 'INCOME' | 'TRANSFER',
    date: transaction.date.toISOString(),
    amount: transaction.amount.toString(),
    account: {
      id: transaction.account.id.toString(),
      name: transaction.account.name,
      type: transaction.account.type as 'CASH' | 'CARD' | 'BANK' | 'OTHER',
    },
    category: transaction.category
      ? {
          id: transaction.category.id.toString(),
          name: transaction.category.name,
          color: transaction.category.color || undefined,
          type: transaction.category.type as 'EXPENSE' | 'INCOME' | 'TRANSFER',
        }
      : {
          id: '0',
          name: 'Unknown Category',
          type: 'EXPENSE' as const,
        },
    merchant: transaction.merchant || undefined,
    memo: transaction.memo || undefined,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  }
}

// 금액 포맷팅 헬퍼
export function formatAmount(amount: number | string): string {
  const num = typeof amount === 'string' ? parseInt(amount, 10) : amount
  return num.toLocaleString('ko-KR') + '원'
}

// 거래 타입별 색상 클래스 (Tailwind)
export function getTransactionTypeColor(type: 'EXPENSE' | 'INCOME' | 'TRANSFER'): string {
  switch (type) {
    case 'EXPENSE':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'INCOME':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'TRANSFER':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// 거래 타입 한글 라벨
export function getTransactionTypeLabel(type: 'EXPENSE' | 'INCOME' | 'TRANSFER'): string {
  switch (type) {
    case 'EXPENSE':
      return '지출'
    case 'INCOME':
      return '수입'
    case 'TRANSFER':
      return '이체'
    default:
      return '기타'
  }
}
