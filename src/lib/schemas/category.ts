import { z } from 'zod'

// Transaction 타입 정의 (Category에서 사용)
export const transactionTypes = ['EXPENSE', 'INCOME', 'TRANSFER'] as const
export const ownerTypes = ['USER', 'GROUP'] as const

// 색상 hex 코드 검증 패턴
const hexColorPattern = /^#[0-9A-Fa-f]{6}$/

// 카테고리 생성 스키마
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, '카테고리명을 입력해주세요')
    .max(120, '카테고리명은 120자 이하로 입력해주세요')
    .trim(),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'], {
    message: '올바른 거래 타입을 선택해주세요',
  }),
  color: z
    .string()
    .regex(hexColorPattern, '올바른 색상 코드를 입력해주세요 (예: #FF5733)')
    .optional(),
  ownerType: z.enum(['USER', 'GROUP'], {
    message: '소유자 타입을 선택해주세요',
  }),
  ownerId: z.number().int().positive('소유자 ID는 양수여야 합니다'),
})

// 카테고리 수정 스키마 (isDefault는 수정 불가)
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, '카테고리명을 입력해주세요')
    .max(120, '카테고리명은 120자 이하로 입력해주세요')
    .trim()
    .optional(),
  type: z
    .enum(['EXPENSE', 'INCOME', 'TRANSFER'], {
      message: '올바른 거래 타입을 선택해주세요',
    })
    .optional(),
  color: z
    .string()
    .regex(hexColorPattern, '올바른 색상 코드를 입력해주세요 (예: #FF5733)')
    .optional(),
})

// 카테고리 조회 스키마 (쿼리 파라미터)
export const categoryQuerySchema = z.object({
  ownerType: z.enum(['USER', 'GROUP']).optional(),
  ownerId: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().optional()),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']).optional(),
  isDefault: z
    .string()
    .optional()
    .transform(val => (val ? val === 'true' : undefined))
    .pipe(z.boolean().optional()),
})

// 타입 추출
export type CreateCategoryData = z.infer<typeof createCategorySchema>
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>
export type CategoryQuery = z.infer<typeof categoryQuerySchema>

// 카테고리 응답 타입 (BigInt를 string으로 변환)
export type CategoryResponse = {
  id: string
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  name: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  color: string | null
  isDefault: boolean
}

// BigInt를 string으로 변환하는 헬퍼 함수
export function formatCategoryForResponse(category: any): CategoryResponse {
  return {
    id: category.id.toString(),
    ownerType: category.ownerType,
    ownerId: category.ownerId.toString(),
    name: category.name,
    type: category.type,
    color: category.color,
    isDefault: category.isDefault,
  }
}

// 기본 카테고리 데이터 정의
export const defaultCategories = [
  // 지출 카테고리
  { name: '식비', type: 'EXPENSE' as const, color: '#10B981' }, // emerald
  { name: '교통', type: 'EXPENSE' as const, color: '#3B82F6' }, // blue
  { name: '주거', type: 'EXPENSE' as const, color: '#8B5CF6' }, // violet
  { name: '공과금', type: 'EXPENSE' as const, color: '#F59E0B' }, // amber
  { name: '의료', type: 'EXPENSE' as const, color: '#EF4444' }, // red
  { name: '교육', type: 'EXPENSE' as const, color: '#6366F1' }, // indigo
  { name: '취미', type: 'EXPENSE' as const, color: '#EC4899' }, // pink
  { name: '쇼핑', type: 'EXPENSE' as const, color: '#84CC16' }, // lime
  { name: '기타', type: 'EXPENSE' as const, color: '#6B7280' }, // gray

  // 수입 카테고리
  { name: '급여', type: 'INCOME' as const, color: '#059669' }, // emerald-700
  { name: '용돈', type: 'INCOME' as const, color: '#7C3AED' }, // violet-600
  { name: '투자', type: 'INCOME' as const, color: '#DC2626' }, // red-600
  { name: '기타수입', type: 'INCOME' as const, color: '#4B5563' }, // gray-600

  // 이체 카테고리
  { name: '계좌이체', type: 'TRANSFER' as const, color: '#374151' }, // gray-700
] as const
