import { showToast, ToastType } from '@/lib/adapters/context-bridge'

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
  const toast = ({ title, description, variant = 'default', duration, action }: ToastOptions) => {
    const type: ToastType = variant === 'destructive' ? 'error' : 'success'

    showToast({
      type,
      title,
      message: description,
      duration,
      action,
    })
  }

  return { toast }
}
