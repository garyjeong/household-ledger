'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { GroupWithMembers } from '@/lib/auth'
import { useAuth } from './auth-context'
import { apiGet, apiPost, apiDelete } from '@/lib/api-client'
import { clearCategoriesCache } from '@/hooks/use-categories'

interface GroupContextType {
  groups: GroupWithMembers[]
  currentGroup: GroupWithMembers | null
  isLoading: boolean
  refreshGroups: () => Promise<void>
  switchGroup: (groupId: string | null) => void
  createGroup: (
    name: string
  ) => Promise<{ success: boolean; error?: string; group?: GroupWithMembers }>
  generateInvite: (
    groupId: string
  ) => Promise<{ success: boolean; error?: string; inviteUrl?: string; inviteCode?: string }>
  joinGroupByCode: (
    inviteCode: string
  ) => Promise<{ success: boolean; error?: string; group?: GroupWithMembers }>
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

  // 사용자가 로그인했을 때 그룹 목록 불러오기
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshGroups()
    } else {
      setGroups([])
      setCurrentGroup(null)
    }
  }, [isAuthenticated, user])

  // 실시간 동기화를 위한 폴링 설정
  useEffect(() => {
    if (!isAuthenticated || !user) return

    // 30초마다 그룹 목록을 새로고침하여 실시간 업데이트 효과 제공
    const intervalId = setInterval(() => {
      refreshGroups()
    }, 30000) // 30초

    return () => clearInterval(intervalId)
  }, [isAuthenticated, user])

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
  }, [isAuthenticated, user])

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

  const refreshGroups = async () => {
    if (!user || isLoading) return

    setIsLoading(true)
    try {
      const response = await apiGet('/api/groups')

      if (response.ok && response.data) {
        const fetchedGroups = response.data.groups || []
        
        // 중복 방지 로직: ID 기준으로 유니크한 그룹만 설정
        const uniqueGroups = fetchedGroups.filter((group: any, index: number, self: any[]) => 
          index === self.findIndex((g: any) => g.id === group.id)
        )
        
        setGroups(uniqueGroups)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const createGroup = async (name: string) => {
    try {
      const response = await apiPost('/api/groups', { name })

      if (response.ok && response.data) {
        // 전체 새로고침 대신 새 그룹을 로컬 상태에 추가
        const newGroup = response.data.group
        setGroups(prevGroups => {
          // 중복 방지: 이미 같은 ID의 그룹이 있으면 추가하지 않음
          const existingGroup = prevGroups.find(g => g.id === newGroup.id)
          if (existingGroup) {
            return prevGroups
          }
          return [...prevGroups, newGroup]
        })
        
        // 새로 생성된 그룹을 현재 그룹으로 설정
        setCurrentGroup(newGroup)
        localStorage.setItem(CURRENT_GROUP_KEY, newGroup.id)
        
        // 카테고리 캐시 클리어 (새 그룹의 카테고리 로딩을 위해)
        clearCategoriesCache()
        
        return { success: true, group: newGroup }
      } else {
        return { success: false, error: response.error || '그룹 생성에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Create group error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
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
        }
      } else {
        return { success: false, error: response.error || '초대 링크 생성에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Generate invite error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const joinGroupByCode = async (inviteCode: string) => {
    try {
      const response = await apiPost('/api/groups/join', { inviteCode })

      if (response.ok && response.data) {
        // 전체 새로고침 대신 참여한 그룹을 로컬 상태에 추가
        const joinedGroup = response.data.group
        setGroups(prevGroups => {
          // 중복 방지: 이미 같은 ID의 그룹이 있으면 추가하지 않음
          const existingGroup = prevGroups.find(g => g.id === joinedGroup.id)
          if (existingGroup) {
            return prevGroups
          }
          return [...prevGroups, joinedGroup]
        })
        
        // 참여한 그룹을 현재 그룹으로 설정
        setCurrentGroup(joinedGroup)
        localStorage.setItem(CURRENT_GROUP_KEY, joinedGroup.id)
        
        // 카테고리 캐시 클리어 (참여한 그룹의 카테고리 로딩을 위해)
        clearCategoriesCache()
        
        return { success: true, group: joinedGroup }
      } else {
        return { success: false, error: response.error || '그룹 참여에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Join group error:', error)
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
        // 삭제된 그룹이 현재 그룹이면 currentGroup을 null로 설정
        if (currentGroup && currentGroup.id === groupId) {
          setCurrentGroup(null)
          localStorage.removeItem(CURRENT_GROUP_KEY)
        }
        
        // 로컬 상태에서 삭제된 그룹 제거
        setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId))
        
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
    createGroup,
    generateInvite,
    joinGroupByCode,
    leaveGroup,
    deleteGroup,
  }

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}
