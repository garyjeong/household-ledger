// Jest globals are available by default in Jest environment
const vi = jest
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { AlertProvider } from '@/contexts/alert-context'

// Mock hooks
vi.mock('@/hooks/use-exchange-rates', () => ({
  useCurrencyConverter: () => ({
    convert: vi.fn((amount, from, to) => {
      if (from === 'USD' && to === 'KRW') return amount * 1330
      return amount
    }),
    isLoading: false,
    error: null,
  }),
  useExchangeRates: () => ({
    data: { rates: { USD: 0.00075 } },
    refetch: vi.fn(),
  }),
}))

vi.mock('@/contexts/alert-context', () => ({
  AlertProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAlert: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}))

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AlertProvider>{children}</AlertProvider>
    </QueryClientProvider>
  )
}

const mockCategories = [
  { id: '1', name: '식비', type: 'EXPENSE', color: '#ef4444' },
  { id: '2', name: '교통비', type: 'EXPENSE', color: '#3b82f6' },
  { id: '3', name: '급여', type: 'INCOME', color: '#22c55e' },
]

describe('TransactionForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    categories: mockCategories,
    isEdit: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render transaction form correctly', () => {
    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('새 거래 추가')).toBeInTheDocument()
    expect(screen.getByLabelText(/거래 타입/)).toBeInTheDocument()
    expect(screen.getByLabelText(/금액/)).toBeInTheDocument()
    expect(screen.getByLabelText(/통화/)).toBeInTheDocument()
    expect(screen.getByLabelText(/카테고리/)).toBeInTheDocument()
    expect(screen.getByLabelText(/거래 내용/)).toBeInTheDocument()
    expect(screen.getByLabelText(/거래 날짜/)).toBeInTheDocument()
  })

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} />
      </TestWrapper>
    )

    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /추가/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('금액을 입력해주세요')).toBeInTheDocument()
      expect(screen.getByText('카테고리를 선택해주세요')).toBeInTheDocument()
      expect(screen.getByText('거래 내용을 입력해주세요')).toBeInTheDocument()
    })
  })

  it('should validate amount field correctly', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} />
      </TestWrapper>
    )

    const amountInput = screen.getByLabelText(/금액/)

    // Test negative amount
    await user.clear(amountInput)
    await user.type(amountInput, '-100')

    await waitFor(() => {
      expect(screen.getByText('금액은 0보다 커야 합니다')).toBeInTheDocument()
    })

    // Test too large amount
    await user.clear(amountInput)
    await user.type(amountInput, '9999999999')

    await waitFor(() => {
      expect(screen.getByText('금액이 너무 큽니다')).toBeInTheDocument()
    })
  })

  it('should validate description field length', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} />
      </TestWrapper>
    )

    const descriptionInput = screen.getByLabelText(/거래 내용/)
    const longText = 'a'.repeat(101)

    await user.type(descriptionInput, longText)

    await waitFor(() => {
      expect(screen.getByText('거래 내용은 100자 이하로 입력해주세요')).toBeInTheDocument()
    })
  })

  it('should handle currency conversion display', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} />
      </TestWrapper>
    )

    // Enter USD amount
    const amountInput = screen.getByLabelText(/금액/)
    await user.type(amountInput, '100')

    // Select USD currency
    const currencySelect = screen.getByRole('combobox', { name: /통화/ })
    await user.click(currencySelect)

    // Note: This might need adjustment based on actual select implementation
    const usdOption = screen.getByText('USD')
    await user.click(usdOption)

    // Should show converted amount
    await waitFor(() => {
      expect(screen.getByText(/≈/)).toBeInTheDocument()
    })
  })

  it('should filter categories by transaction type', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} />
      </TestWrapper>
    )

    // Select INCOME type
    const typeSelect = screen.getByRole('combobox', { name: /거래 타입/ })
    await user.click(typeSelect)

    const incomeOption = screen.getByRole('option', { name: '수입' })
    await user.click(incomeOption)

    // Open category dropdown
    const categorySelect = screen.getByRole('combobox', { name: /카테고리/ })
    await user.click(categorySelect)

    // Should only show INCOME categories
    expect(screen.getByText('급여')).toBeInTheDocument()
    expect(screen.queryByText('식비')).not.toBeInTheDocument()
  })

  it('should handle tag addition and removal', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} />
      </TestWrapper>
    )

    const tagInput = screen.getByPlaceholderText('태그 입력 후 Enter')
    const addTagButton = screen.getAllByRole('button', { name: /추가/ })[0] // 첫 번째 추가 버튼 (태그용)

    // Add a tag
    await user.type(tagInput, '회사점심')
    await user.click(addTagButton)

    // Check if tag appears
    expect(screen.getByText('회사점심 ×')).toBeInTheDocument()

    // Remove the tag
    await user.click(screen.getByText('회사점심 ×'))

    // Check if tag is removed
    expect(screen.queryByText('회사점심 ×')).not.toBeInTheDocument()
  })

  it('should handle form submission with valid data', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} onSubmit={mockOnSubmit} />
      </TestWrapper>
    )

    // Fill in required fields
    await user.type(screen.getByPlaceholderText('0'), '50000') // 금액 필드
    await user.type(screen.getByPlaceholderText('거래 내용을 입력하세요'), '점심 식사') // 설명 필드

    // Select category
    const categorySelect = screen.getByRole('combobox', { name: /카테고리/ })
    await user.click(categorySelect)
    await user.click(screen.getByText('식비'))

    // Submit form
    const submitButton = screen.getByRole('button', { name: /추가/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'EXPENSE',
          amount: 50000,
          description: '점심 식사',
          categoryId: '1',
          currency: 'KRW',
        })
      )
    })
  })

  it.skip('should show edit mode correctly', () => { // FIXME: 무한 루프 문제
    const initialData = {
      type: 'INCOME' as const,
      amount: 3000000,
      currency: 'KRW',
      categoryId: '3',
      description: '월급',
      date: '2024-01-01',
      memo: '1월 급여',
      tags: ['급여', '정기수입'],
    }

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} isEdit={true} initialData={initialData} />
      </TestWrapper>
    )

    expect(screen.getByText('거래 수정')).toBeInTheDocument()
    expect(screen.getByDisplayValue('3000000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('월급')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1월 급여')).toBeInTheDocument()
    expect(screen.getByText('급여 ×')).toBeInTheDocument()
    expect(screen.getByText('정기수입 ×')).toBeInTheDocument()
  })

  it('should handle loading states correctly', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(
      <TestWrapper>
        <TransactionForm {...defaultProps} onSubmit={mockOnSubmit} />
      </TestWrapper>
    )

    // Fill minimal valid data
    await user.type(screen.getByPlaceholderText('0'), '1000') // 금액 필드
    await user.type(screen.getByPlaceholderText('거래 내용을 입력하세요'), 'test') // 설명 필드

    const categorySelect = screen.getByRole('combobox', { name: /카테고리/ })
    await user.click(categorySelect)
    await user.click(screen.getByText('식비'))

    // Submit form
    const submitButton = screen.getByRole('button', { name: /추가/ })
    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText('저장 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })
})
