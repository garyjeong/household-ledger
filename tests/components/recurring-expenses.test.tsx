/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecurringExpenseForm } from '@/components/recurring-expenses/RecurringExpenseForm'
import { RecurringExpenseList } from '@/components/recurring-expenses/RecurringExpenseList'
import { RecurringExpenseDialog } from '@/components/recurring-expenses/RecurringExpenseDialog'

// Mock UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" onClick={() => onValueChange && onValueChange('test')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`} onClick={() => {}}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div role="menuitem" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}))

// Mock 데이터
const mockAccounts = [
  { id: '1', name: '신한은행 주계좌', type: 'BANK' },
  { id: '2', name: '카카오뱅크', type: 'BANK' },
]

const mockCategories = [
  { id: '1', name: '생활비', color: '#FF0000', type: 'EXPENSE' },
  { id: '2', name: '구독료', color: '#00FF00', type: 'EXPENSE' },
]

const mockRecurringExpense = {
  id: '1',
  ownerType: 'USER' as const,
  ownerId: '1',
  startDate: '2024-01-01',
  frequency: 'MONTHLY' as const,
  dayRule: 'D25',
  amount: 50000,
  accountId: '1',
  categoryId: '1',
  merchant: '넷플릭스',
  memo: '구독료',
  isActive: true,
  account: mockAccounts[0],
  category: mockCategories[0],
}

describe('RecurringExpenseForm', () => {
  const defaultProps = {
    mode: 'create' as const,
    accounts: mockAccounts,
    categories: mockCategories,
    ownerType: 'USER' as const,
    ownerId: '1',
    onSubmit: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('폼이 올바르게 렌더링되어야 한다', () => {
    render(<RecurringExpenseForm {...defaultProps} />)
    
    expect(screen.getByText('고정 지출 추가')).toBeInTheDocument()
    expect(screen.getByLabelText(/시작 날짜/)).toBeInTheDocument()
    expect(screen.getByText('반복 주기 *')).toBeInTheDocument()
    expect(screen.getByText('반복 날짜 *')).toBeInTheDocument()
    expect(screen.getByLabelText(/금액/)).toBeInTheDocument()
    expect(screen.getByText('계좌 *')).toBeInTheDocument()
  })

  it('필수 필드가 비어있을 때 유효성 검사 오류를 표시해야 한다', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn()
    
    render(<RecurringExpenseForm {...defaultProps} onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: '추가' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('시작 날짜를 선택해주세요')).toBeInTheDocument()
      expect(screen.getByText('금액을 입력해주세요')).toBeInTheDocument()
      expect(screen.getByText('계좌를 선택해주세요')).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('올바른 데이터로 폼을 제출할 수 있어야 한다', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined)
    
    render(<RecurringExpenseForm {...defaultProps} onSubmit={mockOnSubmit} />)
    
    // 폼 필드 채우기
    await user.type(screen.getByLabelText(/시작 날짜/), '2024-01-01')
    await user.type(screen.getByLabelText(/금액/), '50000')
    
    // 계좌 선택
    await user.click(screen.getByText('계좌 선택'))
    await user.click(screen.getByText('신한은행 주계좌 (BANK)'))
    
    const submitButton = screen.getByRole('button', { name: '추가' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          amount: 50000,
          accountId: '1',
          ownerType: 'USER',
          ownerId: '1',
        })
      )
    })
  })

  it('수정 모드에서 초기 데이터를 올바르게 표시해야 한다', () => {
    render(
      <RecurringExpenseForm 
        {...defaultProps} 
        mode="edit"
        initialData={mockRecurringExpense}
      />
    )
    
    expect(screen.getByText('고정 지출 수정')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50,000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('넷플릭스')).toBeInTheDocument()
    expect(screen.getByDisplayValue('구독료')).toBeInTheDocument()
  })

  it('활성 상태 토글이 작동해야 한다', async () => {
    const user = userEvent.setup()
    
    render(<RecurringExpenseForm {...defaultProps} />)
    
    const toggleButton = screen.getByRole('button', { name: '' })
    expect(screen.getByText('활성')).toBeInTheDocument()
    
    await user.click(toggleButton)
    expect(screen.getByText('비활성')).toBeInTheDocument()
  })
})

describe('RecurringExpenseList', () => {
  const defaultProps = {
    expenses: [mockRecurringExpense],
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onToggleActive: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('고정 지출 목록이 올바르게 렌더링되어야 한다', () => {
    render(<RecurringExpenseList {...defaultProps} />)
    
    expect(screen.getByText('매월 25일')).toBeInTheDocument()
    expect(screen.getByText('50,000원')).toBeInTheDocument()
    expect(screen.getByText('넷플릭스')).toBeInTheDocument()
    expect(screen.getByText('신한은행 주계좌')).toBeInTheDocument()
    expect(screen.getByText('생활비')).toBeInTheDocument()
  })

  it('빈 목록일 때 적절한 메시지를 표시해야 한다', () => {
    render(<RecurringExpenseList {...defaultProps} expenses={[]} />)
    
    expect(screen.getByText('등록된 고정 지출이 없습니다')).toBeInTheDocument()
    expect(screen.getByText('새로운 고정 지출을 추가해보세요')).toBeInTheDocument()
  })

  it('로딩 상태를 올바르게 표시해야 한다', () => {
    render(<RecurringExpenseList {...defaultProps} isLoading={true} />)
    
    expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number))
    // 스켈레톤 로더가 표시되는지 확인
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('검색 기능이 작동해야 한다', async () => {
    const user = userEvent.setup()
    
    const multipleExpenses = [
      mockRecurringExpense,
      {
        ...mockRecurringExpense,
        id: '2',
        merchant: '스타벅스',
        memo: '커피',
      },
    ]
    
    render(
      <RecurringExpenseList 
        {...defaultProps} 
        expenses={multipleExpenses}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/검색/)
    await user.type(searchInput, '넷플릭스')
    
    await waitFor(() => {
      expect(screen.getByText('넷플릭스')).toBeInTheDocument()
      expect(screen.queryByText('스타벅스')).not.toBeInTheDocument()
    })
  })

  it('수정 버튼을 클릭하면 onEdit이 호출되어야 한다', async () => {
    const user = userEvent.setup()
    const mockOnEdit = jest.fn()
    
    render(<RecurringExpenseList {...defaultProps} onEdit={mockOnEdit} />)
    
    // 더보기 메뉴 클릭
    await user.click(screen.getByRole('button', { name: '' }))
    
    // 수정 버튼 클릭
    const editButton = screen.getByText('수정')
    await user.click(editButton)
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockRecurringExpense)
  })

  it('삭제 버튼을 클릭하면 onDelete가 호출되어야 한다', async () => {
    const user = userEvent.setup()
    const mockOnDelete = jest.fn()
    
    render(<RecurringExpenseList {...defaultProps} onDelete={mockOnDelete} />)
    
    // 더보기 메뉴 클릭
    await user.click(screen.getByRole('button', { name: '' }))
    
    // 삭제 버튼 클릭
    const deleteButton = screen.getByText('삭제')
    await user.click(deleteButton)
    
    expect(mockOnDelete).toHaveBeenCalledWith('1')
  })
})

describe('RecurringExpenseDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    mode: 'create' as const,
    accounts: mockAccounts,
    categories: mockCategories,
    ownerType: 'USER' as const,
    ownerId: '1',
    onSubmit: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('다이얼로그가 올바르게 렌더링되어야 한다', () => {
    render(<RecurringExpenseDialog {...defaultProps} />)
    
    expect(screen.getByText('고정 지출 추가')).toBeInTheDocument()
    expect(screen.getByLabelText(/시작 날짜/)).toBeInTheDocument()
  })

  it('닫기 버튼을 클릭하면 onClose가 호출되어야 한다', async () => {
    const user = userEvent.setup()
    const mockOnClose = jest.fn()
    
    render(<RecurringExpenseDialog {...defaultProps} onClose={mockOnClose} />)
    
    const cancelButton = screen.getByText('취소')
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('폼 제출 시 onSubmit이 호출되고 다이얼로그가 닫혀야 한다', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined)
    const mockOnClose = jest.fn()
    
    render(
      <RecurringExpenseDialog 
        {...defaultProps} 
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
      />
    )
    
    // 필수 필드 채우기
    await user.type(screen.getByLabelText(/시작 날짜/), '2024-01-01')
    await user.type(screen.getByLabelText(/금액/), '50000')
    
    // 계좌 선택
    await user.click(screen.getByText('계좌 선택'))
    await user.click(screen.getByText('신한은행 주계좌 (BANK)'))
    
    const submitButton = screen.getByRole('button', { name: '추가' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
