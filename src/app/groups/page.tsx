/**
 * 그룹 페이지 (Compact)
 * - 초대 코드 입력으로 그룹 참여
 */
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useGroup } from '@/contexts/group-context'
import { apiPost } from '@/lib/api-client'

export default function GroupsPage() {
  const { currentGroup, refreshGroups } = useGroup()
  const { toast } = useToast()
  const [showJoin, setShowJoin] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase()
    if (!code) {
      toast({ title: '초대 코드를 입력해주세요', variant: 'destructive' })
      return
    }
    setJoining(true)
    try {
      const res = await apiPost('/api/groups/join', { inviteCode: code })
      if (res.ok) {
        toast({ title: '그룹 참여 완료', description: '가족 가계부에 참여되었습니다.' })
        setInviteCode('')
        await refreshGroups()
      } else {
        toast({ title: '참여 실패', description: res.error || '유효하지 않거나 만료된 초대 코드입니다.', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: '네트워크 오류', description: '잠시 후 다시 시도해주세요.', variant: 'destructive' })
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className='mx-auto max-w-xl px-4 py-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>현재 그룹</CardTitle>
        </CardHeader>
        <CardContent className='text-sm text-slate-700'>
          {currentGroup ? (
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>{currentGroup.name}</div>
                <div className='text-slate-500'>멤버 {currentGroup.memberCount || 1}명</div>
              </div>
              <Button size='sm' variant='outline' onClick={() => setShowJoin(v => !v)}>
                그룹 참여
              </Button>
            </div>
          ) : (
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>아직 그룹이 없습니다</div>
                <div className='text-slate-500'>초대 코드로 그룹에 참여하세요</div>
              </div>
              <Button size='sm' variant='outline' onClick={() => setShowJoin(true)}>
                그룹 참여
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showJoin && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>초대 코드로 참여</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='space-y-2'>
              <Label htmlFor='inviteCode'>초대 코드</Label>
              <div className='flex gap-2'>
                <Input
                  id='inviteCode'
                  placeholder='예: ABCD1234EF'
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  maxLength={12}
                  autoCapitalize='characters'
                />
                <Button onClick={handleJoin} disabled={joining}>
                  {joining ? '참여 중...' : '참여하기'}
                </Button>
              </div>
              <div className='text-xs text-slate-500'>대문자/숫자 10~12자리</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

