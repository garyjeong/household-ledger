/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToastSystem } from '@/components/error/ToastProvider'

// Mock the error handler
jest.mock('@/lib/error-handler', () => ({
  onToast: jest.fn(() => () => {}), // mock unsubscribe function
  globalErrorHandler: {
    onNotification: jest.fn(() => () => {}), // mock unsubscribe function
  },
}))

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

// 테스트 컴포넌트
function TestComponent() {
  const { showSuccess, showError, showWarning, showInfo, dismissAll } = useToastSystem()

  return (
    <div>
      <button onClick={() => showSuccess('성공 메시지')}>
        Success Toast
      </button>
      <button onClick={() => showError('에러 메시지')}>
        Error Toast
      </button>
      <button onClick={() => showWarning('경고 메시지')}>
        Warning Toast
      </button>
      <button onClick={() => showInfo('정보 메시지')}>
        Info Toast
      </button>
      <button onClick={() => showSuccess('액션 토스트', { 
        action: { label: '되돌리기', onClick: () => {} }
      })}>
        Action Toast
      </button>
      <button onClick={dismissAll}>
        Dismiss All
      </button>
    </div>
  )
}

// 타이머 모킹
jest.useFakeTimers()

describe('ToastProvider', () => {
  afterEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  it('성공 토스트를 표시해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Success Toast')
    await user.click(button)

    expect(screen.getByText('성공')).toBeInTheDocument()
    expect(screen.getByText('성공 메시지')).toBeInTheDocument()
  })

  it('에러 토스트를 표시해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Error Toast')
    await user.click(button)

    expect(screen.getByText('오류')).toBeInTheDocument()
    expect(screen.getByText('에러 메시지')).toBeInTheDocument()
  })

  it('경고 토스트를 표시해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Warning Toast')
    await user.click(button)

    expect(screen.getByText('경고')).toBeInTheDocument()
    expect(screen.getByText('경고 메시지')).toBeInTheDocument()
  })

  it('정보 토스트를 표시해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Info Toast')
    await user.click(button)

    expect(screen.getByText('정보')).toBeInTheDocument()
    expect(screen.getByText('정보 메시지')).toBeInTheDocument()
  })

  it('액션 버튼이 있는 토스트를 표시해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Action Toast')
    await user.click(button)

    expect(screen.getByText('성공')).toBeInTheDocument()
    expect(screen.getByText('액션 토스트')).toBeInTheDocument()
    expect(screen.getByText('되돌리기')).toBeInTheDocument()
  })

  it('토스트 닫기 버튼이 작동해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // 토스트 생성
    const button = screen.getByText('Success Toast')
    await user.click(button)

    expect(screen.getByText('성공 메시지')).toBeInTheDocument()

    // 닫기 버튼 클릭 (X 버튼)
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(btn => btn.textContent === '')
    
    if (closeButton) {
      await user.click(closeButton)

      // 애니메이션 시간 대기
      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(screen.queryByText('성공 메시지')).not.toBeInTheDocument()
      })
    }
  })

  it('모든 토스트 닫기가 작동해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    // 여러 토스트 생성
    await user.click(screen.getByText('Success Toast'))
    await user.click(screen.getByText('Error Toast'))

    expect(screen.getByText('성공 메시지')).toBeInTheDocument()
    expect(screen.getByText('에러 메시지')).toBeInTheDocument()

    // 모든 토스트 닫기
    await user.click(screen.getByText('Dismiss All'))

    // 애니메이션 시간 대기
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(screen.queryByText('성공 메시지')).not.toBeInTheDocument()
      expect(screen.queryByText('에러 메시지')).not.toBeInTheDocument()
    })
  })

  it('자동 삭제가 작동해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider defaultDuration={3000}>
        <TestComponent />
      </ToastProvider>
    )

    // 토스트 생성
    await user.click(screen.getByText('Success Toast'))
    expect(screen.getByText('성공 메시지')).toBeInTheDocument()

    // 자동 삭제 시간까지 기다리기
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    // 애니메이션 시간도 기다리기
    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(screen.queryByText('성공 메시지')).not.toBeInTheDocument()
    })
  })

  it('최대 토스트 수를 제한해야 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    render(
      <ToastProvider maxToasts={2}>
        <TestComponent />
      </ToastProvider>
    )

    // 3개의 토스트 생성 (최대 2개만 표시되어야 함)
    await user.click(screen.getByText('Success Toast'))
    await user.click(screen.getByText('Error Toast'))
    await user.click(screen.getByText('Warning Toast'))

    // 첫 번째 토스트는 제거되고 마지막 2개만 남아있어야 함
    expect(screen.queryByText('성공 메시지')).not.toBeInTheDocument()
    expect(screen.getByText('에러 메시지')).toBeInTheDocument()
    expect(screen.getByText('경고 메시지')).toBeInTheDocument()
  })

  it('다른 위치에 토스트를 표시할 수 있어야 한다', () => {
    const { container } = render(
      <ToastProvider position="bottom-left">
        <TestComponent />
      </ToastProvider>
    )

    const toastContainer = container.querySelector('.bottom-4.left-4')
    expect(toastContainer).toBeInTheDocument()
  })
})
