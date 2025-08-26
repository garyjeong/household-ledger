'use client'

import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle 
} from 'lucide-react'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  type: AlertType
  title?: string
  message: string
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    defaultTitle: '성공'
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-600',
    defaultTitle: '오류'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    defaultTitle: '경고'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    defaultTitle: '정보'
  }
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message 
}: AlertModalProps) {
  const config = alertConfig[type]
  const Icon = config.icon
  const displayTitle = title || config.defaultTitle

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
            {displayTitle}
          </DialogTitle>
          <DialogDescription className="text-left">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AlertModal
