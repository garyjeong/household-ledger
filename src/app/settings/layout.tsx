'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import {
  Shield,
  CreditCard,
  Bell,
  Palette,
  Users,
  Receipt,
  Repeat,
  Download,
} from 'lucide-react'
import AppHeader from '@/components/layouts/AppHeader'
import { useAuth } from '@/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SettingsLayoutProps {
  children: React.ReactNode
}

const settingsNavigation = [
  {
    name: '프로필',
    href: '/settings/profile',
    icon: Users,
    description: '개인정보 수정',
  },
  {
    name: '데이터 관리',
    items: [
      {
        name: '카테고리',
        href: '/settings/categories',
        icon: Receipt,
      },
      {
        name: '반복 거래',
        href: '/settings/recurring',
        icon: Repeat,
      },
      {
        name: '데이터 내보내기',
        href: '/settings/export',
        icon: Download,
      },
    ],
  },
  {
    name: '고정 지출',
    href: '/settings/recurring-expenses',
    icon: Bell,
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
          <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
            {settingsNavigation.map(section => {
              if (section.items) {
                return (
                  <DropdownMenu key={section.name}>
                    <DropdownMenuTrigger asChild>
                      <button className='py-4 px-1 inline-flex items-center gap-x-2 text-sm font-semibold text-gray-500 hover:text-blue-600'>
                        {section.name}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {section.items.map(item => (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link href={item.href}>
                            <item.icon className='w-4 h-4 mr-2' />
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              const Icon = section.icon
              const isActive = pathname === section.href

              return (
                <Link
                  key={section.name}
                  href={section.href}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon className='w-4 h-4' />
                  {section.name}
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
