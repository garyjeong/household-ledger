import { TrendingDown, TrendingUp, ArrowRightLeft, type LucideIcon } from 'lucide-react'

// 거래 타입 정의
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'

// 거래 타입별 아이콘 매핑
export const transactionTypeIcons: Record<TransactionType, LucideIcon> = {
  EXPENSE: TrendingDown,
  INCOME: TrendingUp,
  TRANSFER: ArrowRightLeft,
}

// 거래 타입별 한글 이름
export const transactionTypeLabels: Record<TransactionType, string> = {
  EXPENSE: '지출',
  INCOME: '수입',
  TRANSFER: '이체',
}

// 거래 타입별 색상 클래스 (Tailwind)
export const transactionTypeColors: Record<
  TransactionType,
  {
    bg: string
    text: string
    border: string
    icon: string
  }
> = {
  EXPENSE: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
  INCOME: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
  },
  TRANSFER: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'text-blue-600',
  },
}

// 브랜드 색상 팔레트 (카테고리 색상 선택용)
export const brandColorPalette = [
  { name: 'Emerald', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Orange', value: '#F97316' },
] as const

/**
 * 거래 타입 검증
 */
export function isValidTransactionType(type: string): type is TransactionType {
  return ['EXPENSE', 'INCOME', 'TRANSFER'].includes(type)
}

/**
 * 카테고리 이름 검증
 */
export function validateCategoryName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: '카테고리명을 입력해주세요' }
  }

  if (name.trim().length > 120) {
    return { isValid: false, error: '카테고리명은 120자 이하로 입력해주세요' }
  }

  return { isValid: true }
}

/**
 * 색상 코드 검증
 */
export function validateColorCode(color: string): {
  isValid: boolean
  error?: string
} {
  const hexColorPattern = /^#[0-9A-Fa-f]{6}$/

  if (!color) {
    return { isValid: true } // 색상은 선택사항
  }

  if (!hexColorPattern.test(color)) {
    return { isValid: false, error: '올바른 색상 코드를 입력해주세요 (예: #FF5733)' }
  }

  return { isValid: true }
}

/**
 * 카테고리 배경색 생성 (투명도 적용)
 */
export function getCategoryBackgroundColor(color: string | null, alpha: number = 0.1): string {
  if (!color) {
    return `rgba(107, 114, 128, ${alpha})` // gray-500
  }

  // hex 색상을 rgba로 변환
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 카테고리 텍스트 색상 (가독성을 위해 조정)
 */
export function getCategoryTextColor(color: string | null): string {
  if (!color) {
    return '#374151' // gray-700
  }

  // 밝기 계산하여 텍스트 색상 결정
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // 상대 밝기 계산 (ITU-R BT.709)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // 밝은 색상이면 어두운 텍스트, 어두운 색상이면 밝은 텍스트
  return brightness > 0.5 ? '#1F2937' : color
}

/**
 * 기본 카테고리 여부 확인
 */
export function isSystemCategory(category: {
  isDefault: boolean
  ownerType: string
  ownerId: string
}): boolean {
  return category.isDefault && category.ownerType === 'USER' && category.ownerId === '0'
}

/**
 * 카테고리 타입별 필터링
 */
export function filterCategoriesByType<T extends { type: TransactionType }>(
  categories: T[],
  type?: TransactionType
): T[] {
  if (!type) return categories
  return categories.filter((category) => category.type === type)
}

/**
 * 카테고리 그룹핑 (기본/커스텀별)
 */
export function groupCategoriesByDefault<T extends { isDefault: boolean }>(
  categories: T[]
): { default: T[]; custom: T[] } {
  return {
    default: categories.filter((cat) => cat.isDefault),
    custom: categories.filter((cat) => !cat.isDefault),
  }
}
