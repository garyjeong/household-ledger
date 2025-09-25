'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  X,
  Zap,
  Calendar,
  Save,
  BookmarkPlus,
  Loader2,
  Users,
  ArrowRight,
  Repeat,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  QuickAddModalProps,
  QuickAddForm,
  TransactionType,
} from '@/types/couple-ledger'
import { useCategories } from '@/hooks/use-categories'
import { useGroup } from '@/contexts/group-context'
import { useCreateRecurringRule } from '@/hooks/use-recurring-rules'
import { CategorySelectModal } from './CategorySelectModal'

// 날짜 빠른 선택 칩
const getDateChips = () => {
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  return [
    { label: '오늘', value: today.toISOString().split('T')[0] },
    { label: '어제', value: yesterday.toISOString().split('T')[0] },
    { label: '3일 전', value: threeDaysAgo.toISOString().split('T')[0] },
    { label: '7일 전', value: sevenDaysAgo.toISOString().split('T')[0] },
  ]
}

/**
 * 신혼부부 가계부 전용 빠른 입력 모달
 *
 * 단계별 입력 프로세스:
 * 1. 금액 입력 (포커스 기본, 모바일 키패드)
 * 2. 카테고리 선택 (최근 6개 칩 + 검색)
 * 3. 상세 정보 (결제수단, 날짜, 공동/개인 구분)
 * 4. 선택사항 (메모, 태그, 템플릿 저장)
 *
 * 키보드 단축키:
 * - Enter: 다음 단계 / 저장
 * - Shift+Enter: 저장 후 계속
 * - Escape: 취소
 */
export function QuickAddModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  templates = [],
}: QuickAddModalProps) {

  const [isLoading, setIsLoading] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const createRecurringRule = useCreateRecurringRule()

  // 현재 그룹 정보 가져오기
  const { currentGroup, isLoading: groupLoading } = useGroup()
  

  // 카테고리 가져오기: 현재 그룹과 선택된 타입 기준으로 서버에서 필터링
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories(
    currentGroup
      ? { groupId: currentGroup.id, type: formData.type }
      : { type: formData.type }
  )

  // 폼 상태
  const [formData, setFormData] = useState<QuickAddForm>({
    amount: '',
    categoryId: '',
    type: 'EXPENSE', // 기본값: 지출
    date: new Date().toISOString().split('T')[0],
    memo: '',
    payMethod: 'cash',
    person: 'me',
    tags: [],
    saveAsTemplate: false,
    isRecurring: false,
    recurringFrequency: 'MONTHLY',
    recurringDayRule: '',
  })

  // 카테고리 배열 추출 및 타입별 필터링
  const allCategories = categoriesData?.categories || []
  const categories = allCategories.filter(cat => cat.type === formData.type)
  
  // 선택된 카테고리 이름 찾기
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId)



  // 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        amount: initialData.amount?.toString() || '',
        categoryId: initialData.categoryId || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        memo: initialData.memo || '',
      }))

      // Split functionality removed from simplified schema
    }
  }, [initialData])

  // 금액 인풋 포커스 유지를 위한 ref
  const amountInputRef = useRef<HTMLInputElement | null>(null)

  // 모달 리셋
  const resetForm = useCallback(() => {
    setFormData({
      amount: '',
      categoryId: '',
      type: 'EXPENSE', // 기본값: 지출
      date: new Date().toISOString().split('T')[0],
      memo: '',
      payMethod: 'cash',
      person: 'me',
      tags: [],
      saveAsTemplate: false,
    })
  }, [])

  // 모달 닫기
  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])



  // 저장 처리
  const handleSave = useCallback(async () => {
    // 유효성 검사
    if (!formData.amount || !formData.categoryId) return

    if (formData.isRecurring && !formData.recurringDayRule) {
      alert('반복 거래의 날짜 규칙을 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      if (formData.isRecurring) {
        await createRecurringRule.mutateAsync({
          startDate: formData.date,
          frequency: formData.recurringFrequency as 'MONTHLY' | 'WEEKLY' | 'DAILY',
          dayRule: formData.recurringDayRule,
          amount: parseFloat(formData.amount.replace(/[^\d]/g, '')),
          categoryId: formData.categoryId,
          memo: formData.memo,
        })
        // 성공 시 모달을 닫고 폼을 리셋
        onClose()
        resetForm()
      } else {
        const amount = parseInt(formData.amount.replace(/[^\d]/g, '')) || 0
        const transactionType: TransactionType = formData.type === 'EXPENSE' ? 'expense' : 'income'
        await onSave({ ...formData, amount: amount.toString(), type: transactionType })
        // onSave 성공 후의 처리는 상위 컴포넌트(DesktopSidebar)에서 담당
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [formData, onSave, resetForm, onClose, createRecurringRule])

  // ESC 키 처리는 Dialog 컴포넌트에서 자동으로 처리됨





  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className='max-w-md w-full max-h-[90vh] p-0 flex flex-col'
        onClick={(e) => e.stopPropagation()}
      >
        {/* 고정 헤더 */}
        <div className='p-6 pb-4 border-b border-slate-200 flex-shrink-0'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg'>
                <Zap className='h-4 w-4 text-blue-600' />
              </div>
              <span className='text-lg font-bold text-slate-900'>빠른 입력</span>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* 스크롤 가능한 컨텐츠 영역 */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {/* 금액 입력 섹션 */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg'>
                <span className='text-lg'>💰</span>
              </div>
              <h3 className='text-base font-bold text-slate-900'>금액</h3>
            </div>

            <div className='relative'>
                <input
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]*'
                  value={formData.amount}
                  ref={amountInputRef}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '')
                    const formatted = value ? `${parseInt(value).toLocaleString()}원` : ''
                    setFormData(prev => ({ ...prev, amount: formatted }))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      e.preventDefault()
                      const digits = (formData.amount || '').replace(/[^\d]/g, '')
                      const nextDigits = digits.slice(0, -1)
                      const formatted = nextDigits ? `${parseInt(nextDigits).toLocaleString()}원` : ''
                      setFormData(prev => ({ ...prev, amount: formatted }))
                    }
                  }}
                  placeholder='0원'
                  autoFocus
                  className='w-full text-center text-3xl font-bold border-2 border-slate-200 rounded-lg py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                />
              </div>

            {/* 빠른 금액 선택 */}
            <div className='space-y-3'>
                <h4 className='text-sm font-semibold text-slate-700 flex items-center gap-2'>
                  🚀 빠른 선택
                </h4>
                <div className='grid grid-cols-3 gap-2'>
                  {[
                    { amount: 5000, label: '5,000원' },
                    { amount: 10000, label: '10,000원' },
                    { amount: 30000, label: '30,000원' },
                    { amount: 50000, label: '50,000원' },
                    { amount: 100000, label: '100,000원' },
                    { amount: 0, label: '직접입력' },
                  ].map((item) => (
                    <Button
                      key={item.amount}
                      type='button'
                      variant='outline'
                      onMouseDown={(e) => {
                        // 버튼 클릭 시 인풋 포커스가 이동하지 않도록 방지
                        e.preventDefault()
                      }}
                      onClick={() => {
                        if (item.amount === 0) {
                          setFormData(prev => ({ ...prev, amount: '' }))
                        } else {
                          const currentDigits = (formData.amount || '').replace(/[^\d]/g, '')
                          const currentValue = currentDigits ? parseInt(currentDigits) : 0
                          const nextValue = currentValue + item.amount
                          const formatted = nextValue ? `${nextValue.toLocaleString()}원` : ''
                          setFormData(prev => ({ ...prev, amount: formatted }))
                        }
                        // 클릭 후에도 금액 인풋 포커스 유지
                        const el = amountInputRef.current
                        if (el) {
                          el.focus()
                          try {
                            const len = el.value.length
                            el.setSelectionRange(len, len)
                          } catch {}
                        }
                      }}
                      className='h-12 flex items-center justify-center text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors'
                    >
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

          {/* 거래 타입 선택 섹션 */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg'>
                <span className='text-lg'>{formData.type === 'EXPENSE' ? '💸' : '💰'}</span>
              </div>
              <h3 className='text-base font-bold text-slate-900'>거래 타입</h3>
            </div>

            <div className='flex bg-slate-100 rounded-lg p-1'>
              <Button
                type='button'
                variant={formData.type === 'EXPENSE' ? 'default' : 'ghost'}
                className={`flex-1 h-10 ${
                  formData.type === 'EXPENSE' 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'hover:bg-slate-200'
                }`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, type: 'EXPENSE', categoryId: '' }))
                }}
              >
                💸 지출
              </Button>
              <Button
                type='button'
                variant={formData.type === 'INCOME' ? 'default' : 'ghost'}
                className={`flex-1 h-10 ${
                  formData.type === 'INCOME' 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'hover:bg-slate-200'
                }`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, type: 'INCOME', categoryId: '' }))
                }}
              >
                💰 수입
              </Button>
            </div>
          </div>

          {/* 카테고리 선택 섹션 */}
          <div className='space-y-4'>
            {groupLoading || categoriesLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin' />
                <span className='ml-2 text-sm text-gray-600'>
                  {groupLoading ? '그룹 정보 로딩 중...' : '카테고리 로딩 중...'}
                </span>
              </div>
            ) : categoriesError ? (
              <Card className='border-2 border-dashed border-red-300 bg-red-50'>
                <div className='p-6 text-center space-y-4'>
                  <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto'>
                    <X className='h-6 w-6 text-red-600' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900 mb-1'>카테고리를 불러올 수 없습니다</h4>
                    <p className='text-sm text-slate-600 mb-4'>
                      {categoriesError?.includes('401') || categoriesError?.includes('인증')
                        ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
                        : categoriesError}
                    </p>
                    <div className='flex gap-2 justify-center'>
                      {categoriesError?.includes('401') || categoriesError?.includes('인증') ? (
                        <Button
                          onClick={() => {
                            handleClose()
                            window.location.href = '/login'
                          }}
                          className='gap-2'
                        >
                          다시 로그인
                        </Button>
                      ) : (
                        <Button
                          variant='outline'
                          onClick={() => refetchCategories()}
                          className='gap-2'
                        >
                          다시 시도
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : !currentGroup ? (
              <Card className='border-2 border-dashed border-blue-300 bg-blue-50'>
                <div className='p-6 text-center space-y-4'>
                  <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto'>
                    <Users className='h-6 w-6 text-blue-600' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900 mb-1'>그룹이 필요합니다</h4>
                    <p className='text-sm text-slate-600 mb-4'>
                      빠른 입력을 사용하려면 먼저 가족 그룹을 생성하거나 참여해야 합니다.
                    </p>
                    <Button
                      onClick={() => {
                        handleClose()
                        // 그룹 관리 페이지로 이동
                        window.location.href = '/groups'
                      }}
                      className='w-full gap-2'
                    >
                      <Users className='h-4 w-4' />
                      그룹 관리로 이동
                      <ArrowRight className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : categoriesError ? (
              <div className='text-center py-8'>
                <p className='text-sm text-red-600'>카테고리를 불러오는데 실패했습니다.</p>
                <p className='text-xs text-gray-500 mt-1'>{categoriesError}</p>
              </div>
            ) : categories.length === 0 ? (
              <Card className='border-2 border-dashed border-amber-300 bg-amber-50'>
                <div className='p-6 text-center space-y-4'>
                  <div className='w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto'>
                    <span className='text-lg'>📂</span>
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900 mb-1'>카테고리가 없습니다</h4>
                    <p className='text-sm text-slate-600 mb-4'>
                      이 그룹에는 아직 카테고리가 없습니다. 카테고리를 먼저 생성해주세요.
                    </p>
                    <Button
                      onClick={() => {
                        handleClose()
                        // 카테고리 관리 페이지로 이동
                        window.location.href = '/categories'
                      }}
                      variant='outline'
                      className='w-full gap-2'
                    >
                      <span className='text-lg'>📂</span>
                      카테고리 관리로 이동
                      <ArrowRight className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsCategoryModalOpen(true)}
                className='w-full h-14 flex items-center justify-between px-4 border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg'>
                    <span className='text-lg'>📂</span>
                  </div>
                  <div className='text-left'>
                    <p className='text-sm font-medium text-slate-900'>
                      {selectedCategory ? selectedCategory.name : '카테고리 선택'}
                    </p>
                    <p className='text-xs text-slate-500'>
                      {selectedCategory
                        ? '다른 카테고리로 변경하려면 클릭'
                        : `${formData.type === 'INCOME' ? '수입' : '지출'} 카테고리를 선택해주세요`}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {selectedCategory && (
                    <div 
                      className='w-4 h-4 rounded-full'
                      style={{ backgroundColor: selectedCategory.color || '#6B7280' }}
                    />
                  )}
                  <ArrowRight className='h-4 w-4 text-slate-400' />
                </div>
              </Button>
            )}
          </div>

          {/* 날짜 선택 섹션 */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg'>
                <Calendar className='h-4 w-4 text-amber-600' />
              </div>
              <h3 className='text-base font-bold text-slate-900'>사용 날짜</h3>
            </div>

            <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-2 mb-2'>
                  {getDateChips().map(chip => (
                    <Button
                      key={chip.label}
                      type='button'
                      variant={formData.date === chip.value ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, date: chip.value }))}
                      className='h-8 text-xs px-3'
                    >
                      {chip.label}
                    </Button>
                  ))}
                </div>
                <Input
                  type='date'
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className='h-10'
                />
            </div>
          </div>

          {/* 메모 입력 섹션 */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg'>
                <BookmarkPlus className='h-4 w-4 text-slate-600' />
              </div>
              <h3 className='text-base font-bold text-slate-900'>메모 <span className='text-sm text-slate-500 font-normal'>(선택사항)</span></h3>
            </div>

            <Textarea
              value={formData.memo}
              onChange={e => setFormData(prev => ({ ...prev, memo: e.target.value }))}
              placeholder='메모를 입력해주세요 (예: 점심식사, 교통비 등)'
              className='h-20 resize-none'
            />
          </div>

          <div className='flex items-center justify-between mt-6'>
            <div className='flex items-center space-x-2'>
              <Switch
                id='isRecurring'
                checked={formData.isRecurring}
                onCheckedChange={value => setFormData(prev => ({ ...prev, isRecurring: value }))}
              />
              <Label htmlFor='isRecurring' className='flex items-center gap-2 cursor-pointer'>
                <Repeat className='h-4 w-4' />
                반복 거래로 등록
              </Label>
            </div>
          </div>

          {formData.isRecurring && (
            <div className='mt-4 p-4 bg-gray-50 rounded-lg space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='recurringFrequency'>반복 주기</Label>
                  <Select
                    value={formData.recurringFrequency}
                    onValueChange={value => setFormData(prev => ({ ...prev, recurringFrequency: value }))}
                  >
                    <SelectTrigger id='recurringFrequency'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='MONTHLY'>매월</SelectItem>
                      <SelectItem value='WEEKLY'>매주</SelectItem>
                      <SelectItem value='DAILY'>매일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='recurringDayRule'>날짜 규칙</Label>
                  <Input
                    id='recurringDayRule'
                    value={formData.recurringDayRule}
                    onChange={e => setFormData(prev => ({ ...prev, recurringDayRule: e.target.value }))}
                    placeholder='예: 매월 5일'
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 고정 하단 버튼 */}
        <div className='flex-shrink-0 p-6 pt-4 border-t border-slate-200 bg-white'>
          <div className='flex gap-3'>
            <Button type='button' variant='outline' onClick={handleClose} className='flex-1 h-14 text-base font-medium'>
              <X className='h-5 w-5 mr-2' />
              취소
            </Button>

            <Button
              type='button'
              onClick={handleSave}
              disabled={
                !formData.amount || 
                !formData.categoryId || 
                !currentGroup || 
                categories.length === 0 ||
                isLoading
              }
              className='flex-1 h-14 text-base font-medium disabled:opacity-50'
            >
              {isLoading ? (
                <span className='text-base'>저장 중...</span>
              ) : !currentGroup ? (
                <>
                  <Users className='h-5 w-5 mr-2' />
                  그룹 필요
                </>
              ) : categories.length === 0 ? (
                <>
                  <span className='text-lg mr-2'>📂</span>
                  카테고리 필요
                </>
              ) : (
                <>
                  <Save className='h-5 w-5 mr-2' />
                  저장
                </>
              )}
            </Button>
          </div>
        </div>

      </DialogContent>
      
      {/* 카테고리 선택 모달 */}
      <CategorySelectModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelect={(categoryId) => {
          setFormData(prev => ({ ...prev, categoryId }))
          setIsCategoryModalOpen(false)
        }}
        categories={categories}
        selectedId={formData.categoryId}
        type={formData.type}
      />
    </Dialog>
  )
}
