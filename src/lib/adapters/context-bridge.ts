/**
 * Context Bridge - 기존 Context API와 새로운 Zustand 스토어 간의 동기화
 * 변경 최소화 원칙: 기존 코드 영향 없이 새로운 상태 관리 시스템 통합
 */

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { useLedgerStore } from '@/stores/ledger-store'

/**
 * Context와 Zustand 스토어를 동기화하는 Hook
 * 기존 Context 사용 코드는 수정하지 않고 새로운 기능만 Zustand 사용
 */
export function useContextBridge() {
  const { user, isAuthenticated } = useAuth()
  const { currentGroup } = useGroup()
  const { refreshFromAPI } = useLedgerStore()

  // 사용자 로그인 상태 변경 시 Ledger 데이터 동기화
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshFromAPI()
    }
  }, [isAuthenticated, user, refreshFromAPI])

  // 그룹 변경 시 Ledger 데이터 동기화
  useEffect(() => {
    if (currentGroup) {
      refreshFromAPI()
    }
  }, [currentGroup, refreshFromAPI])
}

/**
 * API 호출에 필요한 인증 헤더 생성
 * 기존 Context에서 인증 상태를 가져와서 API 호출에 사용
 */
export function useApiHeaders() {
  const { isAuthenticated } = useAuth()

  const getHeaders = () => {
    if (!isAuthenticated) {
      throw new Error('사용자 인증이 필요합니다')
    }

    // 쿠키에서 자동으로 토큰이 전송되지만,
    // Authorization 헤더도 필요한 경우를 위해 준비
    return {
      'Content-Type': 'application/json',
      // Authorization 헤더는 쿠키 기반이므로 생략
      // 필요시 localStorage나 Context에서 토큰 추가 가능
    }
  }

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = getHeaders()

    return fetch(url, {
      ...options,
      credentials: 'include', // 쿠키 자동 전송
      headers: {
        ...headers,
        ...options.headers,
      },
    })
  }

  return { getHeaders, fetchWithAuth }
}

/**
 * 기존 계좌/카테고리 데이터를 Ledger 스토어에서 사용할 수 있도록 변환
 * 기존 API 응답 형태와 호환성 유지
 */
export interface LegacyAccount {
  id: string
  name: string
  type: 'CASH' | 'CARD' | 'BANK' | 'OTHER'
  balance: string
  isActive: boolean
}

export interface LegacyCategory {
  id: string
  name: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  color?: string
  isDefault: boolean
}

/**
 * 기존 계좌/카테고리 데이터를 가져와서 Ledger에서 사용할 수 있도록 포맷팅
 */
export async function fetchLegacyData() {
  try {
    const [accountsRes, categoriesRes] = await Promise.all([
      fetch('/api/accounts', { credentials: 'include' }),
      fetch('/api/categories', { credentials: 'include' }),
    ])

    if (!accountsRes.ok || !categoriesRes.ok) {
      throw new Error('데이터 로드 실패')
    }

    const accountsData = await accountsRes.json()
    const categoriesData = await categoriesRes.json()

    return {
      accounts: (accountsData.accounts || []) as LegacyAccount[],
      categories: (categoriesData.categories || []) as LegacyCategory[],
    }
  } catch (error) {
    console.error('Legacy data fetch error:', error)
    return { accounts: [], categories: [] }
  }
}

/**
 * 계좌/카테고리 ID를 이름으로 변환하는 매퍼
 * Bulk Import나 Preset에서 사용
 */
export class DataMapper {
  private accounts: LegacyAccount[] = []
  private categories: LegacyCategory[] = []

  constructor(accounts: LegacyAccount[], categories: LegacyCategory[]) {
    this.accounts = accounts
    this.categories = categories
  }

  findAccountByName(name: string): LegacyAccount | null {
    return this.accounts.find(acc => acc.name.toLowerCase().includes(name.toLowerCase())) || null
  }

  findCategoryByName(
    name: string,
    type?: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  ): LegacyCategory | null {
    return (
      this.categories.find(cat => {
        const nameMatch = cat.name.toLowerCase().includes(name.toLowerCase())
        const typeMatch = !type || cat.type === type
        return nameMatch && typeMatch
      }) || null
    )
  }

  getAccountName(id: string): string {
    return this.accounts.find(acc => acc.id === id)?.name || '알 수 없는 계좌'
  }

  getCategoryName(id: string): string {
    return this.categories.find(cat => cat.id === id)?.name || '알 수 없는 카테고리'
  }

  // Fuzzy search for better matching
  searchAccount(query: string): LegacyAccount[] {
    const normalizedQuery = query.toLowerCase().trim()
    return this.accounts
      .filter(acc => acc.name.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        // 정확한 매치를 우선순위로
        const aExact = a.name.toLowerCase() === normalizedQuery
        const bExact = b.name.toLowerCase() === normalizedQuery
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return a.name.localeCompare(b.name)
      })
  }

  searchCategory(query: string, type?: 'EXPENSE' | 'INCOME' | 'TRANSFER'): LegacyCategory[] {
    const normalizedQuery = query.toLowerCase().trim()
    return this.categories
      .filter(cat => {
        const nameMatch = cat.name.toLowerCase().includes(normalizedQuery)
        const typeMatch = !type || cat.type === type
        return nameMatch && typeMatch
      })
      .sort((a, b) => {
        // 정확한 매치를 우선순위로
        const aExact = a.name.toLowerCase() === normalizedQuery
        const bExact = b.name.toLowerCase() === normalizedQuery
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return a.name.localeCompare(b.name)
      })
  }
}

/**
 * 로컬스토리지와 Context 상태 간 동기화 유틸리티
 */
export function syncWithLocalStorage(key: string, defaultValue: any) {
  if (typeof window === 'undefined') return defaultValue

  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

export function saveToLocalStorage(key: string, value: any) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('로컬스토리지 저장 실패:', error)
  }
}

/**
 * 토스트 알림 시스템 (Undo 기능용)
 * 기존 UI 시스템과 호환되도록 구성
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

let toastCallbacks: ((toast: ToastMessage) => void)[] = []

export function showToast(toast: Omit<ToastMessage, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const fullToast = { ...toast, id }

  toastCallbacks.forEach(callback => callback(fullToast))
}

export function onToast(callback: (toast: ToastMessage) => void) {
  toastCallbacks.push(callback)

  return () => {
    toastCallbacks = toastCallbacks.filter(cb => cb !== callback)
  }
}

/**
 * Undo 기능을 위한 토스트 헬퍼
 */
export function showUndoToast(actionName: string, undoCallback: () => void) {
  showToast({
    type: 'success',
    title: `${actionName} 완료`,
    message: '5초 내에 되돌릴 수 있습니다',
    duration: 5000,
    action: {
      label: '되돌리기',
      onClick: undoCallback,
    },
  })
}
