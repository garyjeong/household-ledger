/**
 * 신혼부부용 가계부 타입 시스템
 * 입력 최적화, 공동 가계부, 반응형 퍼스트 원칙
 */

// 기본 타입들
export type Person = 'me' | 'shared' | 'partner'
export type PayMethod = 'cash' | 'debit' | 'credit' | 'transfer' | 'other'
export type TransactionType = 'expense' | 'income' | 'transfer'
export type Currency = 'KRW'
export type LandingPage = 'quick' | 'list' | 'dashboard'

// 카테고리 관리
export interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: TransactionType
  favorite?: boolean
  budget?: number
  isDefault?: boolean
  order?: number
}

// 분할 설정
export interface SplitRule {
  me: number // 0-100 퍼센트
  partner: number // 0-100 퍼센트
}

// 거래 데이터
export interface Transaction {
  id: string
  amount: number
  categoryId: string
  payMethod?: PayMethod
  date: string // YYYY-MM-DD
  person: Person
  memo?: string
  tags?: string[]
  isShared?: boolean
  split?: SplitRule
  type: TransactionType
  accountId?: string
  createdAt: string
  updatedAt: string
  userId: string
  groupId?: string
}

// 빠른 입력 템플릿
export interface QuickTemplate {
  id: string
  name: string
  amount?: number
  categoryId: string
  payMethod?: PayMethod
  person: Person
  memo?: string
  tags?: string[]
  split?: SplitRule
  useCount: number
  lastUsed: string
}

// 예산 관리
export interface Budget {
  id: string
  categoryId: string
  amount: number
  period: 'monthly' | 'weekly' | 'daily'
  startDate: string
  endDate?: string
  spent: number
  remaining: number
  percentage: number
}

// 정산 관리
export interface Settlement {
  id: string
  period: string // YYYY-MM
  myTotal: number
  partnerTotal: number
  sharedTotal: number
  myShare: number // 공동지출에서 내가 부담할 금액
  partnerShare: number // 공동지출에서 배우자가 부담할 금액
  balanceDue: number // 정산 차액 (양수: 내가 받을 금액, 음수: 내가 줄 금액)
  status: 'pending' | 'confirmed' | 'settled'
  confirmedAt?: string
  settledAt?: string
}

// 사용자 설정
export interface CoupleSettings {
  currency: Currency
  showWonSuffix: boolean
  defaultLanding: LandingPage
  splitDefault: number // 0-100, 기본 분할 비율 (나의 비율)
  partnerName?: string
  quickInputShortcuts: boolean
  enableNotifications: boolean
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
}

// 통계 데이터
export interface MonthlyStats {
  period: string // YYYY-MM
  totalExpense: number
  totalIncome: number
  myExpense: number
  partnerExpense: number
  sharedExpense: number
  categoryBreakdown: Array<{
    categoryId: string
    categoryName: string
    amount: number
    percentage: number
    color: string
    icon: string
  }>
  dailyTrend: Array<{
    date: string
    amount: number
    type: TransactionType
  }>
  budgetComparison: Array<{
    categoryId: string
    budgeted: number
    spent: number
    remaining: number
    percentage: number
  }>
}

// 필터 및 검색
export interface TransactionFilter {
  period?: {
    start: string
    end: string
  }
  categories?: string[]
  persons?: Person[]
  payMethods?: PayMethod[]
  types?: TransactionType[]
  amountRange?: {
    min?: number
    max?: number
  }
  searchQuery?: string
  tags?: string[]
}

// 정렬 옵션
export interface SortOption {
  field: 'date' | 'amount' | 'category' | 'person'
  direction: 'asc' | 'desc'
}

// UI 상태 관리
export interface UIState {
  quickAddModal: {
    isOpen: boolean
    step: 'amount' | 'category' | 'details' | 'confirm'
    data: Partial<Transaction>
  }
  selectedMonth: string // YYYY-MM
  activeFilter: TransactionFilter
  sortOption: SortOption
  selectedTransactions: string[]
  viewMode: 'card' | 'table' | 'compact'
}

// API 응답 타입들
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// 폼 상태
export interface QuickAddForm {
  amount: string
  categoryId: string
  payMethod: PayMethod
  date: string
  person: Person
  memo: string
  tags: string[]
  split?: SplitRule
  saveAsTemplate: boolean
  templateName?: string
}

// 컴포넌트 Props 타입들
export interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  initialData?: Partial<Transaction>
  categories: Category[]
  templates: QuickTemplate[]
}

export interface TransactionListProps {
  transactions: Transaction[]
  categories: Category[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onSelect: (ids: string[]) => void
  selectedIds: string[]
  viewMode: 'card' | 'table'
  isLoading?: boolean
}

export interface CategoryPickerProps {
  categories: Category[]
  selectedId?: string
  onSelect: (categoryId: string) => void
  type?: TransactionType
  showFavorites?: boolean
  recentCategories?: string[]
}

export interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  currency: Currency
  placeholder?: string
  showKeypad?: boolean
  autoFocus?: boolean
}

// 키보드 단축키
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
}

// 알림 시스템
export interface NotificationConfig {
  budgetWarning: boolean // 예산 90% 도달 시
  budgetExceeded: boolean // 예산 초과 시
  dailyReminder: boolean // 일일 입력 리마인더
  settlementReminder: boolean // 정산 리마인더
  partnerActivity: boolean // 배우자 거래 활동
}

// 내보내기/가져오기
export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf'
  period: {
    start: string
    end: string
  }
  includeCategories: boolean
  includePartner: boolean
  includeShared: boolean
}

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
  }>
  duplicates: number
}

// 차트 및 시각화 데이터
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    borderWidth?: number
  }>
}

export interface TrendData {
  period: string
  value: number
  change: number // 전 기간 대비 변화율 (%)
  isIncrease: boolean
}
