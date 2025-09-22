'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AccountForm } from './AccountForm'
import { type Account } from './AccountList'
import { type CreateAccountData, type UpdateAccountData } from '@/lib/schemas/account'

interface AccountDialogProps {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account
  onSubmit: (data: CreateAccountData | UpdateAccountData) => Promise<void>
}

export function AccountDialog({
  mode,
  open,
  onOpenChange,
  account,
  onSubmit
}: AccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateAccountData | UpdateAccountData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error('계좌 저장 중 오류:', error)
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '새 계좌 추가' : '계좌 정보 수정'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="-mt-6"> {/* Dialog header와의 간격 조정 */}
          <AccountForm
            mode={mode}
            initialData={account ? {
              id: account.id,
              name: account.name,
              type: account.type,
              currency: account.currency,
              balance: account.balance,
              ownerType: account.ownerType,
              ownerId: account.ownerId,
              isActive: account.isActive,
            } : undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
