/**
 * AlertDialog 컴포넌트
 */

'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/50' onClick={() => onOpenChange(false)} />

      {/* Content */}
      <div className='relative z-50 max-w-lg mx-4'>{children}</div>
    </div>
  )
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white rounded-lg shadow-lg p-6 w-full max-w-md', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
AlertDialogContent.displayName = 'AlertDialogContent'

interface AlertDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogHeader = ({ children, className }: AlertDialogHeaderProps) => {
  return <div className={cn('mb-4', className)}>{children}</div>
}

interface AlertDialogTitleProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogTitle = ({ children, className }: AlertDialogTitleProps) => {
  return <h2 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h2>
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => {
  return <div className={cn('text-sm text-gray-600 mt-2', className)}>{children}</div>
}

interface AlertDialogFooterProps {
  children: React.ReactNode
  className?: string
}

const AlertDialogFooter = ({ children, className }: AlertDialogFooterProps) => {
  return <div className={cn('flex justify-end gap-2 mt-6', className)}>{children}</div>
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-gray-50 hover:bg-gray-900/90 h-10 px-4 py-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
AlertDialogAction.displayName = 'AlertDialogAction'

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
AlertDialogCancel.displayName = 'AlertDialogCancel'

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}
