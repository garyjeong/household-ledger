/**
 * 설정 관련 React Query hooks
 * T-025: 설정 하위 메뉴 - 카테고리 관리
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { AppSettings, CategoryDisplaySettings, DEFAULT_SETTINGS } from '@/contexts/settings-context'

/**
 * 설정 조회 hook
 */
export function useSettingsQuery() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<AppSettings> => {
      const response = await fetch('/api/settings', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다')
        }
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch settings')
      }

      const data = await response.json()
      return data.settings || DEFAULT_SETTINGS
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
  })
}

/**
 * 설정 업데이트 hook
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<AppSettings>): Promise<AppSettings> => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }

      const data = await response.json()
      return data.settings
    },
    onSuccess: updatedSettings => {
      // 설정 쿼리 캐시 업데이트
      queryClient.setQueryData(['settings'], updatedSettings)
    },
  })
}

/**
 * 카테고리 표시 설정 업데이트 hook
 */
export function useUpdateCategoryDisplay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<CategoryDisplaySettings>): Promise<AppSettings> => {
      // 현재 설정 가져오기
      const currentSettings =
        queryClient.getQueryData<AppSettings>(['settings']) || DEFAULT_SETTINGS

      // 카테고리 표시 설정만 업데이트
      const newCategoryDisplay = {
        ...currentSettings.categoryDisplay,
        ...updates,
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ categoryDisplay: newCategoryDisplay }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update category display settings')
      }

      const data = await response.json()
      return data.settings
    },
    onSuccess: updatedSettings => {
      queryClient.setQueryData(['settings'], updatedSettings)
    },
  })
}

/**
 * 설정 초기화 hook
 */
export function useResetSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<AppSettings> => {
      const response = await fetch('/api/settings', {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset settings')
      }

      const data = await response.json()
      return data.settings
    },
    onSuccess: defaultSettings => {
      queryClient.setQueryData(['settings'], defaultSettings)
    },
  })
}

/**
 * 테마 설정 hook
 */
export function useUpdateTheme() {
  const updateSettings = useUpdateSettings()

  return useMutation({
    mutationFn: async (theme: 'light' | 'dark' | 'system') => {
      return updateSettings.mutateAsync({ theme })
    },
  })
}

/**
 * 언어 설정 hook
 */
export function useUpdateLanguage() {
  const updateSettings = useUpdateSettings()

  return useMutation({
    mutationFn: async (language: 'ko' | 'en') => {
      return updateSettings.mutateAsync({ language })
    },
  })
}

/**
 * 통화 설정 hook
 */
export function useUpdateCurrency() {
  const updateSettings = useUpdateSettings()

  return useMutation({
    mutationFn: async (currency: 'KRW' | 'USD' | 'EUR' | 'JPY') => {
      return updateSettings.mutateAsync({ currency })
    },
  })
}

/**
 * 알림 설정 hook
 */
export function useUpdateNotifications() {
  const updateSettings = useUpdateSettings()

  return useMutation({
    mutationFn: async (notifications: {
      enableNotifications?: boolean
      notificationSound?: boolean
      budgetAlerts?: boolean
    }) => {
      return updateSettings.mutateAsync(notifications)
    },
  })
}

/**
 * UI 설정 hook
 */
export function useUpdateUISettings() {
  const updateSettings = useUpdateSettings()

  return useMutation({
    mutationFn: async (uiSettings: {
      compactMode?: boolean
      showTutorials?: boolean
      quickInputShortcuts?: boolean
    }) => {
      return updateSettings.mutateAsync(uiSettings)
    },
  })
}

/**
 * 기본 페이지 설정 hook
 */
export function useUpdateDefaultLanding() {
  const updateSettings = useUpdateSettings()

  return useMutation({
    mutationFn: async (defaultLanding: 'dashboard' | 'transactions' | 'statistics') => {
      return updateSettings.mutateAsync({ defaultLanding })
    },
  })
}

/**
 * 분할 기본값 설정 hook
 */
export function useUpdateSplitDefault() {
  const updateSettings = useUpdateSettings()

  return useMutation({
    mutationFn: async (splitDefault: number) => {
      if (splitDefault < 0 || splitDefault > 100) {
        throw new Error('분할 비율은 0~100 사이여야 합니다')
      }
      return updateSettings.mutateAsync({ splitDefault })
    },
  })
}

/**
 * 파트너 이름 설정 hook
 */
export function useUpdatePartnerName() {
  const updateSettings = useUpdateSettings()

  return useMutation({
    mutationFn: async (partnerName: string) => {
      return updateSettings.mutateAsync({ partnerName })
    },
  })
}

/**
 * 특정 설정값 가져오기 helper hook
 */
export function useSettingValue<K extends keyof AppSettings>(key: K): AppSettings[K] | undefined {
  const { data: settings } = useSettingsQuery()
  return settings?.[key]
}

/**
 * 카테고리 표시 설정 가져오기 helper hook
 */
export function useCategoryDisplaySettings(): CategoryDisplaySettings {
  const { data: settings } = useSettingsQuery()
  return settings?.categoryDisplay || DEFAULT_SETTINGS.categoryDisplay
}
