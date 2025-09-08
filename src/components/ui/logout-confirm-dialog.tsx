/**
 * 로그아웃 확인 다이얼로그
 * alert을 대체하는 모달 구현
 */

'use client'

import React from 'react'
import { LogOut, AlertTriangle } from 'lucide-react'
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

interface LogoutConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-12 h-12 rounded-full bg-orange-100'>
              <AlertTriangle className='h-6 w-6 text-orange-600' />
            </div>
            <div>
              <AlertDialogTitle className='text-left'>로그아웃 확인</AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className='text-left'>
          <p>정말 로그아웃하시겠습니까?</p>
        </AlertDialogDescription>

        <AlertDialogFooter className='gap-2'>
          <AlertDialogCancel onClick={onClose}>
            취소
          </AlertDialogCancel>

          <Button variant='destructive' onClick={onConfirm} className='gap-2'>
            <LogOut className='h-4 w-4' />
            로그아웃
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
