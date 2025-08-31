'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Zap,
  Calendar,
  CreditCard,
  Tag,
  Save,
  RotateCcw,
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
  PayMethod,
  Person,
  SplitRule,
} from '@/types/couple-ledger'
import { AmountInput, parseKRW } from './AmountInput'
import { CategoryPicker, defaultCategories } from './CategoryPicker'
import { CoupleSplitToggle } from './CoupleSplitToggle'

// 결제 수단 옵션
const paymentMethods: Array<{ value: PayMethod; label: string; icon: string }> = [
  { value: 'credit', label: '카드', icon: '💳' },
  { value: 'cash', label: '현금', icon: '💵' },
  { value: 'transfer', label: '계좌이체', icon: '🏦' },
  { value: 'debit', label: '체크카드', icon: '💰' },
  { value: 'other', label: '기타', icon: '📝' },
]

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
  const [step, setStep] = useState<'amount' | 'category' | 'details' | 'confirm'>('amount')
  const [isLoading, setIsLoading] = useState(false)

  // 폼 상태
  const [formData, setFormData] = useState<QuickAddForm>({
    amount: '',
    categoryId: '',
    payMethod: 'credit',
    date: new Date().toISOString().split('T')[0],
    person: 'me',
    memo: '',
    tags: [],
    saveAsTemplate: false,
    templateName: '',
  })

  const [splitRule, setSplitRule] = useState<SplitRule>({ me: 50, partner: 50 })
  const [tagInput, setTagInput] = useState('')

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        amount: initialData.amount?.toString() || '',
        categoryId: initialData.categoryId || '',
        payMethod: (initialData.payMethod as PayMethod) || 'credit',
        date: initialData.date || new Date().toISOString().split('T')[0],
        person: initialData.person || 'me',
        memo: initialData.memo || '',
        tags: initialData.tags || [],
      }))

      // Split functionality removed from simplified schema
    }
  }, [initialData])

  // 모달 리셋
  const resetForm = useCallback(() => {
    setFormData({
      amount: '',
      categoryId: '',
      payMethod: 'credit',
      date: new Date().toISOString().split('T')[0],
      person: 'me',
      memo: '',
      tags: [],
      saveAsTemplate: false,
      templateName: '',
    })
    setSplitRule({ me: 50, partner: 50 })
    setTagInput('')
    setStep('amount')
  }, [])

  // 모달 닫기
  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  // 다음 단계
  const handleNext = useCallback(() => {
    switch (step) {
      case 'amount':
        if (formData.amount) setStep('category')
        break
      case 'category':
        if (formData.categoryId) setStep('details')
        break
      case 'details':
        setStep('confirm')
        break
      case 'confirm':
        handleSave()
        break
    }
  }, [step, formData])

  // 이전 단계
  const handlePrev = useCallback(() => {
    switch (step) {
      case 'category':
        setStep('amount')
        break
      case 'details':
        setStep('category')
        break
      case 'confirm':
        setStep('details')
        break
    }
  }, [step])

  // 저장 처리
  const handleSave = useCallback(async () => {
    if (!formData.amount || !formData.categoryId) return

    setIsLoading(true)
    try {
      const transactionData = {
        amount: parseKRW(formData.amount),
        categoryId: formData.categoryId,
        payMethod: formData.payMethod,
        date: formData.date,
        person: formData.person,
        memo: formData.memo,
        tags: formData.tags,
        type: 'expense' as const,
        isShared: formData.person === 'shared',
        split: formData.person === 'shared' ? splitRule : undefined,
        userId: '', // 실제 구현에서는 현재 사용자 ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await onSave(transactionData)

      // 템플릿 저장 기능 (향후 구현 예정)
      if (formData.saveAsTemplate && formData.templateName) {
        console.log('템플릿 저장 기능은 향후 구현 예정입니다:', formData.templateName)
      }

      resetForm()
      onClose()
    } catch (error) {
      console.error('거래 저장 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [formData, splitRule, onSave, resetForm, onClose])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        handleSave() // 저장 후 계속
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose, handleNext, handleSave])

  // 태그 추가
  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }, [tagInput, formData.tags])

  // 태그 제거
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }, [])

  // 진행률 계산
  const progress = {
    amount: step === 'amount' ? 25 : formData.amount ? 25 : 0,
    category: step === 'category' ? 50 : formData.categoryId ? 25 : 0,
    details: step === 'details' ? 75 : formData.amount && formData.categoryId ? 25 : 0,
    confirm: step === 'confirm' ? 100 : 0,
  }
  const totalProgress = Object.values(progress).reduce((sum, val) => sum + val, 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md w-full max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-primary' />
            빠른 입력
            <Badge variant='secondary' className='ml-auto text-xs'>
              {step === 'amount' && '1/4'}
              {step === 'category' && '2/4'}
              {step === 'details' && '3/4'}
              {step === 'confirm' && '4/4'}
            </Badge>
          </DialogTitle>

          {/* 진행률 바 */}
          <div className='w-full bg-surface-tertiary rounded-full h-2 overflow-hidden'>
            <div
              className='h-full bg-primary transition-all duration-300'
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </DialogHeader>

        <div className='space-y-6'>
          {/* 1단계: 금액 입력 */}
          {step === 'amount' && (
            <div className='space-y-4'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-text-primary mb-2'>
                  얼마를 사용하셨나요?
                </h3>
                <p className='text-sm text-text-secondary'>금액을 입력해주세요</p>
              </div>

              <AmountInput
                value={formData.amount}
                onChange={value => setFormData(prev => ({ ...prev, amount: value }))}
                autoFocus
                showKeypad
                currency="KRW"
              />
            </div>
          )}

          {/* 2단계: 카테고리 선택 */}
          {step === 'category' && (
            <div className='space-y-4'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-text-primary mb-2'>
                  어떤 용도로 사용하셨나요?
                </h3>
                <p className='text-sm text-text-secondary'>카테고리를 선택해주세요</p>
              </div>

              <CategoryPicker
                categories={categories}
                selectedId={formData.categoryId}
                onSelect={categoryId => setFormData(prev => ({ ...prev, categoryId }))}
                type='expense'
                showFavorites
                recentCategories={[]} // 실제 최근 사용 카테고리 데이터 연동 필요
              />
            </div>
          )}

          {/* 3단계: 상세 정보 */}
          {step === 'details' && (
            <div className='space-y-6'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-text-primary mb-2'>
                  상세 정보를 입력해주세요
                </h3>
                <p className='text-sm text-text-secondary'>
                  결제 방법과 날짜, 분할 정보를 설정하세요
                </p>
              </div>

              {/* 결제 수단 */}
              <div className='space-y-3'>
                <label className='text-sm font-medium text-text-primary flex items-center gap-2'>
                  <CreditCard className='h-4 w-4' />
                  결제 수단
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  {paymentMethods.map(method => (
                    <Button
                      key={method.value}
                      type='button'
                      variant={formData.payMethod === method.value ? 'default' : 'outline'}
                      onClick={() => setFormData(prev => ({ ...prev, payMethod: method.value }))}
                      className='h-12 flex flex-col items-center gap-1 text-xs'
                    >
                      <span className='text-sm'>{method.icon}</span>
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 날짜 선택 */}
              <div className='space-y-3'>
                <label className='text-sm font-medium text-text-primary flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  사용 날짜
                </label>
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

              {/* 공동/개인 구분 */}
              <CoupleSplitToggle
                selectedPerson={formData.person}
                onPersonChange={person => setFormData(prev => ({ ...prev, person }))}
                splitRule={splitRule}
                onSplitChange={setSplitRule}
                defaultSplit={50}
                myName='나'
                partnerName='배우자'
              />
            </div>
          )}

          {/* 4단계: 확인 및 추가 옵션 */}
          {step === 'confirm' && (
            <div className='space-y-6'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-text-primary mb-2'>
                  입력 내용을 확인해주세요
                </h3>
                <p className='text-sm text-text-secondary'>메모나 태그를 추가하고 저장하세요</p>
              </div>

              {/* 입력 요약 */}
              <Card className='p-4 bg-surface-secondary'>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-text-secondary'>금액</span>
                    <span className='font-bold text-lg amount-display'>{formData.amount}원</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-text-secondary'>카테고리</span>
                    <span className='text-sm font-medium'>
                      {categories.find(c => c.id === formData.categoryId)?.name}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-text-secondary'>결제 수단</span>
                    <span className='text-sm'>
                      {paymentMethods.find(m => m.value === formData.payMethod)?.label}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-text-secondary'>구분</span>
                    <span className='text-sm'>
                      {formData.person === 'me' && '개인 지출'}
                      {formData.person === 'partner' && '배우자 지출'}
                      {formData.person === 'shared' &&
                        `공동 지출 (${splitRule.me}:${splitRule.partner})`}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 메모 */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-text-primary'>메모 (선택사항)</label>
                <Textarea
                  value={formData.memo}
                  onChange={e => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder='메모를 입력하세요...'
                  className='h-20 resize-none'
                />
              </div>

              {/* 태그 */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-text-primary flex items-center gap-2'>
                  <Tag className='h-4 w-4' />
                  태그 (선택사항)
                </label>
                <div className='flex gap-2'>
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    placeholder='태그 입력 후 Enter'
                    className='h-8 text-sm'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleAddTag}
                    className='h-8 px-3 text-sm'
                  >
                    추가
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {formData.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant='secondary'
                        className='text-xs cursor-pointer hover:bg-surface-tertiary'
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 템플릿 저장 */}
              <div className='space-y-2'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.saveAsTemplate}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        saveAsTemplate: e.target.checked,
                      }))
                    }
                    className='rounded border-gray-200'
                  />
                  <BookmarkPlus className='h-4 w-4' />
                  <span className='text-sm font-medium'>템플릿으로 저장</span>
                </label>
                {formData.saveAsTemplate && (
                  <Input
                    value={formData.templateName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        templateName: e.target.value,
                      }))
                    }
                    placeholder='템플릿 이름'
                    className='h-8 text-sm'
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className='flex gap-2 pt-4 border-t border-gray-200'>
          {step !== 'amount' && (
            <Button type='button' variant='outline' onClick={handlePrev} className='flex-1 h-12'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              이전
            </Button>
          )}

          <Button type='button' variant='ghost' onClick={handleClose} className='px-4'>
            <X className='h-4 w-4' />
          </Button>

          <Button
            type='button'
            onClick={step === 'confirm' ? handleSave : handleNext}
            disabled={
              (step === 'amount' && !formData.amount) ||
              (step === 'category' && !formData.categoryId) ||
              isLoading
            }
            className='flex-1 h-12'
          >
            {isLoading ? (
              '저장 중...'
            ) : step === 'confirm' ? (
              <>
                <Save className='h-4 w-4 mr-2' />
                저장
              </>
            ) : (
              <>
                다음
                <ArrowRight className='h-4 w-4 ml-2' />
              </>
            )}
          </Button>
        </div>

        {/* 키보드 단축키 힌트 */}
        <div className='text-xs text-text-muted text-center space-x-4'>
          <span>Enter: 다음/저장</span>
          <span>Shift+Enter: 저장 후 계속</span>
          <span>Esc: 취소</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
