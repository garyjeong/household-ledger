'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Users,
  Crown,
  Calendar,
  Link as LinkIcon,
  UserPlus,
  ExternalLink,
  Copy,
  Check,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'

const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, '그룹 이름을 입력해주세요.')
    .max(50, '그룹 이름은 최대 50자까지 가능합니다.')
    .trim(),
})

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, '초대 코드를 입력해주세요.'),
})

type CreateGroupFormData = z.infer<typeof createGroupSchema>
type JoinGroupFormData = z.infer<typeof joinGroupSchema>

export default function GroupsPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { groups, isLoading, createGroup, generateInvite, joinGroupByCode, switchGroup } =
    useGroup()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<string>('')
  const [inviteData, setInviteData] = useState<{ code: string; url: string } | null>(null)
  const [copiedInvite, setCopiedInvite] = useState<'code' | 'url' | null>(null)

  // 그룹 생성 폼
  const createForm = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '' },
  })

  // 그룹 참여 폼
  const joinForm = useForm<JoinGroupFormData>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: { inviteCode: '' },
  })

  // 인증 체크를 useEffect에서 처리하여 클라이언트 사이드에서만 실행
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // 인증되지 않은 경우 빈 화면 반환
  if (!isAuthenticated) {
    return null
  }

  const handleCreateGroup = async (data: CreateGroupFormData) => {
    const result = await createGroup(data.name)

    if (result.success) {
      setIsCreateDialogOpen(false)
      createForm.reset()
    } else {
      createForm.setError('root', { message: result.error })
    }
  }

  const handleJoinGroup = async (data: JoinGroupFormData) => {
    const result = await joinGroupByCode(data.inviteCode)

    if (result.success) {
      setIsJoinDialogOpen(false)
      joinForm.reset()
    } else {
      joinForm.setError('root', { message: result.error })
    }
  }

  const handleGenerateInvite = async (groupId: string) => {
    const result = await generateInvite(groupId)

    if (result.success && result.inviteCode && result.inviteUrl) {
      setInviteData({
        code: result.inviteCode,
        url: result.inviteUrl,
      })
      setSelectedGroupForInvite(groupId)
      setIsInviteDialogOpen(true)
    }
  }

  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedInvite(type)
      setTimeout(() => setCopiedInvite(null), 2000)
    } catch (err) {
      console.error('복사 실패:', err)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className='h-4 w-4 text-amber-600' />
      case 'ADMIN':
        return <Users className='h-4 w-4 text-slate-600' />
      default:
        return <Users className='h-4 w-4 text-slate-500' />
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '소유자'
      case 'ADMIN':
        return '관리자'
      default:
        return '멤버'
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <div className='bg-white border-b border-slate-200'>
          <div className='max-w-6xl mx-auto px-6 py-6'>
            <div className='animate-pulse'>
              <div className='h-8 bg-slate-200 rounded w-48 mb-2'></div>
              <div className='h-4 bg-slate-200 rounded w-64'></div>
            </div>
          </div>
        </div>
        <div className='max-w-6xl mx-auto px-6 py-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className='h-64 bg-white border border-slate-200 rounded-xl animate-pulse'
              >
                <div className='p-6 space-y-4'>
                  <div className='h-6 bg-slate-200 rounded w-3/4'></div>
                  <div className='h-4 bg-slate-200 rounded w-1/2'></div>
                  <div className='space-y-2'>
                    <div className='h-4 bg-slate-200 rounded w-full'></div>
                    <div className='h-4 bg-slate-200 rounded w-2/3'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <div className='bg-white border-b border-slate-200'>
        <div className='max-w-6xl mx-auto px-6 py-6'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='flex items-center justify-between sm:block'>
              <div>
                <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>내 그룹</h1>
                {groups.length > 0 && (
                  <p className='text-slate-600 mt-1'>
                    {`${groups.length}개의 그룹에 참여 중입니다`}
                  </p>
                )}
              </div>

              {/* 모바일에서만 보이는 로그아웃 버튼 */}
              <Button
                variant='ghost'
                size='sm'
                onClick={logout}
                className='text-slate-600 hover:text-slate-900 sm:hidden'
              >
                <LogOut className='h-4 w-4' />
              </Button>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Button
                variant='outline'
                className='border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                onClick={() => setIsJoinDialogOpen(true)}
              >
                <UserPlus className='h-4 w-4 mr-2' />
                그룹 참여
              </Button>
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>그룹 참여</DialogTitle>
                    <DialogDescription>초대 코드를 입력하여 그룹에 참여하세요.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={joinForm.handleSubmit(handleJoinGroup)} className='space-y-4'>
                    <div>
                      <Label htmlFor='inviteCode'>초대 코드</Label>
                      <Input
                        id='inviteCode'
                        placeholder='초대 코드를 입력하세요'
                        {...joinForm.register('inviteCode')}
                      />
                      {joinForm.formState.errors.inviteCode && (
                        <p className='text-sm text-red-600 mt-1'>
                          {joinForm.formState.errors.inviteCode.message}
                        </p>
                      )}
                    </div>

                    {joinForm.formState.errors.root && (
                      <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                        <p className='text-sm text-red-600'>
                          {joinForm.formState.errors.root.message}
                        </p>
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setIsJoinDialogOpen(false)}
                        className='border-slate-300 text-slate-700 hover:bg-slate-50'
                      >
                        취소
                      </Button>
                      <Button type='submit' className='bg-slate-900 hover:bg-slate-800 text-white'>
                        참여하기
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                className='bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className='h-4 w-4 mr-2' />새 그룹 만들기
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 그룹 만들기</DialogTitle>
                    <DialogDescription>함께 가계부를 관리할 그룹을 만들어보세요.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createForm.handleSubmit(handleCreateGroup)} className='space-y-4'>
                    <div>
                      <Label htmlFor='name'>그룹 이름</Label>
                      <Input
                        id='name'
                        placeholder='예: 우리 가족, 회사 동료'
                        {...createForm.register('name')}
                      />
                      {createForm.formState.errors.name && (
                        <p className='text-sm text-red-600 mt-1'>
                          {createForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    {createForm.formState.errors.root && (
                      <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                        <p className='text-sm text-red-600'>
                          {createForm.formState.errors.root.message}
                        </p>
                      </div>
                    )}

                    <DialogFooter>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setIsCreateDialogOpen(false)}
                        className='border-slate-300 text-slate-700 hover:bg-slate-50'
                      >
                        취소
                      </Button>
                      <Button type='submit' className='bg-slate-900 hover:bg-slate-800 text-white'>
                        만들기
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* 데스크탑에서만 보이는 로그아웃 버튼 */}
              <Button
                variant='ghost'
                size='sm'
                onClick={logout}
                className='text-slate-600 hover:text-slate-900 hidden sm:flex'
              >
                <LogOut className='h-4 w-4 mr-2' />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-6xl mx-auto px-6 py-8'>
        {groups.length === 0 ? (
          <Card className='border-2 border-dashed border-slate-300 bg-white shadow-sm'>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <div className='w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6'>
                <Users className='h-8 w-8 text-slate-400' />
              </div>
              <h3 className='text-xl font-semibold text-slate-900 mb-3'>아직 그룹이 없습니다</h3>
              <p className='text-slate-600 text-center max-w-md leading-relaxed'>
                새로운 그룹을 만들어서 가족이나 친구들과 함께 가계부를 관리해보세요. 또는 기존
                그룹의 초대 코드로 참여할 수도 있습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {groups.map(group => {
              const userMember = group.members.find(m => m.userId === user?.id)
              const canInvite = userMember?.role === 'OWNER' || userMember?.role === 'ADMIN'

              return (
                <Card
                  key={group.id}
                  className='bg-white border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-200'
                >
                  <CardHeader className='pb-4'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <CardTitle className='text-lg font-semibold text-slate-900'>
                          {group.name}
                        </CardTitle>
                        <div className='flex items-center space-x-2 mt-2'>
                          {getRoleIcon(userMember?.role || 'MEMBER')}
                          <span className='text-sm text-slate-600 font-medium'>
                            {getRoleName(userMember?.role || 'MEMBER')}
                          </span>
                        </div>
                      </div>
                      <Badge variant='secondary' className='bg-slate-100 text-slate-700 border-0'>
                        {group.memberCount}명
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-5'>
                    <div className='flex items-center space-x-2 text-sm text-slate-500'>
                      <Calendar className='h-4 w-4' />
                      <span>
                        {formatDate(group.createdAt, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        생성
                      </span>
                    </div>

                    {/* Members */}
                    <div className='space-y-3'>
                      <h4 className='text-sm font-semibold text-slate-900'>멤버</h4>
                      <div className='space-y-2'>
                        {group.members.slice(0, 3).map(member => (
                          <div key={member.userId} className='flex items-center space-x-2 text-sm'>
                            {getRoleIcon(member.role)}
                            <span className='text-slate-700'>
                              {member.user?.nickname}
                              {member.userId === user?.id && (
                                <span className='text-slate-500 font-medium'> (나)</span>
                              )}
                            </span>
                          </div>
                        ))}
                        {(group.memberCount ?? 0) > 3 && (
                          <p className='text-xs text-slate-500 pl-6'>
                            외 {(group.memberCount ?? 0) - 3}명 더...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2 pt-3 border-t border-slate-100'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        onClick={() => {
                          switchGroup(group.id)
                          router.push('/ledger')
                        }}
                      >
                        <ExternalLink className='h-4 w-4 mr-2' />
                        열기
                      </Button>

                      {canInvite && (
                        <Button
                          variant='outline'
                          size='sm'
                          className='border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          onClick={() => handleGenerateInvite(group.id)}
                        >
                          <LinkIcon className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Invite Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>그룹 초대하기</DialogTitle>
              <DialogDescription>
                아래 초대 코드나 링크를 공유하여 새로운 멤버를 초대하세요.
              </DialogDescription>
            </DialogHeader>

            {inviteData && (
              <div className='space-y-4'>
                <div>
                  <Label>초대 코드</Label>
                  <div className='flex mt-1'>
                    <Input value={inviteData.code} readOnly className='rounded-r-none' />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='rounded-l-none border-l-0'
                      onClick={() => copyToClipboard(inviteData.code, 'code')}
                    >
                      {copiedInvite === 'code' ? (
                        <Check className='h-4 w-4' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>초대 링크</Label>
                  <div className='flex mt-1'>
                    <Input value={inviteData.url} readOnly className='rounded-r-none text-xs' />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='rounded-l-none border-l-0'
                      onClick={() => copyToClipboard(inviteData.url, 'url')}
                    >
                      {copiedInvite === 'url' ? (
                        <Check className='h-4 w-4' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div className='p-3 bg-slate-50 border border-slate-200 rounded-lg'>
                  <p className='text-sm text-slate-700'>💡 초대 코드는 24시간 후에 만료됩니다.</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsInviteDialogOpen(false)}
                className='border-slate-300 text-slate-700 hover:bg-slate-50'
              >
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
