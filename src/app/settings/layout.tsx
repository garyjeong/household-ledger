'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Tag, 
  User, 
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <div className="bg-white border-b border-stroke-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-brand-600" />
              <h1 className="text-xl font-semibold text-text-900">설정</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Logout button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-slate-600 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-stroke-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="설정 메뉴">
            {settingsNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
