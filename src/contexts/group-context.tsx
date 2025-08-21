'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { GroupWithMembers } from '@/lib/auth'
import { useAuth } from './auth-context'

interface GroupContextType {
  groups: GroupWithMembers[]
  currentGroup: GroupWithMembers | null
  isLoading: boolean
  refreshGroups: () => Promise<void>
  switchGroup: (groupId: string | null) => void
  createGroup: (name: string) => Promise<{ success: boolean; error?: string; group?: GroupWithMembers }>
  generateInvite: (groupId: string) => Promise<{ success: boolean; error?: string; inviteUrl?: string; inviteCode?: string }>
  joinGroupByCode: (inviteCode: string) => Promise<{ success: boolean; error?: string; group?: GroupWithMembers }>
  leaveGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>
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
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/groups', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
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
      return
    }

    const group = groups.find(g => g.id === groupId)
    if (group) {
      setCurrentGroup(group)
      localStorage.setItem(CURRENT_GROUP_KEY, groupId)
    }
  }

  const createGroup = async (name: string) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        await refreshGroups() // 그룹 목록 새로고침
        return { success: true, group: data.group }
      } else {
        return { success: false, error: data.error || '그룹 생성에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Create group error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const generateInvite = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        return { 
          success: true, 
          inviteUrl: data.inviteUrl,
          inviteCode: data.inviteCode 
        }
      } else {
        return { success: false, error: data.error || '초대 링크 생성에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Generate invite error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const joinGroupByCode = async (inviteCode: string) => {
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        await refreshGroups() // 그룹 목록 새로고침
        return { success: true, group: data.group }
      } else {
        return { success: false, error: data.error || '그룹 참여에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Join group error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const leaveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        await refreshGroups() // 그룹 목록 새로고침
        return { success: true }
      } else {
        return { success: false, error: data.error || '그룹 탈퇴에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Leave group error:', error)
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
  }

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}
