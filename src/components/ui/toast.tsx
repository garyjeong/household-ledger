'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { onToast, ToastMessage } from '@/lib/adapters/context-bridge'
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const unsubscribe = onToast((toast) => {
      setToasts(prev => [...prev, toast])
      
      // Auto-remove after duration
      const duration = toast.duration || 5000
      setTimeout(() => {
        removeToast(toast.id)
      }, duration)
    })

    return unsubscribe
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getColorClasses = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-orange-200 bg-orange-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <Card 
            key={toast.id}
            className={`shadow-lg transition-all duration-300 ease-in-out ${getColorClasses(toast.type)}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getIcon(toast.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-text-900 text-sm">
                      {toast.title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-white/50"
                      onClick={() => removeToast(toast.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {toast.message && (
                    <p className="text-text-700 text-xs mt-1">
                      {toast.message}
                    </p>
                  )}
                  
                  {toast.action && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          toast.action?.onClick()
                          removeToast(toast.id)
                        }}
                      >
                        {toast.action.label}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => removeToast(toast.id)}
                      >
                        무시
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
