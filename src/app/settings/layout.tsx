'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Tag, User, Clock } from 'lucide-react'
import AppHeader from '@/components/layouts/AppHeader'
import { useAuth } from '@/contexts/auth-context'

interface SettingsLayoutProps {
  children: React.ReactNode
}

const settingsNavigation = [
  {
    name: '프로필',
    href: '/settings/profile',
    icon: User,
    description: '개인정보 수정',
  },
  {
    name: '카테고리 관리',
    href: '/settings/categories',
    icon: Tag,
    description: '거래 카테고리 설정',
  },
  {
    name: '고정 지출',
    href: '/settings/recurring-expenses',
    icon: Clock,
    description: '반복 지출 관리',
  },
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  // Redirect if not authenticated (but wait for loading to complete)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !user) {
      router.push('/login')
    }
  }, [isAuthenticated, user, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 mx-auto mb-4'></div>
          <p className='text-gray-600'>로그인 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <AppHeader showBackButton={true} backHref='/ledger' backText='가계부로' title='설정' />

      {/* Navigation Tabs */}
      <div className='bg-white border-b border-slate-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8' aria-label='설정 메뉴'>
            {settingsNavigation.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className='h-5 w-5' />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <main>{children}</main>
      </div>
    </div>
  )
}
