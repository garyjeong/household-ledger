'use client'

import React, { useEffect, useState, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Undo2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { onToast, type ToastMessage } from '@/lib/adapters/context-bridge'

interface ExtendedToastMessage extends ToastMessage {
  isVisible: boolean
  isExiting: boolean
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
  showError: (message: string, options?: Partial<ToastMessage>) => void
  showSuccess: (message: string, options?: Partial<ToastMessage>) => void
  showWarning: (message: string, options?: Partial<ToastMessage>) => void
  showInfo: (message: string, options?: Partial<ToastMessage>) => void
  dismissToast: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToastSystem() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastSystem must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
  defaultDuration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export function ToastProvider({ 
  children, 
  maxToasts = 5,
  defaultDuration = 5000,
  position = 'top-right'
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ExtendedToastMessage[]>([])

  useEffect(() => {
    // context-bridge의 토스트 시스템과 연결
    const unsubscribeToast = onToast((toast) => {
      addToast(toast)
    })

    return () => {
      unsubscribeToast()
    }
  }, [defaultDuration])

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const newToast: ExtendedToastMessage = {
      ...toast,
      id,
      isVisible: false,
      isExiting: false,
      duration: toast.duration || defaultDuration,
    }

    setToasts(prev => {
      const updated = [...prev, newToast]
      
      // 최대 토스트 수 제한
      if (updated.length > maxToasts) {
        const excess = updated.slice(0, updated.length - maxToasts)
        excess.forEach(t => dismissToast(t.id))
        return updated.slice(-maxToasts)
      }
      
      return updated
    })

    // 토스트 표시 애니메이션
    setTimeout(() => {
      setToasts(prev => 
        prev.map(t => t.id === id ? { ...t, isVisible: true } : t)
      )
    }, 50)

    // 자동 삭제
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, newToast.duration)
    }
  }

  const dismissToast = (id: string) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, isExiting: true } : toast
      )
    )

    // 애니메이션 완료 후 제거
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 300)
  }

  const dismissAll = () => {
    setToasts(prev => 
      prev.map(toast => ({ ...toast, isExiting: true }))
    )

    setTimeout(() => {
      setToasts([])
    }, 300)
  }

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    addToast(toast)
  }

  const showError = (message: string, options?: Partial<ToastMessage>) => {
    addToast({
      type: 'error',
      title: '오류',
      message,
      ...options,
    })
  }

  const showSuccess = (message: string, options?: Partial<ToastMessage>) => {
    addToast({
      type: 'success',
      title: '성공',
      message,
      ...options,
    })
  }

  const showWarning = (message: string, options?: Partial<ToastMessage>) => {
    addToast({
      type: 'warning',
      title: '경고',
      message,
      ...options,
    })
  }

  const showInfo = (message: string, options?: Partial<ToastMessage>) => {
    addToast({
      type: 'info',
      title: '정보',
      message,
      ...options,
    })
  }

  const value: ToastContextValue = {
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    dismissToast,
    dismissAll,
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* 토스트 컨테이너 */}
      <div className={`fixed z-50 pointer-events-none ${positionClasses[position]}`}>
        <div className="space-y-2 w-96 max-w-screen-sm">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: ExtendedToastMessage
  onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200'
      case 'error':
        return 'border-red-200'
      case 'warning':
        return 'border-yellow-200'
      case 'info':
        return 'border-blue-200'
      default:
        return 'border-gray-200'
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50'
      case 'error':
        return 'bg-red-50'
      case 'warning':
        return 'bg-yellow-50'
      case 'info':
        return 'bg-blue-50'
      default:
        return 'bg-white'
    }
  }

  return (
    <Card 
      className={`
        pointer-events-auto transition-all duration-300 ease-in-out shadow-lg
        ${getBorderColor()} ${getBackgroundColor()}
        ${toast.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${toast.isExiting ? 'translate-x-full opacity-0 scale-95' : ''}
      `}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 아이콘 */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900">
                {toast.title}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {toast.message && (
              <p className="text-sm text-gray-700 mt-1">
                {toast.message}
              </p>
            )}

            {/* 액션 버튼 */}
            {toast.action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.action?.onClick()
                    onDismiss()
                  }}
                  className="flex items-center gap-2"
                >
                  <Undo2 className="h-3 w-3" />
                  {toast.action.label}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 기존 useToast와의 호환성을 위한 래퍼
export function useToast() {
  const toastSystem = useToastSystem()
  
  const toast = ({ title, description, variant = 'default', duration, action }: {
    title: string
    description?: string
    variant?: 'default' | 'destructive'
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }) => {
    const type = variant === 'destructive' ? 'error' : 'success'
    
    toastSystem.showToast({
      type,
      title,
      message: description,
      duration,
      action,
    })
  }

  return { toast }
}
