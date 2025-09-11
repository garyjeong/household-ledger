'use client'

import React, { useState } from 'react'
import { AlertTriangle, Trash2, Users, Database, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useGroup } from '@/contexts/group-context'

interface DeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: {
    id: string
    name: string
    memberCount?: number
    counts?: {
      categories?: number
      transactions?: number
    }
  } | null
}

/**
 * 그룹 삭제 확인 다이얼로그
 * - 위험성 경고 및 삭제될 데이터 정보 제공
 * - 그룹 이름 입력으로 삭제 의도 확인
 * - 안전한 삭제 프로세스 진행
 */
export function DeleteGroupDialog({ open, onOpenChange, group }: DeleteGroupDialogProps) {
  const { toast } = useToast()
  const { deleteGroup } = useGroup()
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClose = () => {
    if (isDeleting) return // 삭제 진행 중에는 닫기 불가
    setConfirmText('')
    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!group) return

    // 그룹 이름 확인
    if (confirmText !== group.name) {
      toast({
        title: '그룹 이름 불일치',
        description: '삭제하려면 그룹 이름을 정확히 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsDeleting(true)

    try {
      const result = await deleteGroup(group.id)

      if (result.success) {
        toast({
          title: '그룹 삭제 완료',
          description: `"${group.name}" 그룹이 성공적으로 삭제되었습니다.`,
        })
        handleClose()
      } else {
        toast({
          title: '그룹 삭제 실패',
          description: result.error || '그룹 삭제 중 오류가 발생했습니다.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Delete group error:', error)
      toast({
        title: '그룹 삭제 실패',
        description: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!group) return null

  const isConfirmValid = confirmText === group.name

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            그룹 삭제
          </DialogTitle>
          <DialogDescription>
            이 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 삭제될 그룹 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{group.name}</span>
              <Badge variant="outline">
                {group.memberCount || 1}명
              </Badge>
            </div>

            {/* 삭제될 데이터 정보 */}
            {(group.counts?.categories || group.counts?.transactions) && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">삭제될 데이터:</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.counts.categories && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Database className="h-3 w-3" />
                      카테고리 {group.counts.categories}개
                    </div>
                  )}
                  {group.counts.transactions && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileText className="h-3 w-3" />
                      거래 {group.counts.transactions}개
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 경고 메시지 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">⚠️ 삭제 시 다음이 발생합니다:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 그룹과 연관된 모든 카테고리가 삭제됩니다</li>
              <li>• 그룹 거래는 개인 거래로 전환됩니다</li>
              <li>• 모든 그룹 멤버가 그룹에서 제거됩니다</li>
              <li>• 이 작업은 되돌릴 수 없습니다</li>
            </ul>
          </div>

          {/* 확인 입력 */}
          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="text-sm font-medium">
              삭제를 확인하려면 그룹 이름 <span className="font-bold text-red-600">&quot;{group.name}&quot;</span>을 입력하세요:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={group.name}
              disabled={isDeleting}
              className={confirmText && !isConfirmValid ? 'border-red-300 focus:border-red-500' : ''}
            />
            {confirmText && !isConfirmValid && (
              <p className="text-xs text-red-600">그룹 이름이 일치하지 않습니다.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                그룹 삭제
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
