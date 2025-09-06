import { useToast as useToastOriginal } from '@/components/error/ToastProvider'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const { addToast, success, error, warning, info } = useToastOriginal()

  const toast = ({ title, description, variant = 'default', duration, action }: ToastOptions) => {
    if (variant === 'destructive') {
      error(description || '', title)
    } else {
      success(description || '', title)
    }
  }

  // 기존 API와의 호환성을 위해 모든 메소드 제공
  return {
    toast,
    success: (message: string) => success(message),
    error: (message: string) => error(message),
    warning: (message: string) => warning(message),
    info: (message: string) => info(message),
  }
}
