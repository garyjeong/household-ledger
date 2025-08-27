'use client'

import React, { useState } from 'react'
import { Check, ChevronDown, Plus, Users, Settings } from 'lucide-react'
import { useGroup } from '@/contexts/group-context'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface GroupSwitcherProps {
  className?: string
}

export function GroupSwitcher({ className }: GroupSwitcherProps) {
  const { groups, currentGroup, isLoading, switchGroup } = useGroup()
  const [open, setOpen] = useState(false)

  if (isLoading) {
    return (
      <div className='flex items-center space-x-2'>
        <div className='animate-pulse h-8 w-32 bg-stroke-200 rounded'></div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className='flex items-center space-x-2'>
        <Button variant='outline' size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          그룹 생성
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <Select
        value={currentGroup?.id || ''}
        onValueChange={value => switchGroup(value)}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger className='w-[200px] h-9'>
          <div className='flex items-center space-x-2'>
            <Users className='h-4 w-4 text-brand-600' />
            <SelectValue placeholder='그룹 선택'>
              {currentGroup ? (
                <div className='flex items-center space-x-2'>
                  <span className='font-medium'>{currentGroup.name}</span>
                  <Badge variant='secondary' className='text-xs'>
                    {currentGroup.memberCount}명
                  </Badge>
                </div>
              ) : (
                '그룹 선택'
              )}
            </SelectValue>
          </div>
        </SelectTrigger>

        <SelectContent>
          {groups.map(group => (
            <SelectItem key={group.id} value={group.id}>
              <div className='flex items-center justify-between w-full'>
                <div className='flex flex-col'>
                  <div className='flex items-center space-x-2'>
                    <span className='font-medium'>{group.name}</span>
                    {group.ownerId === group.members.find(m => m.role === 'OWNER')?.userId && (
                      <Badge variant='brand' className='text-xs'>
                        소유자
                      </Badge>
                    )}
                  </div>
                  <div className='flex items-center space-x-2 text-xs text-text-700'>
                    <span>{group.memberCount}명</span>
                    <span>•</span>
                    <span>
                      {formatDate(group.createdAt, {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
                {currentGroup?.id === group.id && <Check className='h-4 w-4 text-brand-600' />}
              </div>
            </SelectItem>
          ))}

          <div className='border-t border-stroke-200 my-1' />

          <SelectItem value='create-new' className='text-brand-600'>
            <div className='flex items-center space-x-2'>
              <Plus className='h-4 w-4' />
              <span>새 그룹 만들기</span>
            </div>
          </SelectItem>

          <SelectItem value='manage-groups' className='text-text-700'>
            <div className='flex items-center space-x-2'>
              <Settings className='h-4 w-4' />
              <span>그룹 관리</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
