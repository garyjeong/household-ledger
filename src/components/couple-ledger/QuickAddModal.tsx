'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  X,
  Zap,
  Calendar,
  Save,
  BookmarkPlus,
  Loader2,
  Users,
  ArrowRight,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  QuickAddModalProps,
  QuickAddForm,
} from '@/types/couple-ledger'
import { CategoryPicker } from './CategoryPicker'
import { useCategories } from '@/hooks/use-categories'
import { useGroup } from '@/contexts/group-context'

// 날짜 빠른 선택 칩
const getDateChips = () => {
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)

  return [
    { label: '오늘', value: today.toISOString().split('T')[0] },
    { label: '어제', value: yesterday.toISOString().split('T')[0] },
    { label: '3일 전', value: threeDaysAgo.toISOString().split('T')[0] },
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

  // 현재 그룹 정보 가져오기
  const { currentGroup, isLoading: groupLoading } = useGroup()

  // 현재 그룹의 카테고리만 가져오기
  const categoryFilters = useMemo(() => {
    if (!currentGroup?.id) return null
    
    return {
      ownerType: 'GROUP' as const,
      ownerId: currentGroup.id,
    }
  }, [currentGroup?.id])

  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategories(
    categoryFilters
  )

  // 카테고리 배열 추출
  const categories = categoriesData?.categories || []

  // 폼 상태
  const [formData, setFormData] = useState<QuickAddForm>({
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    memo: '',
    payMethod: 'cash',
    person: 'me',
    tags: [],
    saveAsTemplate: false,
  })



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

  // 모달 리셋
  const resetForm = useCallback(() => {
    setFormData({
      amount: '',
      categoryId: '',
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
    if (!formData.amount || !formData.categoryId) return

    setIsLoading(true)
    try {
      // 금액에서 숫자만 추출
      const amount = parseInt(formData.amount.replace(/[^\d]/g, '')) || 0
      
      const transactionData = {
        amount,
        categoryId: formData.categoryId,
        date: formData.date,
        memo: formData.memo,
        type: 'expense' as const,
        person: formData.person,
        payMethod: formData.payMethod,
        tags: formData.tags,
        userId: '', // 실제 구현에서는 현재 사용자 ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await onSave(transactionData)
      resetForm()
      onClose()
    } catch (error) {
      console.error('거래 저장 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [formData, onSave, resetForm, onClose])

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
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '')
                    const formatted = value ? `${parseInt(value).toLocaleString()}원` : ''
                    setFormData(prev => ({ ...prev, amount: formatted }))
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
                    { amount: 5000, label: '5천', emoji: '☕' },
                    { amount: 10000, label: '1만', emoji: '🍔' },
                    { amount: 30000, label: '3만', emoji: '🍕' },
                    { amount: 50000, label: '5만', emoji: '🛒' },
                    { amount: 100000, label: '10만', emoji: '💳' },
                    { amount: 0, label: '직접입력', emoji: '✏️' },
                  ].map((item) => (
                    <Button
                      key={item.amount}
                      type='button'
                      variant='outline'
                      onClick={() => {
                        if (item.amount === 0) {
                          setFormData(prev => ({ ...prev, amount: '' }))
                        } else {
                          setFormData(prev => ({ ...prev, amount: `${item.amount.toLocaleString()}원` }))
                        }
                      }}
                      className='h-12 flex flex-col items-center justify-center gap-1 text-xs font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors'
                    >
                      <span className='text-base'>{item.emoji}</span>
                      <span>{item.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

          {/* 카테고리 선택 섹션 */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg'>
                <span className='text-lg'>📂</span>
              </div>
              <h3 className='text-base font-bold text-slate-900'>카테고리</h3>
            </div>

            {groupLoading || categoriesLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-6 w-6 animate-spin' />
                <span className='ml-2 text-sm text-gray-600'>
                  {groupLoading ? '그룹 정보 로딩 중...' : '카테고리 로딩 중...'}
                </span>
              </div>
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
              <CategoryPicker
                categories={categories}
                selectedId={formData.categoryId}
                onSelect={categoryId => setFormData(prev => ({ ...prev, categoryId }))}
                type='expense'
                showFavorites
                recentCategories={[]} 
                showAddButton={false}
                maxDisplayCategories={6}
                showMoreModal={true}
              />
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
                <div className='flex gap-2 mb-2'>
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
    </Dialog>
  )
}
