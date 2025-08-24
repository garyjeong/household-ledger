'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { useLedgerStore } from '@/stores/ledger-store'
import { fetchLegacyData, DataMapper, showUndoToast } from '@/lib/adapters/context-bridge'
import { BulkInputRow, Transaction, TransactionType } from '@/types/ledger'
import { format, parse, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react'

interface BulkInputProps {
  className?: string
}

export function BulkInput({ className = '' }: BulkInputProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [rawText, setRawText] = useState('')
  const [parsedRows, setParsedRows] = useState<BulkInputRow[]>([])
  const [dataMapper, setDataMapper] = useState<DataMapper | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  const { importTransactions, undoLastAction } = useLedgerStore()

  // Load accounts and categories
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchLegacyData()
      setAccounts(data.accounts.filter(acc => acc.isActive))
      setCategories(data.categories)
      setDataMapper(new DataMapper(data.accounts, data.categories))
    }
    loadData()
  }, [])

  // Parse text input into rows
  const parseTextInput = (text: string): BulkInputRow[] => {
    if (!text.trim()) return []

    const lines = text.trim().split('\n').filter(line => line.trim())
    
    return lines.map((line, index) => {
      const parts = line.trim().split(/\s+/)
      const errors: string[] = []
      
      // Basic validation for required parts
      if (parts.length < 3) {
        errors.push('형식이 올바르지 않습니다 (최소 날짜, 메모, 금액 필요)')
        return {
          index: index + 1,
          date: '',
          memo: '',
          amount: '',
          category: '',
          account: '',
          isValid: false,
          errors,
        }
      }

      let date = ''
      let memo = ''
      let amount = ''
      let category = ''
      let account = ''

      try {
        // Extract date (first part)
        const dateStr = parts[0]
        const parsedDate = parseDateString(dateStr)
        if (parsedDate) {
          date = format(parsedDate, 'yyyy-MM-dd')
        } else {
          errors.push('날짜 형식이 올바르지 않습니다')
        }

        // Extract amount (last numeric part)
        const amountMatch = line.match(/\d+/)
        if (amountMatch) {
          amount = amountMatch[0]
        } else {
          errors.push('금액을 찾을 수 없습니다')
        }

        // Extract memo (after date, before amount)
        const amountIndex = line.lastIndexOf(amount)
        const dateEndIndex = line.indexOf(dateStr) + dateStr.length
        const memoText = line.substring(dateEndIndex, amountIndex).trim()
        
        // Split memo text to extract category and account info
        const memoParts = memoText.split(/\s+/)
        memo = memoParts[0] || ''

        // Try to extract category and account from remaining parts
        const remainingParts = memoParts.slice(1)
        
        // Look for category matches
        for (const part of remainingParts) {
          if (!category && dataMapper) {
            const matchedCategory = dataMapper.findCategoryByName(part)
            if (matchedCategory) {
              category = matchedCategory.name
              break
            }
          }
        }

        // Look for account matches
        for (const part of remainingParts) {
          if (!account && dataMapper) {
            const matchedAccount = dataMapper.findAccountByName(part)
            if (matchedAccount) {
              account = matchedAccount.name
              break
            }
          }
        }

        // If no category/account found, add to errors
        if (!category) {
          errors.push('카테고리를 자동 매핑할 수 없습니다')
        }
        if (!account) {
          errors.push('계좌를 자동 매핑할 수 없습니다')
        }
      } catch (error) {
        errors.push('파싱 중 오류가 발생했습니다')
      }

      return {
        index: index + 1,
        date,
        memo,
        amount,
        category,
        account,
        isValid: errors.length === 0,
        errors,
      }
    })
  }

  // Parse various date formats
  const parseDateString = (dateStr: string): Date | null => {
    const formats = [
      'MM/dd',
      'M/d', 
      'yyyy-MM-dd',
      'yyyy/MM/dd',
      'MM-dd',
      'M-d',
    ]

    for (const formatStr of formats) {
      try {
        let fullDateStr = dateStr
        
        // Add current year for MM/dd format
        if (formatStr.includes('MM/dd') || formatStr.includes('M/d') || 
            formatStr.includes('MM-dd') || formatStr.includes('M-d')) {
          const currentYear = new Date().getFullYear()
          fullDateStr = `${currentYear}/${dateStr.replace('-', '/')}`
          const parsed = parse(fullDateStr, 'yyyy/M/d', new Date())
          if (isValid(parsed)) return parsed
        } else {
          const parsed = parse(fullDateStr, formatStr, new Date())
          if (isValid(parsed)) return parsed
        }
      } catch {
        continue
      }
    }

    return null
  }

  // Handle text input change
  const handleTextChange = (text: string) => {
    setRawText(text)
    if (text.trim()) {
      const parsed = parseTextInput(text)
      setParsedRows(parsed)
    } else {
      setParsedRows([])
    }
  }

  // Update individual row
  const updateRow = (index: number, field: keyof BulkInputRow, value: string) => {
    setParsedRows(prev => prev.map(row => {
      if (row.index === index + 1) {
        const updated = { ...row, [field]: value }
        
        // Re-validate row
        const errors: string[] = []
        
        if (!updated.date) errors.push('날짜가 필요합니다')
        if (!updated.amount || isNaN(parseInt(updated.amount))) errors.push('올바른 금액이 필요합니다')
        if (!updated.memo.trim()) errors.push('메모가 필요합니다')
        if (!updated.category) errors.push('카테고리를 선택해주세요')
        if (!updated.account) errors.push('계좌를 선택해주세요')
        
        return {
          ...updated,
          isValid: errors.length === 0,
          errors,
        }
      }
      return row
    }))
  }

  // Auto-map category for row
  const autoMapCategory = (rowIndex: number) => {
    const row = parsedRows[rowIndex]
    if (!row || !dataMapper) return

    const suggestions = dataMapper.searchCategory(row.memo)
    if (suggestions.length > 0) {
      updateRow(rowIndex, 'category', suggestions[0].name)
    }
  }

  // Auto-map account for row
  const autoMapAccount = (rowIndex: number) => {
    const row = parsedRows[rowIndex]
    if (!row || !dataMapper) return

    const suggestions = dataMapper.searchAccount(row.memo)
    if (suggestions.length > 0) {
      updateRow(rowIndex, 'account', suggestions[0].name)
    }
  }

  // Process and import all valid rows
  const handleImport = async () => {
    const validRows = parsedRows.filter(row => row.isValid)
    if (validRows.length === 0) {
      return
    }

    setIsProcessing(true)
    try {
      const transactions: Transaction[] = validRows.map(row => {
        const category = categories.find(c => c.name === row.category) || categories[0]
        const account = accounts.find(a => a.name === row.account) || accounts[0]
        
        return {
          id: `bulk-${Date.now()}-${row.index}`,
          type: 'EXPENSE' as TransactionType, // Default to expense, could be enhanced
          date: new Date(row.date),
          amount: parseInt(row.amount),
          category: {
            id: category.id,
            name: category.name,
            color: category.color,
            type: category.type,
          },
          account: {
            id: account.id,
            name: account.name,
            type: account.type,
          },
          memo: row.memo,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

      await importTransactions(transactions)

      showUndoToast('일괄 가져오기', () => undoLastAction())
      
      // Close dialog and reset
      setShowDialog(false)
      setRawText('')
      setParsedRows([])
      
    } catch (error) {
      console.error('Bulk import error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Example text for demonstration
  const exampleText = `8/24 점심 12000 식비 국민카드
2024-08-23 커피 4800 식비 현금 #야근
08/22 버스 1500 교통비 체크카드
8/21 마트 쇼핑 45000 생활용품 신한카드`

  const validRowsCount = parsedRows.filter(row => row.isValid).length
  const totalRowsCount = parsedRows.length

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-brand-600" />
            일괄 입력
          </CardTitle>
          <p className="text-sm text-text-600">
            여러 거래를 한 번에 입력할 수 있습니다
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(true)}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                텍스트로 입력하기
              </Button>
            </div>

            <div className="text-sm text-text-600 space-y-1">
              <p className="font-medium">지원 형식:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><code>날짜 메모 금액 카테고리 계좌</code></li>
                <li><code>8/24 점심 12000 식비 카드</code></li>
                <li><code>2024-08-23 커피 4800 식비 현금</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Input Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>일괄 거래 입력</DialogTitle>
            <DialogDescription>
              한 줄씩 거래 정보를 입력하세요. 자동으로 파싱하여 미리보기를 제공합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
            {/* Input area */}
            <div className="flex flex-col space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="bulk-text">거래 데이터 입력</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTextChange(exampleText)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    예시 붙여넣기
                  </Button>
                </div>
                <textarea
                  id="bulk-text"
                  className="w-full h-64 p-3 border border-stroke-200 rounded-lg resize-none font-mono text-sm"
                  placeholder={exampleText}
                  value={rawText}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
              </div>

              {/* Format guide */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">입력 형식 가이드</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div>
                    <span className="font-medium">기본 형식:</span>
                    <code className="block bg-gray-100 p-2 rounded mt-1">
                      날짜 메모 금액 [카테고리] [계좌]
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">날짜 형식:</span>
                    <span className="text-text-600 ml-2">
                      MM/dd, yyyy-MM-dd, MM-dd 등
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">예시:</span>
                    <div className="bg-gray-50 p-2 rounded mt-1 space-y-1">
                      <div><code>8/24 점심 12000 식비 카드</code></div>
                      <div><code>08-23 커피 4800 식비 현금</code></div>
                      <div><code>2024-08-22 교통비 1500 교통 체크카드</code></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview area */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>미리보기</Label>
                  {totalRowsCount > 0 && (
                    <Badge variant="outline">
                      {validRowsCount}/{totalRowsCount} 유효
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPreview ? '숨기기' : '보기'}
                </Button>
              </div>

              {showPreview && parsedRows.length > 0 && (
                <div className="border border-stroke-200 rounded-lg overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-surface-page sticky top-0">
                        <tr>
                          <th className="p-2 text-left">상태</th>
                          <th className="p-2 text-left">날짜</th>
                          <th className="p-2 text-left">메모</th>
                          <th className="p-2 text-left">금액</th>
                          <th className="p-2 text-left">카테고리</th>
                          <th className="p-2 text-left">계좌</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((row, index) => (
                          <tr 
                            key={row.index}
                            className={`border-t border-stroke-100 ${
                              row.isValid ? 'bg-green-50' : 'bg-red-50'
                            }`}
                          >
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                {row.isValid ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                            </td>
                            <td className="p-2">
                              <Input
                                type="date"
                                value={row.date}
                                onChange={(e) => updateRow(index, 'date', e.target.value)}
                                className="text-xs h-6 p-1"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={row.memo}
                                onChange={(e) => updateRow(index, 'memo', e.target.value)}
                                className="text-xs h-6 p-1"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={row.amount}
                                onChange={(e) => updateRow(index, 'amount', e.target.value)}
                                className="text-xs h-6 p-1 w-16"
                                inputMode="numeric"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <Select
                                  value={categories.find(c => c.name === row.category)?.id || ''}
                                  onValueChange={(categoryId) => {
                                    const category = categories.find(c => c.id === categoryId)
                                    if (category) updateRow(index, 'category', category.name)
                                  }}
                                >
                                  <SelectTrigger className="text-xs h-6 p-1 min-w-20">
                                    {row.category || '선택'}
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(category => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => autoMapCategory(index)}
                                  title="자동 매핑"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <Select
                                  value={accounts.find(a => a.name === row.account)?.id || ''}
                                  onValueChange={(accountId) => {
                                    const account = accounts.find(a => a.id === accountId)
                                    if (account) updateRow(index, 'account', account.name)
                                  }}
                                >
                                  <SelectTrigger className="text-xs h-6 p-1 min-w-16">
                                    {row.account || '선택'}
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accounts.map(account => (
                                      <SelectItem key={account.id} value={account.id}>
                                        {account.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => autoMapAccount(index)}
                                  title="자동 매핑"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Validation summary */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>유효: {validRowsCount}건</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>오류: {totalRowsCount - validRowsCount}건</span>
                    </div>
                  </div>

                  {/* Show errors for invalid rows */}
                  {parsedRows.some(row => !row.isValid) && (
                    <div className="text-xs text-red-600 space-y-1">
                      {parsedRows.filter(row => !row.isValid).map(row => (
                        <div key={row.index}>
                          <span className="font-medium">{row.index}번째 줄:</span>
                          {row.errors.map((error, i) => (
                            <span key={i} className="ml-1">{error}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDialog(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={validRowsCount === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                `${validRowsCount}건 가져오기`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
