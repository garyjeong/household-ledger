'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, emailStorage } from '@/lib/auth'
import { apiGet, apiPost } from '@/lib/api-client'

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
      const response = await apiGet('/api/auth/me')

      if (response.ok && response.data) {
        setUser(response.data.user)
      } else {
        // 토큰이 유효하지 않은 모든 경우에 로그아웃 처리
        // console.log('Token invalid or expired, logging out...')
        setUser(null)
        
        // 로그인 페이지가 아닌 경우에만 리다이렉트
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // 네트워크 에러 시에도 로그아웃 처리
      setUser(null)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        router.push('/login')
      }
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
      const response = await apiPost('/api/auth/login', { email, password, rememberMe })

      if (response.ok && response.data) {
        setUser(response.data.user)

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
        return { success: false, error: response.error || '로그인에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const signup = async (email: string, password: string, nickname: string) => {
    try {
      const response = await apiPost('/api/auth/signup', { email, password, nickname })

      if (response.ok && response.data) {
        setUser(response.data.user)
        
        // 회원가입 성공 시에도 이메일 캐시에 저장 (자동으로 기억하기)
        emailStorage.save(email)
        setRememberedEmail(email)
        
        return { success: true }
      } else {
        return { success: false, error: response.error || '회원가입에 실패했습니다.' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: '네트워크 오류가 발생했습니다.' }
    }
  }

  const logout = async () => {
    try {
      await apiPost('/api/auth/logout')
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
