'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    textColor: 'text-green-700',
    defaultDuration: 4000,
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    textColor: 'text-red-700',
    defaultDuration: 6000,
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-900',
    textColor: 'text-yellow-700',
    defaultDuration: 5000,
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-700',
    defaultDuration: 4000,
  },
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)
      const duration = toast.duration || toastConfig[toast.type].defaultDuration

      setToasts(prev => [...prev, { ...toast, id }])

      // Auto remove after duration
      setTimeout(() => {
        removeToast(id)
      }, duration)
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'success', message, title })
    },
    [addToast]
  )

  const error = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'error', message, title })
    },
    [addToast]
  )

  const warning = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'warning', message, title })
    },
    [addToast]
  )

  const info = useCallback(
    (message: string, title?: string) => {
      addToast({ type: 'info', message, title })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}

      {/* Toast Container */}
      <div className='fixed top-4 right-4 z-50 space-y-2 max-w-sm'>
        {toasts.map(toast => {
          const config = toastConfig[toast.type]
          const Icon = config.icon

          return (
            <div
              key={toast.id}
              className={`
                ${config.bgColor} ${config.borderColor} border rounded-lg p-4 shadow-lg
                transform transition-all duration-300 ease-in-out
                animate-in slide-in-from-right-full
              `}
            >
              <div className='flex items-start gap-3'>
                <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />

                <div className='flex-1 min-w-0'>
                  {toast.title && (
                    <h4 className={`text-sm font-medium ${config.titleColor} mb-1`}>
                      {toast.title}
                    </h4>
                  )}
                  <p className={`text-sm ${config.textColor}`}>{toast.message}</p>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className={`${config.iconColor} hover:opacity-70 transition-opacity cursor-pointer`}
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
