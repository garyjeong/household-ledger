/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BalanceCard } from '@/components/balance/BalanceCard'
import { BalanceWidget } from '@/components/balance/BalanceWidget'

// Mock fetch
global.fetch = jest.fn()

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock 데이터
const mockBalanceResponse = {
  totalBalance: 2000000,
  accountBalances: [
    {
      id: '1',
      name: '신한은행 주계좌',
      type: 'BANK',
      currency: 'KRW',
      balance: 1500000,
      isActive: true,
    },
  ],
  currency: 'KRW',
  lastUpdated: '2024-01-01T12:00:00Z',
  recurringExpenses: {
    monthly: 50000,
    weekly: 15000,
    total: 65000,
    items: [
      {
        id: '1',
        amount: 50000,
        frequency: 'MONTHLY',
        dayRule: 'D25',
        merchant: '넷플릭스',
        isActive: true,
      },
    ],
  },
}

describe('BalanceCard', () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockBalanceResponse,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('잔액 정보를 올바르게 표시해야 한다', async () => {
    render(<BalanceCard ownerType='USER' ownerId='1' />)

    await waitFor(() => {
      expect(screen.getByText('전체 잔액')).toBeInTheDocument()
      expect(screen.getByText('2,000,000원')).toBeInTheDocument()
    })
  })

  it('로딩 상태를 올바르게 표시해야 한다', () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<BalanceCard ownerType='USER' ownerId='1' />)

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('에러 상태를 올바르게 표시해야 한다', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<BalanceCard ownerType='USER' ownerId='1' />)

    await waitFor(() => {
      expect(screen.getByText('잔액 로드 실패')).toBeInTheDocument()
    })
  })
})

describe('BalanceWidget', () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockBalanceResponse,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('컴팩트 모드에서 잔액 정보를 표시해야 한다', async () => {
    render(<BalanceWidget ownerType='USER' ownerId='1' compact={true} />)

    await waitFor(() => {
      expect(screen.getByText('잔액')).toBeInTheDocument()
      expect(screen.getByText('₩2,000,000')).toBeInTheDocument()
    })
  })

  it('마이너스 잔액을 올바르게 표시해야 한다', async () => {
    const negativeBalanceResponse = {
      ...mockBalanceResponse,
      totalBalance: -100000,
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => negativeBalanceResponse,
    })

    render(<BalanceWidget ownerType='USER' ownerId='1' />)

    await waitFor(() => {
      expect(screen.getByText('-₩100,000')).toBeInTheDocument()
      expect(screen.getByText('총 잔액')).toBeInTheDocument()
    })
  })
})
