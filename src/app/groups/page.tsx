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
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { useToast } from '@/hooks/use-toast'
import { ResponsiveLayout } from '@/components/couple-ledger/DesktopSidebar'
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
  const { user, isAuthenticated } = useAuth()
  const { groups, isLoading, createGroup, generateInvite, joinGroupByCode, switchGroup } =
    useGroup()
  const { toast } = useToast()

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
    try {
    const result = await createGroup(data.name)

    if (result.success) {
      setIsCreateDialogOpen(false)
      createForm.reset()
        
        // 성공 토스트 알림
        toast({
          title: "✅ 그룹 생성 성공!",
          description: `"${data.name}" 그룹이 성공적으로 생성되었습니다.`,
          duration: 3000,
        })
    } else {
      createForm.setError('root', { message: result.error })
        
        // 에러 토스트 알림
        toast({
          variant: "destructive",
          title: "❌ 그룹 생성 실패",
          description: result.error || '그룹 생성에 실패했습니다.',
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Create group error:', error)
      const errorMessage = '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
      
      createForm.setError('root', { message: errorMessage })
      
      toast({
        variant: "destructive",
        title: "🌐 네트워크 오류",
        description: errorMessage,
        duration: 5000,
      })
    }
  }

  const handleJoinGroup = async (data: JoinGroupFormData) => {
    try {
    const result = await joinGroupByCode(data.inviteCode)

    if (result.success) {
      setIsJoinDialogOpen(false)
      joinForm.reset()
        
        // 성공 토스트 알림
        toast({
          title: "✅ 그룹 참여 성공!",
          description: "그룹에 성공적으로 참여했습니다.",
          duration: 3000,
        })
    } else {
        const errorMessage = result.error || '그룹 참여에 실패했습니다. 초대 코드를 다시 확인해주세요.'
        
        // 폼 에러 설정
        joinForm.setError('root', { message: errorMessage })
        
        // 토스트 알림으로도 에러 표시
        toast({
          variant: "destructive",
          title: "❌ 그룹 참여 실패",
          description: errorMessage,
          duration: 5000,
        })
        
        // 입력 필드 값은 유지하되 포커스 설정
        setTimeout(() => {
          const inviteCodeInput = document.getElementById('inviteCode') as HTMLInputElement
          if (inviteCodeInput) {
            inviteCodeInput.focus()
            inviteCodeInput.select() // 전체 텍스트 선택
          }
        }, 100)
        console.log('Join group failed:', result.error) // 디버깅용
      }
    } catch (error) {
      console.error('Join group error:', error)
      const networkErrorMessage = '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
      
      joinForm.setError('root', { message: networkErrorMessage })
      
      // 토스트 알림으로도 에러 표시
      toast({
        variant: "destructive",
        title: "🌐 네트워크 오류",
        description: networkErrorMessage,
        duration: 5000,
      })
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
      <ResponsiveLayout>
        <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
          <div className='animate-pulse space-y-6'>
            <div className='space-y-2'>
              <div className='h-8 bg-slate-200 rounded w-48'></div>
              <div className='h-4 bg-slate-200 rounded w-64'></div>
            </div>
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
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout>
      <div className='w-full max-w-none px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
      {/* Header */}
        <div className='sticky top-0 z-20 bg-white pb-6 mb-8 border-b border-gray-100'>
          <div className='pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div>
              <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>그룹 관리</h1>
                {groups.length > 0 && (
                  <p className='text-slate-600 mt-1'>
                    {`${groups.length}개의 그룹에 참여 중입니다`}
                  </p>
                )}
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

              <Button
                className='bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className='h-4 w-4 mr-2' />
                새 그룹 만들기
              </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
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

        {/* 그룹 생성 다이얼로그 */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent 
            className='max-w-md w-full p-0'
            onClick={(e) => e.stopPropagation()}
          >
            {/* 고정 헤더 */}
            <div className='p-6 pb-4 border-b border-slate-200'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-3'>
                  <div className='flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg'>
                    <Users className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <span className='text-xl font-bold text-slate-900'>새 그룹 만들기</span>
                    <DialogDescription className='text-sm text-slate-600 mt-1'>
                      함께 가계부를 관리할 그룹을 만들어보세요
                    </DialogDescription>
                  </div>
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* 컨텐츠 영역 */}
            <div className='p-6 space-y-6'>
              <form onSubmit={createForm.handleSubmit(handleCreateGroup)} className='space-y-6'>
                {/* 그룹 이름 입력 섹션 */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg'>
                      <span className='text-lg'>✨</span>
                    </div>
                    <h3 className='text-base font-semibold text-slate-900'>그룹 정보</h3>
                  </div>
                  
                  <div className='space-y-2'>
                    <Label htmlFor='name' className='text-sm font-medium text-slate-700'>
                      그룹 이름
                    </Label>
                    <Input
                      id='name'
                      placeholder='예: 우리 가족, 신혼부부'
                      {...createForm.register('name')}
                      className='h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500'
                      disabled={createForm.formState.isSubmitting}
                    />
                    {createForm.formState.errors.name && (
                      <p className='text-sm text-red-600 flex items-center gap-1'>
                        <span className='w-1 h-1 bg-red-600 rounded-full'></span>
                        {createForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 미리보기 카드 */}
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg'>
                      <span className='text-lg'>👀</span>
                    </div>
                    <h3 className='text-base font-semibold text-slate-900'>미리보기</h3>
                  </div>
                  
                  <Card className='border-2 border-dashed border-slate-200 bg-slate-50'>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center'>
                          <Users className='h-5 w-5 text-white' />
                        </div>
                        <div>
                          <p className='font-medium text-slate-900'>
                            {createForm.watch('name') || '그룹 이름을 입력해주세요'}
                          </p>
                          <p className='text-sm text-slate-500'>
                            {user?.nickname || user?.email} · 관리자
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 에러 메시지 */}
                {createForm.formState.errors.root && (
                  <div className='p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3'>
                    <div className='w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                      <span className='text-red-600 text-xs'>!</span>
                    </div>
                    <p className='text-sm text-red-700'>
                      {createForm.formState.errors.root.message}
                    </p>
                  </div>
                )}

                {/* 버튼 영역 */}
                <DialogFooter className='gap-3 pt-4 border-t border-slate-200'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsCreateDialogOpen(false)}
                    className='flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50'
                    disabled={createForm.formState.isSubmitting}
                  >
                    취소
                  </Button>
                  <Button 
                    type='submit' 
                    className='flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg'
                    disabled={createForm.formState.isSubmitting || !createForm.watch('name')?.trim()}
                  >
                    {createForm.formState.isSubmitting ? (
                      <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        만드는 중...
                      </div>
                    ) : (
                      <div className='flex items-center gap-2'>
                        <Plus className='h-4 w-4' />
                        그룹 만들기
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* 그룹 참여 다이얼로그 */}
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogContent 
            className='max-w-md w-full p-0 max-h-[90vh] flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            {/* 고정 헤더 */}
            <div className='flex-shrink-0 p-6 pb-4 border-b border-slate-200'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-3'>
                  <div className='flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg'>
                    <UserPlus className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <span className='text-xl font-bold text-slate-900'>그룹 참여하기</span>
                    <DialogDescription className='text-sm text-slate-600 mt-1'>
                      초대 코드를 입력하여 그룹에 참여하세요
                    </DialogDescription>
                  </div>
                </DialogTitle>
              </DialogHeader>
            </div>

            <form onSubmit={joinForm.handleSubmit(handleJoinGroup)} className='flex flex-col flex-1 min-h-0'>
              {/* 스크롤 가능한 컨텐츠 영역 */}
              <div className='flex-1 overflow-auto p-6 space-y-6'>
                {/* 초대 코드 입력 섹션 */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center justify-center w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg shadow-md'>
                      <span className='text-lg'>🔑</span>
                    </div>
                    <h3 className='text-base font-semibold text-slate-900'>초대 코드 입력</h3>
                  </div>
                  
                  <Card className='border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'>
                    <CardContent className='p-6'>
                      <div className='space-y-4'>
                        <div className='text-center'>
                          <div className='w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg'>
                            <UserPlus className='h-8 w-8 text-white' />
                          </div>
                          <Label htmlFor='inviteCode' className='text-lg font-semibold text-slate-800 block mb-2'>
                            초대 코드를 입력하세요
                          </Label>
                        </div>
                        
                        <div className='relative'>
                          <Input
                            id='inviteCode'
                            placeholder='예: ABC123XYZ0'
                            {...joinForm.register('inviteCode')}
                            className={`h-16 text-2xl border-2 transition-all duration-300 font-mono text-center tracking-[0.3em] uppercase
                              ${joinForm.watch('inviteCode')?.length === 10 
                                ? 'border-green-400 bg-green-50 shadow-lg' 
                                : 'border-slate-300 bg-white hover:border-green-300'
                              } focus:border-green-500 focus:ring-green-500`}
                            disabled={joinForm.formState.isSubmitting}
                            maxLength={10}
                            style={{ letterSpacing: '0.3em' }}
                          />
                          
                          {/* 초대 코드 자릿수 안내 */}
                          <div className='mt-3'>
                            <div className='flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-lg'>
                              <div className='w-4 h-4 bg-slate-400 rounded-full flex items-center justify-center'>
                                <span className='text-white text-xs font-bold'>i</span>
                              </div>
                              <span className='text-sm text-slate-600 font-medium'>
                                초대 코드는 <span className='font-bold text-slate-800'>10자</span>입니다
                              </span>
                            </div>
                          </div>
                          
                          {/* 완성 시 체크 표시 */}
                          {joinForm.watch('inviteCode')?.length === 10 && (
                            <div className='absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce'>
                              <Check className='h-4 w-4 text-white' />
                            </div>
                          )}
                        </div>
                        
                        {joinForm.formState.errors.inviteCode && (
                          <div className='p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2'>
                            <div className='w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0'>
                              <span className='text-red-600 text-xs'>!</span>
                            </div>
                            <p className='text-sm text-red-700'>
                              {joinForm.formState.errors.inviteCode.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 도움말 섹션 */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg shadow-md'>
                      <span className='text-lg'>💡</span>
                    </div>
                    <h3 className='text-base font-semibold text-slate-900'>도움이 필요하신가요?</h3>
                  </div>
                  
                  <div className='grid grid-cols-1 gap-3'>
                    <Card className='border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50'>
                      <CardContent className='p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                            <span className='text-purple-600 font-bold text-sm'>1</span>
                          </div>
                          <div>
                            <h4 className='font-semibold text-purple-800 mb-1'>초대 코드 받기</h4>
                            <p className='text-sm text-purple-700'>그룹 관리자에게 10자리 초대 코드를 요청하세요</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className='border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50'>
                      <CardContent className='p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                            <span className='text-blue-600 font-bold text-sm'>2</span>
                          </div>
                          <div>
                            <h4 className='font-semibold text-blue-800 mb-1'>코드 형식</h4>
                            <p className='text-sm text-blue-700'>영문자(대소문자)와 숫자로 구성된 10자리 코드입니다</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className='border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'>
                      <CardContent className='p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                            <span className='text-amber-600 font-bold text-sm'>⏰</span>
                          </div>
                          <div>
                            <h4 className='font-semibold text-amber-800 mb-1'>유효 시간</h4>
                            <p className='text-sm text-amber-700'>초대 코드는 생성 후 24시간 동안만 사용 가능합니다</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </div>

              {/* 에러 메시지 - 고정 영역으로 이동 */}
              {joinForm.formState.errors.root && (
                <div className='flex-shrink-0 px-6 pb-4 animate-in slide-in-from-bottom-4 duration-300'>
                  <div className='p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-lg flex items-start gap-3 shadow-lg animate-pulse'>
                    <div className='w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 animate-bounce'>
                      <span className='text-white text-sm font-bold'>!</span>
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-bold text-red-800 mb-1'>
                        ❌ 참여 실패
                      </p>
                      <p className='text-sm text-red-700 font-medium'>
                        {joinForm.formState.errors.root.message}
                      </p>
                      <p className='text-xs text-red-600 mt-2'>
                        초대 코드를 다시 확인하거나 그룹 관리자에게 문의하세요.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 고정 버튼 영역 */}
              <div className='flex-shrink-0 p-6 pt-4 border-t border-slate-200 bg-white'>
                <div className='flex gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsJoinDialogOpen(false)}
                    className='flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50'
                    disabled={joinForm.formState.isSubmitting}
                  >
                    취소
                  </Button>
                  <Button 
                    type='submit' 
                    className='flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg'
                    disabled={joinForm.formState.isSubmitting || !joinForm.watch('inviteCode')?.trim()}
                  >
                    {joinForm.formState.isSubmitting ? (
                      <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        참여 중...
                      </div>
                    ) : (
                      <div className='flex items-center gap-2'>
                        <UserPlus className='h-4 w-4' />
                        그룹 참여하기
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* 초대 링크 다이얼로그 */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent 
            className='max-w-lg w-full p-0'
            onClick={(e) => e.stopPropagation()}
          >
            {/* 고정 헤더 */}
            <div className='p-6 pb-4 border-b border-slate-200'>
            <DialogHeader>
                <DialogTitle className='flex items-center gap-3'>
                  <div className='flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg'>
                    <LinkIcon className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <span className='text-xl font-bold text-slate-900'>그룹 초대하기</span>
                    <DialogDescription className='text-sm text-slate-600 mt-1'>
                      초대 코드나 링크를 공유하여 새로운 멤버를 초대하세요
              </DialogDescription>
                  </div>
                </DialogTitle>
            </DialogHeader>
            </div>

            {/* 컨텐츠 영역 */}
            <div className='p-6 space-y-6'>
            {inviteData && (
                <>
                  {/* 초대 코드 섹션 */}
              <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <div className='flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg'>
                        <span className='text-lg'>🔑</span>
                      </div>
                      <h3 className='text-base font-semibold text-slate-900'>초대 코드</h3>
                    </div>
                    
                    <Card className='border-2 border-orange-200 bg-orange-50'>
                      <CardContent className='p-4'>
                        <div className='flex items-center gap-3'>
                          <div className='flex-1'>
                            <Input 
                              value={inviteData.code} 
                              readOnly 
                              className='h-12 text-center text-lg font-mono tracking-wider border-orange-300 bg-white font-bold'
                            />
                          </div>
                    <Button
                      type='button'
                      onClick={() => copyToClipboard(inviteData.code, 'code')}
                            className={`h-12 px-4 ${
                              copiedInvite === 'code' 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-orange-500 hover:bg-orange-600'
                            } text-white`}
                    >
                      {copiedInvite === 'code' ? (
                              <div className='flex items-center gap-2'>
                        <Check className='h-4 w-4' />
                                복사됨
                              </div>
                      ) : (
                              <div className='flex items-center gap-2'>
                        <Copy className='h-4 w-4' />
                                복사
                              </div>
                      )}
                    </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 초대 링크 섹션 */}
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg'>
                        <span className='text-lg'>🔗</span>
                      </div>
                      <h3 className='text-base font-semibold text-slate-900'>초대 링크</h3>
                </div>

                    <Card className='border-2 border-blue-200 bg-blue-50'>
                      <CardContent className='p-4'>
                        <div className='space-y-3'>
                          <div className='flex items-center gap-3'>
                            <div className='flex-1'>
                              <Input 
                                value={inviteData.url} 
                                readOnly 
                                className='h-10 text-sm border-blue-300 bg-white font-mono'
                              />
                            </div>
                    <Button
                      type='button'
                      onClick={() => copyToClipboard(inviteData.url, 'url')}
                              className={`h-10 px-4 ${
                                copiedInvite === 'url' 
                                  ? 'bg-green-500 hover:bg-green-600' 
                                  : 'bg-blue-500 hover:bg-blue-600'
                              } text-white`}
                    >
                      {copiedInvite === 'url' ? (
                                <div className='flex items-center gap-2'>
                        <Check className='h-4 w-4' />
                                  복사됨
                                </div>
                      ) : (
                                <div className='flex items-center gap-2'>
                        <Copy className='h-4 w-4' />
                                  복사
                                </div>
                      )}
                    </Button>
                          </div>
                          <p className='text-xs text-blue-700'>
                            링크를 클릭하면 자동으로 그룹 참여 페이지로 이동합니다
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 안내 메시지 */}
                  <div className='space-y-3'>
                    <div className='flex items-center gap-2'>
                      <div className='flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg'>
                        <span className='text-lg'>⏰</span>
                      </div>
                      <h3 className='text-base font-semibold text-slate-900'>중요 안내</h3>
                </div>

                    <Card className='border border-amber-200 bg-amber-50'>
                      <CardContent className='p-4'>
                        <div className='space-y-2 text-sm text-amber-800'>
                          <p className='flex items-center gap-2'>
                            <span className='w-1.5 h-1.5 bg-amber-600 rounded-full'></span>
                            초대 코드는 <strong>24시간 후</strong> 자동으로 만료됩니다
                          </p>
                          <p className='flex items-center gap-2'>
                            <span className='w-1.5 h-1.5 bg-amber-600 rounded-full'></span>
                            하나의 초대 코드로 <strong>여러 명</strong>이 참여할 수 있습니다
                          </p>
                          <p className='flex items-center gap-2'>
                            <span className='w-1.5 h-1.5 bg-amber-600 rounded-full'></span>
                            카카오톡, 문자메시지 등으로 <strong>안전하게 공유</strong>하세요
                          </p>
                </div>
                      </CardContent>
                    </Card>
              </div>
                </>
            )}

              {/* 버튼 영역 */}
              <DialogFooter className='pt-4 border-t border-slate-200'>
              <Button
                type='button'
                onClick={() => setIsInviteDialogOpen(false)}
                  className='w-full h-12 bg-slate-600 hover:bg-slate-700 text-white'
              >
                닫기
              </Button>
            </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsiveLayout>
  )
}
