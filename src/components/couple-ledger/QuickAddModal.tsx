'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  X,
  Zap,
  Calendar,
  Save,
  BookmarkPlus,
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
import { CategoryPicker, defaultCategories } from './CategoryPicker'

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
  categories = defaultCategories,
  templates = [],
}: QuickAddModalProps) {

  const [isLoading, setIsLoading] = useState(false)

  // 폼 상태
  const [formData, setFormData] = useState<QuickAddForm>({
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    memo: '',
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
              disabled={!formData.amount || !formData.categoryId || isLoading}
              className='flex-1 h-14 text-base font-medium'
            >
              {isLoading ? (
                <span className='text-base'>저장 중...</span>
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
