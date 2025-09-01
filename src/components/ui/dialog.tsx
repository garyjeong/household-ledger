'use client'

import * as React from 'react'

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div 
      className='fixed inset-0 z-modal'
      onClick={() => onOpenChange?.(false)}
    >
      {/* 배경 오버레이 */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in'
      />

      {/* 모달 컨텐츠 */}
      <div className='relative z-10 flex items-center justify-center min-h-full p-4'>
        {children}
      </div>
    </div>
  )
}

export interface DialogContentProps {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function DialogContent({ children, className = '', onClick }: DialogContentProps) {
  return (
    <div
      className={`
      bg-white rounded-lg shadow-lg border border-gray-200 
      animate-scale-in max-w-md w-full max-h-[90vh] overflow-y-auto
      ${className}
    `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return <div className={`p-6 pb-4 border-b border-gray-200 ${className}`}>{children}</div>
}

export interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return <h2 className={`text-lg font-semibold text-text-primary ${className}`}>{children}</h2>
}

export interface DialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return <p className={`text-sm text-text-secondary ${className}`}>{children}</p>
}

export interface DialogFooterProps {
  children: React.ReactNode
  className?: string
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 border-t border-gray-200 ${className}`}
    >
      {children}
    </div>
  )
}
