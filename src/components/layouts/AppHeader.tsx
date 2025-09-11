'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'

interface AppHeaderProps {
  showBackButton?: boolean
  backHref?: string
  backText?: string
  title?: string
  subtitle?: string
  showGroupInfo?: boolean
}

export default function AppHeader({
  showBackButton = false,
  backHref = '/groups',
  backText = '그룹으로',
  title,
  subtitle,
  showGroupInfo = false,
}: AppHeaderProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const { currentGroup } = useGroup()

  // 그룹 정보를 보여줄 때는 currentGroup에서 제목과 부제목을 가져옴
  const displayTitle = showGroupInfo ? currentGroup?.name || '가계부' : title
  const displaySubtitle = showGroupInfo
    ? currentGroup
      ? `${currentGroup.memberCount}명 참여`
      : '그룹 선택 필요'
    : subtitle

  return (
    <div className='bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95'>
      <div className='container-responsive'>
        <div className='flex items-center h-14 sm:h-16 relative'>
          {/* 좌측 영역 - 뒤로가기 버튼 */}
          <div className='flex items-center min-w-0 flex-1'>
            {showBackButton && (
              <Link
                href={backHref}
                className='flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors btn-touch p-1'
              >
                <ArrowLeft className='h-4 w-4 flex-shrink-0' />
                <span className='text-xs sm:text-sm font-medium hidden xs:inline'>
                  {backText}
                </span>
              </Link>
            )}
          </div>

          {/* 중앙 영역 - 제목 */}
          <div className='absolute left-1/2 transform -translate-x-1/2 text-center min-w-0 max-w-[60%]'>
            {displayTitle && (
              <h1 className='text-base sm:text-xl font-bold text-slate-900 truncate'>
                {displayTitle}
              </h1>
            )}
            {displaySubtitle && (
              <p className='text-2xs sm:text-xs text-slate-500 truncate'>{displaySubtitle}</p>
            )}
          </div>

          {/* 우측 영역 - 설정 버튼들 */}
          <div className='flex items-center gap-3 justify-end min-w-0 flex-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push('/settings/profile')}
              className='text-slate-600 hover:text-slate-900 cursor-pointer'
              title='설정'
            >
              <Settings className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={logout}
              className='text-slate-600 hover:text-slate-900 cursor-pointer'
              title='로그아웃'
            >
              <LogOut className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
