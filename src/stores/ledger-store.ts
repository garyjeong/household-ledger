import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Transaction,
  QuickAddFormData,
  Preset,
  AutoClassificationRule,
  LedgerStats,
} from '@/types/ledger'

interface LedgerState {
  // Data
  transactions: Transaction[]
  presets: Preset[]
  rules: AutoClassificationRule[]

  // UI State
  isLoading: boolean
  lastUndoAction: {
    type: 'ADD' | 'EDIT' | 'DELETE'
    data: any
    timestamp: number
  } | null

  // Actions
  addTransaction: (data: QuickAddFormData) => Promise<void>
  editTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  undoLastAction: () => Promise<void>

  // Presets
  addPreset: (preset: Omit<Preset, 'id'>) => void
  deletePreset: (id: string) => void
  applyPreset: (presetId: string) => QuickAddFormData | null

  // Auto Classification
  addRule: (rule: Omit<AutoClassificationRule, 'id'>) => void
  suggestCategory: (memo: string) => { categoryId: string; confidence: number } | null

  // Bulk Operations
  importTransactions: (transactions: Transaction[]) => Promise<void>

  // Utilities
  getStats: () => LedgerStats
  checkDuplicate: (transaction: QuickAddFormData) => Transaction | null
  refreshFromAPI: () => Promise<void>
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      // Initial state
      transactions: [],
      presets: [
        {
          id: 'preset-1',
          name: '커피',
          emoji: '☕',
          type: 'EXPENSE',
          amount: 5000,
          categoryId: 'category-food', // Will be mapped from actual categories
          accountId: 'account-cash',
          shortcut: 1,
        },
        {
          id: 'preset-2',
          name: '점심',
          emoji: '🍚',
          type: 'EXPENSE',
          amount: 12000,
          categoryId: 'category-food',
          accountId: 'account-card',
          shortcut: 2,
        },
        {
          id: 'preset-3',
          name: '교통비',
          emoji: '🚌',
          type: 'EXPENSE',
          amount: 1500,
          categoryId: 'category-transport',
          accountId: 'account-card',
          shortcut: 3,
        },
      ],
      rules: [
        {
          id: 'rule-1',
          pattern: '스타벅스|커피|카페',
          categoryId: 'category-food',
          accountId: 'account-card',
          confidence: 0.9,
          isActive: true,
        },
        {
          id: 'rule-2',
          pattern: '버스|지하철|택시|T머니',
          categoryId: 'category-transport',
          accountId: 'account-card',
          confidence: 0.85,
          isActive: true,
        },
      ],
      isLoading: false,
      lastUndoAction: null,

      // Actions
      addTransaction: async (data: QuickAddFormData) => {
        set({ isLoading: true })
        try {
          // Check for duplicates
          const duplicate = get().checkDuplicate(data)

          const transactionData = {
            type: data.type,
            date: data.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
            amount: Math.round(parseFloat(data.amount) * 100), // Convert to cents for API
            accountId: parseInt(data.accountId),
            categoryId: data.categoryId ? parseInt(data.categoryId) : null,
            memo: data.memo,
          }

          // ✅ API 호출 활성화!
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData),
          })

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }

          const apiTransaction = await response.json()

          const newTransaction: Transaction = {
            id: apiTransaction.data.id.toString(),
            type: data.type,
            date: data.date,
            amount: parseFloat(data.amount),
            category: apiTransaction.data.category || {
              id: data.categoryId,
              name: 'Unknown',
              type: data.type,
            },
            account: apiTransaction.data.account || {
              id: data.accountId,
              name: 'Unknown',
              type: 'CASH',
            },
            memo: data.memo,
            isDuplicate: !!duplicate,
            createdAt: new Date(apiTransaction.data.createdAt),
            updatedAt: new Date(apiTransaction.data.updatedAt),
          }

          set(state => ({
            transactions: [newTransaction, ...state.transactions],
            lastUndoAction: {
              type: 'ADD',
              data: newTransaction,
              timestamp: Date.now(),
            },
          }))
        } catch (error) {
          console.error('Failed to add transaction:', error)

          // 오프라인 모드: 로컬에만 저장
          const fallbackTransaction: Transaction = {
            id: `offline-${Date.now()}`,
            type: data.type,
            date: data.date,
            amount: parseFloat(data.amount),
            category: {
              id: data.categoryId,
              name: 'Offline',
              type: data.type,
            },
            account: {
              id: data.accountId,
              name: 'Offline',
              type: 'CASH',
            },
            memo: data.memo,
            isDuplicate: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          set(state => ({
            transactions: [fallbackTransaction, ...state.transactions],
            lastUndoAction: {
              type: 'ADD',
              data: fallbackTransaction,
              timestamp: Date.now(),
            },
          }))
        } finally {
          set({ isLoading: false })
        }
      },

      editTransaction: async (id: string, updates: Partial<Transaction>) => {
        const transaction = get().transactions.find(t => t.id === id)
        if (!transaction) return

        set({ isLoading: true })
        try {
          // ✅ API 호출 활성화!
          const response = await fetch(`/api/transactions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: updates.amount ? Math.round(updates.amount * 100) : undefined,
              memo: updates.memo,
              categoryId: updates.category?.id ? parseInt(updates.category.id) : undefined,
              accountId: updates.account?.id ? parseInt(updates.account.id) : undefined,
            }),
          })

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }

          const apiTransaction = await response.json()
          const updatedTransaction = {
            ...transaction,
            ...updates,
            updatedAt: new Date(apiTransaction.data.updatedAt),
          }

          set(state => ({
            transactions: state.transactions.map(t => (t.id === id ? updatedTransaction : t)),
            lastUndoAction: {
              type: 'EDIT',
              data: { id, original: transaction, updated: updatedTransaction },
              timestamp: Date.now(),
            },
          }))
        } catch (error) {
          console.error('Failed to edit transaction:', error)

          // 오프라인 모드: 로컬만 수정
          const updatedTransaction = { ...transaction, ...updates, updatedAt: new Date() }
          set(state => ({
            transactions: state.transactions.map(t => (t.id === id ? updatedTransaction : t)),
            lastUndoAction: {
              type: 'EDIT',
              data: { id, original: transaction, updated: updatedTransaction },
              timestamp: Date.now(),
            },
          }))
        } finally {
          set({ isLoading: false })
        }
      },

      deleteTransaction: async (id: string) => {
        const transaction = get().transactions.find(t => t.id === id)
        if (!transaction) return

        set({ isLoading: true })
        try {
          // ✅ API 호출 활성화!
          const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }

          set(state => ({
            transactions: state.transactions.filter(t => t.id !== id),
            lastUndoAction: {
              type: 'DELETE',
              data: transaction,
              timestamp: Date.now(),
            },
          }))
        } catch (error) {
          console.error('Failed to delete transaction:', error)

          // 오프라인 모드: 로컬만 삭제
          set(state => ({
            transactions: state.transactions.filter(t => t.id !== id),
            lastUndoAction: {
              type: 'DELETE',
              data: transaction,
              timestamp: Date.now(),
            },
          }))
        } finally {
          set({ isLoading: false })
        }
      },

      undoLastAction: async () => {
        const lastAction = get().lastUndoAction
        if (!lastAction || Date.now() - lastAction.timestamp > 5000) return

        set({ isLoading: true })
        try {
          switch (lastAction.type) {
            case 'ADD':
              set(state => ({
                transactions: state.transactions.filter(t => t.id !== lastAction.data.id),
                lastUndoAction: null,
              }))
              break
            case 'DELETE':
              set(state => ({
                transactions: [lastAction.data, ...state.transactions],
                lastUndoAction: null,
              }))
              break
            case 'EDIT':
              set(state => ({
                transactions: state.transactions.map(t =>
                  t.id === lastAction.data.id ? lastAction.data.original : t
                ),
                lastUndoAction: null,
              }))
              break
          }
        } finally {
          set({ isLoading: false })
        }
      },

      // Presets
      addPreset: preset => {
        const newPreset = { ...preset, id: `preset-${Date.now()}` }
        set(state => ({
          presets: [...state.presets, newPreset],
        }))
      },

      deletePreset: id => {
        set(state => ({
          presets: state.presets.filter(p => p.id !== id),
        }))
      },

      applyPreset: presetId => {
        const preset = get().presets.find(p => p.id === presetId)
        if (!preset) return null

        return {
          date: new Date(),
          type: preset.type,
          amount: preset.amount.toString(),
          categoryId: preset.categoryId,
          accountId: preset.accountId,
          memo: preset.name,
        }
      },

      // Auto Classification
      addRule: rule => {
        const newRule = { ...rule, id: `rule-${Date.now()}` }
        set(state => ({
          rules: [...state.rules, newRule],
        }))
      },

      suggestCategory: memo => {
        if (!memo) return null

        const rules = get().rules.filter(r => r.isActive)
        for (const rule of rules) {
          const regex = new RegExp(rule.pattern, 'i')
          if (regex.test(memo)) {
            return {
              categoryId: rule.categoryId,
              confidence: rule.confidence,
            }
          }
        }
        return null
      },

      // Bulk Operations
      importTransactions: async transactions => {
        set({ isLoading: true })
        try {
          set(state => ({
            transactions: [...transactions, ...state.transactions],
          }))
        } finally {
          set({ isLoading: false })
        }
      },

      // Utilities
      getStats: () => {
        const transactions = get().transactions
        const now = new Date()
        const thisMonth = transactions.filter(
          t => t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear()
        )

        return {
          totalExpense: transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0),
          totalIncome: transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0),
          transactionCount: transactions.length,
          thisMonth: {
            expense: thisMonth
              .filter(t => t.type === 'EXPENSE')
              .reduce((sum, t) => sum + t.amount, 0),
            income: thisMonth
              .filter(t => t.type === 'INCOME')
              .reduce((sum, t) => sum + t.amount, 0),
            count: thisMonth.length,
          },
        }
      },

      checkDuplicate: transaction => {
        const transactions = get().transactions
        const targetDate = transaction.date
        const targetAmount = parseFloat(transaction.amount)

        // Check for transactions within ±1 day with same amount
        return (
          transactions.find(t => {
            const daysDiff = Math.abs(
              (t.date.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            const amountMatch = Math.abs(t.amount - targetAmount) < 1

            if (daysDiff <= 1 && amountMatch) {
              // Check memo similarity using simple Levenshtein
              const memo1 = (transaction.memo || '').toLowerCase()
              const memo2 = (t.memo || '').toLowerCase()
              const similarity =
                1 - levenshteinDistance(memo1, memo2) / Math.max(memo1.length, memo2.length)

              return similarity >= 0.8
            }
            return false
          }) || null
        )
      },

      refreshFromAPI: async () => {
        set({ isLoading: true })
        try {
          // ✅ API 호출 활성화!
          const response = await fetch('/api/transactions')

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }

          const data = await response.json()

          const formattedTransactions: Transaction[] = data.data.map((apiTx: any) => ({
            id: apiTx.id.toString(),
            type: apiTx.type,
            date: new Date(apiTx.date),
            amount: apiTx.amount / 100, // Convert from cents
            category: apiTx.category || {
              id: 'unknown',
              name: 'Unknown',
              type: apiTx.type,
            },
            account: apiTx.account || {
              id: 'unknown',
              name: 'Unknown',
              type: 'CASH',
            },
            memo: apiTx.memo,
            isDuplicate: false,
            createdAt: new Date(apiTx.createdAt),
            updatedAt: new Date(apiTx.updatedAt),
          }))

          set({ transactions: formattedTransactions })
        } catch (error) {
          console.error('Failed to refresh from API:', error)
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'ledger-v1',
      partialize: state => ({
        transactions: state.transactions,
        presets: state.presets,
        rules: state.rules,
      }),
    }
  )
)

// Simple Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}
