'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  RecurringExpenseForm,
  type RecurringExpenseData,
  type Account,
  type Category,
} from './RecurringExpenseForm'

interface RecurringExpenseDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData?: RecurringExpenseData
  accounts: Account[]
  categories: Category[]
  ownerType: 'USER' | 'GROUP'
  ownerId: string
  onSubmit: (data: RecurringExpenseData) => Promise<void>
  isLoading?: boolean
}

export function RecurringExpenseDialog({
  isOpen,
  onClose,
  mode,
  initialData,
  accounts,
  categories,
  ownerType,
  ownerId,
  onSubmit,
  isLoading = false,
}: RecurringExpenseDialogProps) {
  const handleSubmit = async (data: RecurringExpenseData) => {
    try {
      await onSubmit(data)
      onClose()
    } catch (error) {
      // 에러는 상위 컴포넌트에서 처리
      console.error('Dialog submit error:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '고정 지출 추가' : '고정 지출 수정'}</DialogTitle>
        </DialogHeader>

        <div className='mt-4'>
          <RecurringExpenseForm
            mode={mode}
            initialData={initialData}
            accounts={accounts}
            categories={categories}
            ownerType={ownerType}
            ownerId={ownerId}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
