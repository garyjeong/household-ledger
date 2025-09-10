'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Zap, TrendingUp, Calendar, Tag, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  transactionData?: {
    amount: number
    category: string
    type: 'INCOME' | 'EXPENSE'
    date?: string
    memo?: string
  }
  autoClose?: boolean
  autoCloseDelay?: number
}

export function SuccessModal({
  isOpen,
  onClose,
  title = '성공',
  message = '거래가 추가되었습니다',
  transactionData,
  autoClose = false,
  autoCloseDelay = 3000,
}: SuccessModalProps) {
  const [showContent, setShowContent] = useState(false)
  const [progress, setProgress] = useState(0)

  // 모달이 열릴 때 애니메이션 시작
  useEffect(() => {
    if (isOpen) {
      setShowContent(false)
      setProgress(0)
      
      // 약간의 지연 후 컨텐츠 표시
      const contentTimer = setTimeout(() => {
        setShowContent(true)
      }, 100)

      // 자동 닫기 진행률 표시
      if (autoClose) {
        const progressTimer = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + (100 / (autoCloseDelay / 50))
            if (newProgress >= 100) {
              clearInterval(progressTimer)
              setTimeout(onClose, 100)
              return 100
            }
            return newProgress
          })
        }, 50)

        return () => {
          clearTimeout(contentTimer)
          clearInterval(progressTimer)
        }
      }

      return () => clearTimeout(contentTimer)
    } else {
      setShowContent(false)
      setProgress(0)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const getTypeInfo = (type: 'INCOME' | 'EXPENSE') => {
    return type === 'INCOME' 
      ? { 
          color: 'text-green-600', 
          bgColor: 'bg-green-50', 
          label: '수입',
          icon: TrendingUp
        }
      : { 
          color: 'text-red-600', 
          bgColor: 'bg-red-50', 
          label: '지출',
          icon: TrendingUp
        }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm w-full p-0 border-0 bg-transparent shadow-none"
      >
        <div className={cn(
          "bg-white rounded-2xl shadow-2xl overflow-hidden",
          "transform transition-all duration-500 ease-out",
          showContent ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}>
          {/* 자동 닫기 진행률 표시 */}
          {autoClose && (
            <div className="h-1 bg-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* 메인 컨텐츠 */}
          <div className="p-6 text-center">
            {/* 성공 아이콘 애니메이션 */}
            <div className={cn(
              "mx-auto mb-4 flex items-center justify-center",
              "w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500",
              "transform transition-all duration-700 ease-out delay-200",
              showContent ? "scale-100 rotate-0" : "scale-0 rotate-180"
            )}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            {/* 제목 */}
            <h2 className={cn(
              "text-xl font-bold text-gray-900 mb-2",
              "transform transition-all duration-500 ease-out delay-300",
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
              {title}
            </h2>

            {/* 메시지 */}
            <p className={cn(
              "text-gray-600 mb-6",
              "transform transition-all duration-500 ease-out delay-400",
              showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
              {message}
            </p>

            {/* 거래 정보 카드 */}
            {transactionData && (
              <div className={cn(
                "bg-gray-50 rounded-xl p-4 mb-6 text-left",
                "transform transition-all duration-500 ease-out delay-500",
                showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}>
                <div className="space-y-3">
                  {/* 금액 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">금액</span>
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      getTypeInfo(transactionData.type).color
                    )}>
                      {transactionData.type === 'EXPENSE' ? '-' : '+'}₩{formatAmount(transactionData.amount)}
                    </div>
                  </div>

                  {/* 카테고리 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">카테고리</span>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-xs font-medium",
                      getTypeInfo(transactionData.type).bgColor,
                      getTypeInfo(transactionData.type).color
                    )}>
                      {transactionData.category}
                    </div>
                  </div>

                  {/* 날짜 */}
                  {transactionData.date && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">날짜</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(transactionData.date).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}

                  {/* 메모 */}
                  {transactionData.memo && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">메모</span>
                      </div>
                      <span className="text-sm text-gray-600 text-right max-w-32 break-words">
                        {transactionData.memo}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 확인 버튼 */}
            {!autoClose && (
              <Button
                onClick={onClose}
                className={cn(
                  "w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
                  "text-white font-medium py-2.5 rounded-xl transition-all duration-200",
                  "transform transition-all duration-500 ease-out delay-600",
                  showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                )}
              >
                확인
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SuccessModal
