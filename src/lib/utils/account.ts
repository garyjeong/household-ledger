import { CreditCard, Banknote, Building2, Wallet, type LucideIcon } from 'lucide-react'

// 계좌 타입 정의
export type AccountType = 'CASH' | 'CARD' | 'BANK' | 'OTHER'

// 계좌 타입별 아이콘 매핑
export const accountTypeIcons: Record<AccountType, LucideIcon> = {
  CASH: Banknote,
  CARD: CreditCard,
  BANK: Building2,
  OTHER: Wallet,
}

// 계좌 타입별 한글 이름
export const accountTypeLabels: Record<AccountType, string> = {
  CASH: '현금',
  CARD: '카드',
  BANK: '은행',
  OTHER: '기타',
}

// 계좌 타입별 색상 클래스 (Tailwind)
export const accountTypeColors: Record<
  AccountType,
  {
    bg: string
    text: string
    border: string
    icon: string
  }
> = {
  CASH: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
  },
  CARD: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'text-blue-600',
  },
  BANK: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    icon: 'text-violet-600',
  },
  OTHER: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: 'text-gray-600',
  },
}

/**
 * 금액 포맷팅 함수
 * @param amount - 금액 (문자열 또는 숫자)
 * @param currency - 통화 (기본값: 'KRW')
 * @param showSign - 양수/음수 부호 표시 여부
 */
export function formatCurrency(
  amount: string | number,
  currency: string = 'KRW',
  showSign: boolean = false
): string {
  const numAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount

  if (isNaN(numAmount)) {
    return '0원'
  }

  // 한국 원화 포맷팅
  if (currency === 'KRW') {
    const formatted = new Intl.NumberFormat('ko-KR').format(Math.abs(numAmount))
    const sign = numAmount >= 0 ? (showSign ? '+' : '') : '-'
    return `${sign}${formatted}원`
  }

  // 기타 통화 포맷팅
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(Math.abs(numAmount))

  const sign = numAmount >= 0 ? (showSign ? '+' : '') : '-'
  return `${sign}${formatted}`
}

/**
 * 잔액 색상 클래스 반환
 * @param balance - 잔액 (문자열 또는 숫자)
 */
export function getBalanceColorClass(balance: string | number): string {
  const numBalance = typeof balance === 'string' ? parseInt(balance, 10) : balance

  if (numBalance > 0) {
    return 'text-emerald-600'
  } else if (numBalance < 0) {
    return 'text-red-600'
  } else {
    return 'text-gray-600'
  }
}

/**
 * 계좌 타입 검증
 */
export function isValidAccountType(type: string): type is AccountType {
  return ['CASH', 'CARD', 'BANK', 'OTHER'].includes(type)
}

/**
 * 계좌 이름 검증
 */
export function validateAccountName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: '계좌명을 입력해주세요' }
  }

  if (name.trim().length > 120) {
    return { isValid: false, error: '계좌명은 120자 이하로 입력해주세요' }
  }

  return { isValid: true }
}

/**
 * 잔액 검증
 */
export function validateBalance(balance: string | number): {
  isValid: boolean
  error?: string
} {
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance

  if (isNaN(numBalance)) {
    return { isValid: false, error: '올바른 금액을 입력해주세요' }
  }

  if (numBalance < -9999999999) {
    return { isValid: false, error: '잔액이 너무 작습니다' }
  }

  if (numBalance > 9999999999) {
    return { isValid: false, error: '잔액이 너무 큽니다' }
  }

  return { isValid: true }
}

/**
 * 숫자 입력 포맷팅 (천 단위 콤마)
 */
export function formatNumberInput(value: string): string {
  // 숫자가 아닌 문자 제거
  const numbers = value.replace(/[^\d-]/g, '')

  // 빈 문자열이면 그대로 반환
  if (!numbers) return ''

  // 음수 처리
  const isNegative = numbers.startsWith('-')
  const absoluteNumbers = isNegative ? numbers.slice(1) : numbers

  // 천 단위 콤마 추가
  const formatted = absoluteNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return isNegative ? `-${formatted}` : formatted
}

/**
 * 포맷된 숫자 입력을 숫자로 변환
 */
export function parseNumberInput(value: string): number {
  const cleanValue = value.replace(/[^\d-]/g, '')
  return parseInt(cleanValue, 10) || 0
}
