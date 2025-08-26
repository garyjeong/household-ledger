'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Delete, Check } from 'lucide-react'
import { AmountInputProps } from '@/types/couple-ledger'

/**
 * 신혼부부 가계부 전용 금액 입력 컴포넌트
 * - 모바일: 커스텀 숫자 키패드
 * - 데스크탑: 일반 입력 + 키보드 단축키
 * - 실시간 천단위 콤마 포맷팅
 * - 커서 위치 보존
 */
export function AmountInput({
  value,
  onChange,
  currency = 'KRW',
  placeholder = '0',
  showKeypad = true,
  autoFocus = false,
}: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null)

  // 천단위 콤마 포맷팅
  const formatAmount = useCallback((amount: string): string => {
    // 숫자만 추출
    const digits = amount.replace(/[^\d]/g, '')
    if (!digits) return ''
    
    // 천단위 콤마 추가
    return parseInt(digits).toLocaleString('ko-KR')
  }, [])

  // 숫자만 추출
  const getDigitsOnly = useCallback((amount: string): string => {
    return amount.replace(/[^\d]/g, '')
  }, [])

  // 금액 변경 처리
  const handleAmountChange = useCallback((newAmount: string) => {
    const formatted = formatAmount(newAmount)
    onChange(formatted)
  }, [formatAmount, onChange])

  // 키패드 숫자 입력
  const handleKeypadNumber = useCallback((digit: string) => {
    const currentDigits = getDigitsOnly(value)
    const newDigits = currentDigits + digit
    handleAmountChange(newDigits)
  }, [value, getDigitsOnly, handleAmountChange])

  // 천단위 빠른 입력
  const handleThousands = useCallback(() => {
    const currentDigits = getDigitsOnly(value)
    const newDigits = currentDigits + '000'
    handleAmountChange(newDigits)
  }, [value, getDigitsOnly, handleAmountChange])

  // 백스페이스
  const handleBackspace = useCallback(() => {
    const currentDigits = getDigitsOnly(value)
    if (currentDigits.length > 0) {
      const newDigits = currentDigits.slice(0, -1)
      handleAmountChange(newDigits)
    }
  }, [value, getDigitsOnly, handleAmountChange])

  // 전체 삭제
  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  // 키보드 입력 처리 (데스크탑)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 숫자 키만 허용
    if (!/^\d$/.test(e.key) && 
        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
      e.preventDefault()
    }
  }, [])

  // 직접 입력 처리
  const handleDirectInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    handleAmountChange(newValue)
  }, [handleAmountChange])

  // 포커스 처리
  useEffect(() => {
    if (autoFocus && inputRef) {
      inputRef.focus()
    }
  }, [autoFocus, inputRef])

  // 원화 표시
  const displayValue = value ? `${value}원` : ''

  return (
    <div className="space-y-4">
      {/* 금액 입력 필드 */}
      <div className="relative">
        <Input
          ref={setInputRef}
          type="text"
          inputMode="none" // 모바일에서 키보드 숨김
          value={displayValue}
          onChange={handleDirectInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`${placeholder}원`}
          className="text-right text-xl font-bold amount-display h-14 pr-12 text-text-primary"
          autoFocus={autoFocus}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-surface-tertiary"
          >
            <Delete className="h-4 w-4 text-text-muted" />
          </Button>
        )}
      </div>

      {/* 모바일 커스텀 키패드 */}
      {showKeypad && (
        <Card className="p-4 touch-device:block hover-device:hidden">
          <div className="grid grid-cols-3 gap-3">
            {/* 숫자 키패드 1-9 */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                onClick={() => handleKeypadNumber(num.toString())}
                className="touch-target text-lg font-semibold hover:bg-surface-secondary"
              >
                {num}
              </Button>
            ))}

            {/* 하단 행: 천단위, 0, 백스페이스 */}
            <Button
              type="button"
              variant="outline"
              onClick={handleThousands}
              className="touch-target text-sm font-medium text-primary hover:bg-primary/10"
            >
              000
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => handleKeypadNumber('0')}
              className="touch-target text-lg font-semibold hover:bg-surface-secondary"
            >
              0
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleBackspace}
              className="touch-target hover:bg-surface-secondary"
            >
              <Delete className="h-5 w-5 text-text-muted" />
            </Button>
          </div>

          {/* 빠른 금액 버튼 */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[1000, 5000, 10000, 50000].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="ghost"
                onClick={() => handleAmountChange(amount.toString())}
                className="h-10 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
              >
                {amount.toLocaleString()}원
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* 데스크탑 힌트 */}
      <div className="hover-device:block touch-device:hidden">
        <p className="text-xs text-text-muted text-center">
          숫자 키로 직접 입력 가능 • Enter: 다음 단계
        </p>
      </div>
    </div>
  )
}

// 금액 포맷 유틸리티 (별도 export)
export const formatKRW = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseInt(amount.replace(/[^\d]/g, '')) : amount
  if (isNaN(num) || num === 0) return '0원'
  return `${num.toLocaleString('ko-KR')}원`
}

// 금액 파싱 유틸리티
export const parseKRW = (formattedAmount: string): number => {
  const digits = formattedAmount.replace(/[^\d]/g, '')
  return parseInt(digits) || 0
}
