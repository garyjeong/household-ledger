'use client'

import React, { useState, useEffect } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLedgerStore } from '@/stores/ledger-store'
import { showUndoToast } from '@/lib/adapters/context-bridge'
import { Transaction, TransactionType } from '@/types/ledger'
import { formatAmount, getTransactionTypeColor, getTransactionTypeLabel } from '@/lib/schemas/transaction'
import {
  TrendingDown,
  TrendingUp, 
  ArrowRightLeft,
  Edit3,
  Trash2,
  AlertCircle,
  Copy,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
} from 'lucide-react'

// Helper function for type icons
function getTypeIcon(type: TransactionType) {
  switch (type) {
    case 'EXPENSE':
      return <TrendingDown className="h-4 w-4" />
    case 'INCOME':
      return <TrendingUp className="h-4 w-4" />
    case 'TRANSFER':
      return <ArrowRightLeft className="h-4 w-4" />
  }
}

interface InboxListProps {
  className?: string
  showGrouping?: boolean
  pageSize?: number
}

export function InboxList({ 
  className = '',
  showGrouping = true,
  pageSize = 20 
}: InboxListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  const { 
    transactions, 
    isLoading, 
    deleteTransaction, 
    editTransaction,
    undoLastAction,
    lastUndoAction,
    refreshFromAPI
  } = useLedgerStore()

  // ✅ 컴포넌트 마운트시 서버에서 거래 내역 불러오기
  useEffect(() => {
    refreshFromAPI()
  }, [refreshFromAPI])

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTransaction) return

      switch (e.key) {
        case 'e':
        case 'E':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            setEditingTransaction(selectedTransaction)
          }
          break
        case 'Delete':
        case 'Backspace':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            handleDelete(selectedTransaction)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          selectPreviousTransaction()
          break
        case 'ArrowDown':
          e.preventDefault()
          selectNextTransaction()
          break
        case 'Escape':
          setSelectedTransaction(null)
          setEditingTransaction(null)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedTransaction])

  const selectPreviousTransaction = () => {
    if (!selectedTransaction) return
    const currentIndex = paginatedTransactions.findIndex(t => t.id === selectedTransaction)
    if (currentIndex > 0) {
      setSelectedTransaction(paginatedTransactions[currentIndex - 1].id)
    }
  }

  const selectNextTransaction = () => {
    if (!selectedTransaction) return
    const currentIndex = paginatedTransactions.findIndex(t => t.id === selectedTransaction)
    if (currentIndex < paginatedTransactions.length - 1) {
      setSelectedTransaction(paginatedTransactions[currentIndex + 1].id)
    }
  }

  const handleDelete = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (!transaction) return

    await deleteTransaction(transactionId)
    setSelectedTransaction(null)

    showUndoToast('거래 삭제', () => undoLastAction())
  }

  const handleDuplicate = async (transaction: Transaction) => {
    // Create a duplicate with current date
    const duplicateData = {
      date: new Date(),
      type: transaction.type,
      amount: transaction.amount.toString(),
      categoryId: transaction.category.id,
      accountId: transaction.account.id,
      memo: transaction.memo ? `${transaction.memo} (복사본)` : undefined,
    }
    
    // This would call the addTransaction from the store
    // await addTransaction(duplicateData)
    
    showUndoToast('거래 복사', () => undoLastAction())
  }

  // Group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [date: string]: Transaction[] } = {}
    
    transactions.forEach(transaction => {
      const dateKey = format(transaction.date, 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(transaction)
    })

    return Object.entries(groups).map(([date, transactions]) => ({
      date: new Date(date),
      transactions: transactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }))
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return '오늘'
    if (isYesterday(date)) return '어제'
    return format(date, 'M월 d일 (EEE)', { locale: ko })
  }



  // Pagination
  const totalPages = Math.ceil(transactions.length / pageSize)
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const groupedTransactions = showGrouping 
    ? groupTransactionsByDate(paginatedTransactions)
    : [{ date: new Date(), transactions: paginatedTransactions }]

  if (isLoading && transactions.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center space-y-2">
          <div className="animate-spin h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-text-600">거래 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-surface-page rounded-full flex items-center justify-center mx-auto">
            <TrendingDown className="h-8 w-8 text-text-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-text-900">거래 내역이 없습니다</h3>
            <p className="text-text-600 mt-1">위의 입력바를 사용해서 첫 거래를 추가해보세요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-text-900">거래 내역</h2>
          <Badge variant="outline" className="text-sm">
            총 {transactions.length}건
          </Badge>
        </div>
        
        {lastUndoAction && Date.now() - lastUndoAction.timestamp < 5000 && (
          <Button
            variant="outline"
            size="sm"
            onClick={undoLastAction}
            className="text-brand-600 hover:text-brand-700"
          >
            <ArrowUp className="h-4 w-4 mr-1" />
            되돌리기
          </Button>
        )}
      </div>

      {/* Keyboard shortcuts guide */}
      {!isMobile && (
        <div className="bg-surface-page rounded-lg p-3 mb-4 text-xs text-text-600">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1 py-0.5 bg-white rounded">↑↓</kbd> 선택</span>
            <span><kbd className="px-1 py-0.5 bg-white rounded">E</kbd> 편집</span>
            <span><kbd className="px-1 py-0.5 bg-white rounded">Del</kbd> 삭제</span>
            <span><kbd className="px-1 py-0.5 bg-white rounded">Esc</kbd> 취소</span>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="space-y-6">
        {groupedTransactions.map(({ date, transactions: dayTransactions }) => (
          <div key={date.toISOString()}>
            {/* Date header */}
            {showGrouping && (
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-medium text-text-700">
                  {getDateLabel(date)}
                </h3>
                <div className="flex-1 h-px bg-stroke-200" />
                <div className="text-xs text-text-500">
                  {dayTransactions.length}건
                </div>
              </div>
            )}

            {/* Transactions */}
            <div className="space-y-2">
              {dayTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectedTransaction === transaction.id}
                  isEditing={editingTransaction === transaction.id}
                  isMobile={isMobile}
                  onSelect={() => setSelectedTransaction(transaction.id)}
                  onEdit={() => setEditingTransaction(transaction.id)}
                  onDelete={() => handleDelete(transaction.id)}
                  onDuplicate={() => handleDuplicate(transaction)}
                  onCancelEdit={() => setEditingTransaction(null)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-text-600">
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, transactions.length)} / {transactions.length}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(current => current - 1)}
            >
              이전
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(current => current + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual transaction row component
interface TransactionRowProps {
  transaction: Transaction
  isSelected: boolean
  isEditing: boolean
  isMobile: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onCancelEdit: () => void
}

function TransactionRow({
  transaction,
  isSelected,
  isEditing,
  isMobile,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onCancelEdit,
}: TransactionRowProps) {
  const typeColorClass = getTransactionTypeColor(transaction.type)
  const typeLabel = getTransactionTypeLabel(transaction.type)
  const typeIcon = getTypeIcon(transaction.type)

  if (isMobile) {
    // Mobile card layout
    return (
      <Card 
        className={`cursor-pointer transition-colors ${
          isSelected ? 'ring-2 ring-brand-500 bg-brand-50' : 'hover:bg-surface-page'
        } ${transaction.isDuplicate ? 'border-orange-200 bg-orange-50' : ''}`}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${typeColorClass}`}
                >
                  {typeIcon}
                  {typeLabel}
                </Badge>
                {transaction.isDuplicate && (
                  <Badge variant="outline" className="text-xs text-orange-600 bg-orange-100">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    중복 후보
                  </Badge>
                )}
              </div>
              
              <div className="text-lg font-semibold text-text-900 mb-1">
                {formatAmount(transaction.amount)}
              </div>
              
              <div className="text-sm text-text-600 space-y-1">
                <div>{transaction.category.name}</div>
                <div>{transaction.account.name}</div>
                {transaction.memo && (
                  <div className="text-text-500 text-xs truncate">
                    {transaction.memo}
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-text-500 text-right">
              {format(transaction.date, 'MM/dd')}
            </div>
          </div>

          {isSelected && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stroke-200">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit3 className="h-3 w-3 mr-1" />
                편집
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-3 w-3 mr-1" />
                복사
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-3 w-3 mr-1" />
                삭제
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Desktop table row layout
  return (
    <div 
      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
        isSelected ? 'ring-2 ring-brand-500 bg-brand-50 border-brand-200' : 'border-stroke-200 hover:bg-surface-page'
      } ${transaction.isDuplicate ? 'border-orange-200 bg-orange-50' : ''}`}
      onClick={onSelect}
    >
      {/* Type indicator */}
      <div className={`p-2 rounded-full ${typeColorClass.split(' ')[2]}`}>
        {typeIcon}
      </div>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-5 gap-4 items-center min-w-0">
        {/* Date */}
        <div className="text-sm text-text-600">
          {format(transaction.date, 'MM/dd')}
        </div>

        {/* Amount */}
        <div className="text-right">
          <div className="font-semibold text-text-900">
            {formatAmount(transaction.amount)}
          </div>
          <div className={`text-xs ${typeColorClass.split(' ')[0]}`}>
            {typeLabel}
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 min-w-0">
          {transaction.category.color && (
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: transaction.category.color }}
            />
          )}
          <span className="text-sm text-text-700 truncate">
            {transaction.category.name}
          </span>
        </div>

        {/* Account */}
        <div className="text-sm text-text-600 truncate">
          {transaction.account.name}
        </div>

        {/* Memo */}
        <div className="text-sm text-text-500 truncate">
          {transaction.memo || '-'}
        </div>
      </div>

      {/* Badges and actions */}
      <div className="flex items-center gap-2">
        {transaction.isDuplicate && (
          <Badge variant="outline" className="text-xs text-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            중복
          </Badge>
        )}

        {isSelected && (
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
