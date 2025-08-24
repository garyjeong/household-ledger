// MVP Ledger Types
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER'

export interface Transaction {
  id: string
  type: TransactionType
  date: Date
  amount: number
  category: {
    id: string
    name: string
    color?: string
    type: TransactionType
  }
  account: {
    id: string
    name: string
    type: 'CASH' | 'CARD' | 'BANK' | 'OTHER'
  }
  memo?: string
  isDuplicate?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface QuickAddFormData {
  date: Date
  type: TransactionType
  amount: string
  categoryId: string
  accountId: string
  memo?: string
}

export interface Preset {
  id: string
  name: string
  emoji: string
  type: TransactionType
  amount: number
  categoryId: string
  accountId: string
  shortcut?: number // 1-9 for keyboard shortcuts
}

export interface BulkInputRow {
  index: number
  date: string
  memo: string
  amount: string
  category: string
  account: string
  isValid: boolean
  errors: string[]
  mappedTransaction?: Partial<Transaction>
}

export interface AutoClassificationRule {
  id: string
  pattern: string // regex or substring
  categoryId: string
  accountId: string
  confidence: number // 0-1
  isActive: boolean
}

export interface LedgerStats {
  totalExpense: number
  totalIncome: number
  transactionCount: number
  thisMonth: {
    expense: number
    income: number
    count: number
  }
}
