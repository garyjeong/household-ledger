'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { GroupWithMembers } from '@/lib/auth'
import { apiGet, apiPost, apiDelete } from '@/lib/api-client'
import { clearCategoriesCache } from '@/hooks/use-categories'
import { useAuth } from './auth-context'

interface GroupContextType {
  groups: GroupWithMembers[]
  currentGroup: GroupWithMembers | null
  isLoading: boolean
  refreshGroups: () => Promise<void>
  switchGroup: (groupId: string | null) => void
  generateInvite: (
    groupId: string
  ) => Promise<{ success: boolean; error?: string; inviteUrl?: string; inviteCode?: string; expiresAt?: string }>
  getInviteCode: (
    groupId: string
  ) => Promise<{ success: boolean; error?: string; inviteCode?: string | null; expiresAt?: string }>
  leaveGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>
  deleteGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export function useGroup() {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider')
  }
  return context
}

interface GroupProviderProps {
  children: React.ReactNode
}

const CURRENT_GROUP_KEY = 'currentGroupId'

export function GroupProvider({ children }: GroupProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [currentGroup, setCurrentGroup] = useState<GroupWithMembers | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshGroups = useCallback(async () => {
    if (!user || isLoading) return

    setIsLoading(true)
    try {
      const response = await apiGet('/api/groups')

      if (response.ok && response.data) {
        const fetchedGroups = response.data.groups || []

        // 중복 방지 로직: ID 기준으로 유니크한 그룹만 설정
        const uniqueGroups = fetchedGroups.filter(
          (group: GroupWithMembers, index: number, self: GroupWithMembers[]) =>
            index === self.findIndex((g: GroupWithMembers) => g.id === group.id)
        )

        setGroups(uniqueGroups)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, isLoading])

  // 사용자가 로그인했을 때 그룹 목록 불러오기
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshGroups()
    } else {
      setGroups([])
      setCurrentGroup(null)
    }
  }, [isAuthenticated, user, refreshGroups])

  // 실시간 동기화를 위한 폴링 설정
  useEffect(() => {
    if (!isAuthenticated || !user) return

    // 30초마다 그룹 목록을 새로고침하여 실시간 업데이트 효과 제공
    const intervalId = setInterval(() => {
      refreshGroups()
    }, 30000) // 30초

    return () => clearInterval(intervalId)
  }, [isAuthenticated, user, refreshGroups])

  // 브라우저 포커스 시 그룹 목록 새로고침
  useEffect(() => {
    if (!isAuthenticated || !user) return

    let refreshTimeout: NodeJS.Timeout

    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(() => {
        refreshGroups()
      }, 1000) // 1초 디바운싱
    }

    const handleFocus = () => {
      debouncedRefresh()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debouncedRefresh()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(refreshTimeout)
    }
  }, [isAuthenticated, user, refreshGroups])

  // 그룹 목록이 변경될 때 현재 그룹 설정
  useEffect(() => {
    if (groups.length > 0) {
      // 저장된 그룹 ID가 있는지 확인
      const savedGroupId = localStorage.getItem(CURRENT_GROUP_KEY)
      if (savedGroupId) {
        const savedGroup = groups.find(g => g.id === savedGroupId)
        if (savedGroup) {
          setCurrentGroup(savedGroup)
          return
        }
      }

      // 저장된 그룹이 없으면 첫 번째 그룹을 선택
      setCurrentGroup(groups[0])
      localStorage.setItem(CURRENT_GROUP_KEY, groups[0].id)
    } else {
      setCurrentGroup(null)
      localStorage.removeItem(CURRENT_GROUP_KEY)
    }
  }, [groups])

  const switchGroup = (groupId: string | null) => {
    if (!groupId) {
      setCurrentGroup(null)
      localStorage.removeItem(CURRENT_GROUP_KEY)
      // 카테고리 캐시 클리어
      clearCategoriesCache()
      return
    }

    const group = groups.find(g => g.id === groupId)
    if (group) {
      setCurrentGroup(group)
      localStorage.setItem(CURRENT_GROUP_KEY, groupId)
      // 그룹 변경 시 카테고리 캐시 클리어
      clearCategoriesCache()
    }
  }

  const getInviteCode = async (groupId: string) => {
    try {
      const response = await apiGet(`/api/groups/${groupId}/invite`)
      if (response.ok && response.data) {
        return {
          success: true,
          inviteCode: response.data.inviteCode,
          expiresAt: response.data.expiresAt,
        }
      } else {
        return { success: false, error: response.error || '초대 코드 조회에 실패했습니다.', inviteCode: null }
      }
    } catch (error) {
      console.error('Get invite code error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.', inviteCode: null }
    }
  }


  const generateInvite = async (groupId: string) => {
    try {
      const response = await apiPost(`/api/groups/${groupId}/invite`)

      if (response.ok && response.data) {
        return {
          success: true,
          inviteUrl: response.data.inviteUrl,
          inviteCode: response.data.inviteCode,
          expiresAt: response.data.expiresAt,
        }
      } else {
        return { success: false, error: response.error || '초대 링크 생성에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Generate invite error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }


  const leaveGroup = async (groupId: string) => {
    try {
      const response = await apiPost(`/api/groups/${groupId}/leave`)

      if (response.ok) {
        await refreshGroups() // 그룹 목록 새로고침
        // 카테고리 캐시 클리어 (그룹 탈퇴 후 카테고리 변경 반영)
        clearCategoriesCache()
        return { success: true }
      } else {
        return { success: false, error: response.error || '그룹 탈퇴에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Leave group error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await apiDelete(`/api/groups/${groupId}`)

      if (response.ok) {
        await refreshGroups() // 그룹 목록 새로고침
        // 카테고리 캐시 클리어 (그룹 삭제 후 카테고리 변경 반영)
        clearCategoriesCache()
        return { success: true }
      } else {
        return { success: false, error: response.error || '그룹 삭제에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Delete group error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const value: GroupContextType = {
    groups,
    currentGroup,
    isLoading,
    refreshGroups,
    switchGroup,
    generateInvite,
    getInviteCode,
    leaveGroup,
    deleteGroup,
  }

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}
