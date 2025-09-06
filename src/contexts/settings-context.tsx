/**
 * 설정 관리 컨텍스트
 * T-025: 설정 하위 메뉴 - 카테고리 관리
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { apiGet, apiPut } from '@/lib/api-client'

// 카테고리 기본 설정
export interface CategoryDisplaySettings {
  showIcons: boolean
  iconStyle: 'default' | 'modern' | 'minimal'
  colorStyle: 'vibrant' | 'pastel' | 'monochrome'
  groupByType: boolean
  sortBy: 'name' | 'usage' | 'amount' | 'recent'
}

// 전체 앱 설정
export interface AppSettings {
  // 기본 설정
  currency: 'KRW' | 'USD' | 'EUR' | 'JPY'
  showWonSuffix: boolean
  defaultLanding: 'dashboard' | 'transactions' | 'statistics'
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'

  // 카테고리 표시 설정
  categoryDisplay: CategoryDisplaySettings

  // 알림 설정
  enableNotifications: boolean
  notificationSound: boolean
  budgetAlerts: boolean

  // UI 설정
  compactMode: boolean
  showTutorials: boolean
  quickInputShortcuts: boolean

  // 개인화 설정
  partnerName?: string
  splitDefault: number // 0-100, 기본 분할 비율
}

// 기본 설정값
export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'KRW',
  showWonSuffix: true,
  defaultLanding: 'dashboard',
  theme: 'light',
  language: 'ko',
  categoryDisplay: {
    showIcons: true,
    iconStyle: 'default',
    colorStyle: 'vibrant',
    groupByType: true,
    sortBy: 'name',
  },
  enableNotifications: true,
  notificationSound: true,
  budgetAlerts: true,
  compactMode: false,
  showTutorials: true,
  quickInputShortcuts: true,
  splitDefault: 50,
}

interface SettingsContextType {
  settings: AppSettings
  isLoading: boolean
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
  updateCategoryDisplay: (updates: Partial<CategoryDisplaySettings>) => Promise<void>
  resetSettings: () => Promise<void>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: React.ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // 설정 로드
  const loadSettings = async () => {
    if (!isAuthenticated || !user) {
      setSettings(DEFAULT_SETTINGS)
      setIsLoading(false)
      return
    }

    try {
      const response = await apiGet('/api/settings')

      if (response.ok && response.data) {
        const userSettings = { ...DEFAULT_SETTINGS, ...response.data.settings }
        setSettings(userSettings)
      } else {
        // 설정이 없는 경우 기본값 사용
        setSettings(DEFAULT_SETTINGS)
      }
    } catch (error) {
      console.error('설정 로드 중 오류:', error)
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setIsLoading(false)
    }
  }

  // 설정 업데이트
  const updateSettings = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates }

    // 낙관적 업데이트
    setSettings(newSettings)

    try {
      const response = await apiPut('/api/settings', updates)

      if (!response.ok) {
        // 실패 시 이전 설정으로 롤백
        setSettings(settings)
        throw new Error('설정 업데이트에 실패했습니다')
      }
    } catch (error) {
      setSettings(settings)
      throw error
    }
  }

  // 카테고리 표시 설정 업데이트
  const updateCategoryDisplay = async (updates: Partial<CategoryDisplaySettings>) => {
    const newCategoryDisplay = { ...settings.categoryDisplay, ...updates }
    await updateSettings({ categoryDisplay: newCategoryDisplay })
  }

  // 설정 초기화
  const resetSettings = async () => {
    await updateSettings(DEFAULT_SETTINGS)
  }

  // 설정 새로고침
  const refreshSettings = async () => {
    await loadSettings()
  }

  // 사용자 로그인/로그아웃 시 설정 로드
  useEffect(() => {
    loadSettings()
  }, [isAuthenticated, user])

  // 로컬 스토리지와 동기화 (오프라인 지원)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      try {
        localStorage.setItem('appSettings', JSON.stringify(settings))
      } catch (error) {
        console.warn('로컬 스토리지 저장 실패:', error)
      }
    }
  }, [settings, isLoading, isAuthenticated])

  // 로컬 스토리지에서 설정 복원 (오프라인 시)
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings })
        }
      } catch (error) {
        console.warn('로컬 스토리지 로드 실패:', error)
      }
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const value: SettingsContextType = {
    settings,
    isLoading,
    updateSettings,
    updateCategoryDisplay,
    resetSettings,
    refreshSettings,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
