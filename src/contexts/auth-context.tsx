'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, emailStorage } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>
  signup: (
    email: string,
    password: string,
    nickname: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  rememberedEmail: string | null
  clearRememberedEmail: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null)

  const isAuthenticated = !!user

  // 컴포넌트 마운트 시 저장된 토큰 확인 및 이메일 불러오기
  useEffect(() => {
    checkAuthStatus()
    loadRememberedEmail()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // 타임아웃 설정으로 무한 대기 방지
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃

      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // 타임아웃이나 네트워크 에러 시에도 로딩 완료
    } finally {
      setIsLoading(false)
    }
  }

  const loadRememberedEmail = () => {
    const saved = emailStorage.load()
    setRememberedEmail(saved)
  }

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)

        // 이메일 저장/삭제
        if (rememberMe) {
          emailStorage.save(email)
          setRememberedEmail(email)
        } else {
          emailStorage.clear()
          setRememberedEmail(null)
        }

        return { success: true }
      } else {
        return { success: false, error: data.error || '로그인에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const signup = async (email: string, password: string, nickname: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nickname }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || '회원가입에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      // 로그아웃 후 로그인 페이지로 리디렉션
      router.push('/login')
    }
  }

  const clearRememberedEmail = () => {
    emailStorage.clear()
    setRememberedEmail(null)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    rememberedEmail,
    clearRememberedEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
