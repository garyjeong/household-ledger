/**
 * 카테고리 삭제 확인 다이얼로그
 * T-022: 카테고리 관리 페이지 구현
 */

'use client'

import React from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  categoryName: string
  isLoading?: boolean
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-12 h-12 rounded-full bg-red-100'>
              <AlertTriangle className='h-6 w-6 text-red-600' />
            </div>
            <div>
              <AlertDialogTitle className='text-left'>카테고리 삭제 확인</AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className='text-left space-y-3'>
          <p>
            <span className='font-semibold text-gray-900'>&ldquo;{categoryName}&rdquo;</span>{' '}
            카테고리를 정말 삭제하시겠습니까?
          </p>

          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-3'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0' />
              <div className='text-sm text-yellow-800'>
                <p className='font-medium mb-1'>주의사항:</p>
                <ul className='space-y-1 text-xs'>
                  <li>• 삭제된 카테고리는 복구할 수 없습니다</li>
                  <li>• 이 카테고리를 사용하는 거래 내역이 있다면 삭제가 제한될 수 있습니다</li>
                  <li>• 기본 카테고리는 삭제할 수 없습니다</li>
                </ul>
              </div>
            </div>
          </div>

          <p className='text-sm text-gray-600'>
            이 작업은 되돌릴 수 없습니다. 신중하게 결정해 주세요.
          </p>
        </AlertDialogDescription>

        <AlertDialogFooter className='gap-2'>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            취소
          </AlertDialogCancel>

          <Button variant='destructive' onClick={onConfirm} disabled={isLoading} className='gap-2'>
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 className='h-4 w-4' />
                삭제
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
