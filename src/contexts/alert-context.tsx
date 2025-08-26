'use client'

import React, { createContext, useContext, useState } from 'react'
import AlertModal, { AlertType } from '@/components/ui/alert-modal'

interface AlertContextType {
  showAlert: (type: AlertType, message: string, title?: string) => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  showWarning: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function useAlert() {
  const context = useContext(AlertContext)
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}

interface AlertProviderProps {
  children: React.ReactNode
}

interface AlertState {
  isOpen: boolean
  type: AlertType
  message: string
  title?: string
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    message: '',
    title: undefined
  })

  const showAlert = (type: AlertType, message: string, title?: string) => {
    setAlertState({
      isOpen: true,
      type,
      message,
      title
    })
  }

  const showSuccess = (message: string, title?: string) => {
    showAlert('success', message, title)
  }

  const showError = (message: string, title?: string) => {
    showAlert('error', message, title)
  }

  const showWarning = (message: string, title?: string) => {
    showAlert('warning', message, title)
  }

  const showInfo = (message: string, title?: string) => {
    showAlert('info', message, title)
  }

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <AlertContext.Provider value={{ 
      showAlert, 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo 
    }}>
      {children}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        type={alertState.type}
        message={alertState.message}
        title={alertState.title}
      />
    </AlertContext.Provider>
  )
}

export default AlertProvider
