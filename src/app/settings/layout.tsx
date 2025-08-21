'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  CreditCard, 
  Tag, 
  User, 
  Settings as SettingsIcon,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SettingsLayoutProps {
  children: React.ReactNode
}

const settingsNavigation = [
  {
    name: '계좌 관리',
    href: '/settings/accounts',
    icon: CreditCard,
    description: '계좌 추가 및 관리',
  },
  {
    name: '카테고리 관리',
    href: '/settings/categories',
    icon: Tag,
    description: '거래 카테고리 설정',
  },
  {
    name: '프로필',
    href: '/settings/profile',
    icon: User,
    description: '개인정보 수정',
  },
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

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
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {settingsNavigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                          ${isActive
                            ? 'bg-brand-50 text-brand-700 border-r-2 border-brand-600'
                            : 'text-text-700 hover:bg-gray-50 hover:text-text-900'
                          }
                        `}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-text-900">설정 메뉴</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <nav className="space-y-1">
                    {settingsNavigation.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                            ${isActive
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-text-700 hover:bg-gray-50 hover:text-text-900'
                            }
                          `}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
