'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, TrendingUp, TrendingDown, Wallet, Zap, List, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useGroup } from '@/contexts/group-context'
import { useAlert } from '@/contexts/alert-context'
import { apiGet, apiPost } from '@/lib/api-client'
import AppHeader from '@/components/layouts/AppHeader'

export default function LedgerPage() {
  const router = useRouter()
  const [showPresets, setShowPresets] = useState(true)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [prefilledCategory, setPrefilledCategory] = useState('')
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; type: string; color: string | null; isDefault: boolean }>
  >([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { currentGroup } = useGroup()
  const { showSuccess, showError, showWarning } = useAlert()

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
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>로그인 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  // 카테고리 목록 가져오기
  const fetchCategories = async () => {
    if (!currentGroup) return

    setIsLoadingCategories(true)
    try {
      const response = await apiGet('/api/categories')

      if (response.ok) {
        setCategories(response.data?.categories || [])
      } else {
        console.error('카테고리 목록 가져오기 실패:', response.error)
      }
    } catch (error) {
      console.error('카테고리 가져오는 중 오류:', error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // 거래 추가 핸들러
  const handleOpenTransactionDialog = (category = '') => {
    setPrefilledCategory(category)
    setIsTransactionDialogOpen(true)
    // 다이얼로그 열 때 카테고리 목록 로드
    if (categories.length === 0) {
      fetchCategories()
    }
  }

  const handleTransactionSubmit = async (formData: {
    amount: string
    description: string
    category: string
    type: string
    date: string
  }) => {
    try {
      if (!currentGroup) {
        showWarning('그룹을 먼저 선택해주세요.')
        return
      }

      const response = await apiPost('/api/transactions/quick-add', {
        type: formData.type,
        amount: parseInt(formData.amount),
        categoryName: formData.category,
        memo: formData.description,
        date: formData.date,
        groupId: currentGroup.id,
      })

      if (response.ok) {
        setIsTransactionDialogOpen(false)
        setPrefilledCategory('')
        // 페이지 새로고침 또는 거래 목록 갱신
        window.location.reload()
      } else {
        showError(response.error || '거래 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('거래 추가 오류:', error)
      showError('거래 추가 중 오류가 발생했습니다.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center space-y-4 animate-fade-in'>
          <div className='relative'>
            <div className='w-12 h-12 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto'></div>
          </div>
          <p className='text-slate-600 text-base'>로그인이 필요합니다...</p>
          <Link href='/login'>
            <Button className='bg-slate-900 hover:bg-slate-800 text-white'>로그인하기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header with navigation */}
      <AppHeader showBackButton={true} showGroupInfo={true} />

      {/* Main content */}
      <div className='container-responsive py-4 sm:py-6'>
        {/* Quick Actions - Mobile Optimized */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6'>
          <Button
            variant={showPresets ? 'default' : 'outline'}
            size='sm'
            onClick={() => setShowPresets(!showPresets)}
            className='btn-touch cursor-pointer w-full sm:w-auto justify-center sm:justify-start'
          >
            <Zap className='h-4 w-4 mr-2' />
            {showPresets ? '프리셋 숨기기' : '프리셋 보기'}
          </Button>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className='grid-responsive gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8'>
          <Card className='bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover-desktop transition-all duration-300'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium text-emerald-700'>
                이번 달 수입
              </CardTitle>
              <TrendingUp className='h-4 w-4 sm:h-5 sm:w-5 text-emerald-600' />
            </CardHeader>
            <CardContent className='pb-3 sm:pb-6'>
              <div className='text-xl sm:text-2xl font-bold text-emerald-900'>₩0</div>
              <p className='text-xs text-emerald-600 mt-1'>전월 대비 +0%</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover-desktop transition-all duration-300'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium text-red-700'>
                이번 달 지출
              </CardTitle>
              <TrendingDown className='h-4 w-4 sm:h-5 sm:w-5 text-red-600' />
            </CardHeader>
            <CardContent className='pb-3 sm:pb-6'>
              <div className='text-xl sm:text-2xl font-bold text-red-900'>₩0</div>
              <p className='text-xs text-red-600 mt-1'>전월 대비 +0%</p>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover-desktop transition-all duration-300'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium text-blue-700'>잔액</CardTitle>
              <Wallet className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600' />
            </CardHeader>
            <CardContent className='pb-3 sm:pb-6'>
              <div className='text-xl sm:text-2xl font-bold text-blue-900'>₩0</div>
              <p className='text-xs text-blue-600 mt-1'>사용 가능 금액</p>
            </CardContent>
          </Card>
        </div>

        {/* Main content layout - Responsive Sidebar */}
        <div className={`${showPresets ? 'sidebar-layout' : 'w-full'}`}>
          {/* Left sidebar - Presets and Tools */}
          {showPresets && (
            <div className='sidebar space-y-4 sm:space-y-6'>
              <Card className='bg-white border-slate-200 shadow-sm'>
                <CardHeader className='border-b border-slate-100 pb-4'>
                  <CardTitle className='text-lg font-semibold text-slate-900 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Zap className='h-5 w-5 text-amber-500' />
                      빠른 입력
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-xs text-slate-600 hover:text-slate-900'
                      onClick={() => router.push('/settings/categories')}
                    >
                      관리
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-4'>
                  <div className='space-y-2'>
                    {categories.length > 0 ? (
                      // 지출 카테고리만 표시 (최대 12개)
                      categories
                        .filter(cat => cat.type === 'EXPENSE')
                        .slice(0, 12)
                        .map(category => (
                          <Button
                            key={category.id}
                            variant='outline'
                            size='sm'
                            className='w-full justify-start cursor-pointer'
                            onClick={() => handleOpenTransactionDialog(category.name)}
                          >
                            <div className='flex items-center gap-2 w-full'>
                              {category.color && (
                                <div
                                  className='w-3 h-3 rounded-full'
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              <Plus className='h-4 w-4' />
                              <span>{category.name}</span>
                            </div>
                          </Button>
                        ))
                    ) : (
                      <div className='text-center py-8 text-gray-500'>
                        <p className='text-sm'>카테고리를 추가하여</p>
                        <p className='text-sm'>빠른 입력을 사용해보세요</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content - Transaction list */}
          <div className='main-content'>
            <Card className='bg-white border-slate-200 shadow-sm hover-desktop transition-all duration-300'>
              <CardHeader className='border-b border-slate-100 pb-3 sm:pb-4'>
                <CardTitle className='text-base sm:text-lg font-semibold text-slate-900 flex items-center justify-between'>
                  <span className='flex items-center gap-2'>
                    <List className='h-4 w-4 sm:h-5 sm:w-5 text-slate-600' />
                    <span className='text-responsive-lg'>최근 거래 내역</span>
                  </span>
                  <Badge variant='secondary' className='bg-slate-100 text-slate-700 text-xs'>
                    0건
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-4 sm:pt-6'>
                <div className='text-center py-8 sm:py-12'>
                  <div className='w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-slate-100 rounded-full flex items-center justify-center'>
                    <List className='h-6 w-6 sm:h-8 sm:w-8 text-slate-400' />
                  </div>
                  <h3 className='text-base sm:text-lg font-medium text-slate-900 mb-2'>
                    아직 거래 내역이 없습니다
                  </h3>
                  <p className='text-sm sm:text-base text-slate-500 mb-4 sm:mb-6 px-4'>
                    첫 번째 거래를 추가하여 가계부를 시작해보세요
                  </p>
                  <Button
                    className='bg-slate-900 hover:bg-slate-800 text-white cursor-pointer btn-touch w-full sm:w-auto'
                    onClick={() => handleOpenTransactionDialog()}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    거래 추가
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction Dialog */}
        <TransactionDialog
          isOpen={isTransactionDialogOpen}
          onOpenChange={setIsTransactionDialogOpen}
          prefilledCategory={prefilledCategory}
          onSubmit={handleTransactionSubmit}
          categories={categories}
          isLoadingCategories={isLoadingCategories}
        />
      </div>
    </div>
  )
}

// Transaction Dialog Component
function TransactionDialog({
  isOpen,
  onOpenChange,
  prefilledCategory,
  onSubmit,
  categories,
  isLoadingCategories,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  prefilledCategory: string
  onSubmit: (data: {
    amount: string
    description: string
    category: string
    type: string
    date: string
  }) => void
  categories: Array<{
    id: string
    name: string
    type: string
    color: string | null
    isDefault: boolean
  }>
  isLoadingCategories: boolean
}) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: prefilledCategory,
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
  })

  // 프리셋 카테고리 변경 시 폼 업데이트
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      category: prefilledCategory,
    }))
  }, [prefilledCategory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || !formData.description || !formData.category) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    onSubmit(formData)
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: '',
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
    })
  }

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>거래 추가</DialogTitle>
          <DialogDescription>새로운 수입 또는 지출을 기록하세요.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='type'>유형</Label>
              <Select
                value={formData.type}
                onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='유형 선택' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='EXPENSE'>지출</SelectItem>
                  <SelectItem value='INCOME'>수입</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='amount'>금액</Label>
              <Input
                id='amount'
                type='number'
                placeholder='0'
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='category'>카테고리</Label>
            <Select
              value={formData.category}
              onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder='카테고리를 선택하세요' />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCategories ? (
                  <SelectItem value='loading' disabled>
                    로딩 중...
                  </SelectItem>
                ) : categories.length > 0 ? (
                  <>
                    {categories
                      .filter(cat => cat.type === formData.type || cat.type === 'TRANSFER')
                      .map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          <div className='flex items-center gap-2'>
                            {category.color && (
                              <div
                                className='w-3 h-3 rounded-full'
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            <span>{category.name}</span>
                            {category.isDefault && (
                              <span className='text-xs text-gray-500'>(기본)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </>
                ) : (
                  <SelectItem value='no-categories' disabled>
                    카테고리가 없습니다
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>설명</Label>
            <Input
              id='description'
              placeholder='거래 내용을 입력하세요'
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='date'>날짜</Label>
            <Input
              id='date'
              type='date'
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type='submit' className='bg-slate-900 hover:bg-slate-800 text-white'>
              추가하기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
