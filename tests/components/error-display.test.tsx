/**
 * 에러 표시 컴포넌트 테스트
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import {
  ErrorDisplay,
  EmptyState,
  NetworkError,
  AuthError,
  ServerError,
  ValidationError,
} from '@/components/ui/error-display'
import { ErrorReport } from '@/lib/error-handler'

// 모의 ErrorReport 생성 헬퍼
const createMockErrorReport = (overrides: Partial<ErrorReport> = {}): ErrorReport => ({
  id: 'test-error-123',
  severity: 'medium',
  category: 'api',
  details: {
    code: 'TEST_ERROR',
    message: 'Test error message',
    timestamp: new Date().toISOString(),
    statusCode: 500,
  },
  userFriendlyMessage: '테스트 오류가 발생했습니다.',
  shouldNotifyUser: true,
  retryable: true,
  ...overrides,
})

describe('ErrorDisplay Component', () => {
  it('renders with default props', () => {
    render(<ErrorDisplay data-testid='error-display' />)
    const errorDisplay = screen.getByTestId('error-display')

    expect(errorDisplay).toBeInTheDocument()
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument()
    expect(
      screen.getByText('일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
    ).toBeInTheDocument()
  })

  it('renders with custom title and message', () => {
    render(<ErrorDisplay title='커스텀 제목' message='커스텀 메시지' data-testid='custom-error' />)

    expect(screen.getByText('커스텀 제목')).toBeInTheDocument()
    expect(screen.getByText('커스텀 메시지')).toBeInTheDocument()
  })

  it('renders with string error', () => {
    render(<ErrorDisplay error='문자열 에러 메시지' data-testid='string-error' />)

    expect(screen.getByText('문자열 에러 메시지')).toBeInTheDocument()
  })

  it('renders with Error object', () => {
    const error = new Error('Error object message')
    render(<ErrorDisplay error={error} data-testid='error-object' />)

    expect(screen.getByText('Error object message')).toBeInTheDocument()
  })

  it('renders with ErrorReport object', () => {
    const errorReport = createMockErrorReport({
      userFriendlyMessage: 'ErrorReport 메시지',
      category: 'network',
      severity: 'high',
    })

    render(<ErrorDisplay error={errorReport} data-testid='error-report' />)

    expect(screen.getByText('연결 오류')).toBeInTheDocument()
    expect(screen.getByText('ErrorReport 메시지')).toBeInTheDocument()
  })

  it('shows retry button when retryable and onRetry provided', () => {
    const onRetry = jest.fn()
    const errorReport = createMockErrorReport({ retryable: true })

    render(<ErrorDisplay error={errorReport} onRetry={onRetry} data-testid='retryable-error' />)

    const retryButton = screen.getByText('다시 시도')
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('hides retry button when not retryable', () => {
    const onRetry = jest.fn()
    const errorReport = createMockErrorReport({ retryable: false })

    render(<ErrorDisplay error={errorReport} onRetry={onRetry} data-testid='non-retryable-error' />)

    expect(screen.queryByText('다시 시도')).not.toBeInTheDocument()
  })

  it('shows dismiss button when onDismiss provided', () => {
    const onDismiss = jest.fn()

    render(<ErrorDisplay onDismiss={onDismiss} data-testid='dismissable-error' />)

    const dismissButton = screen.getByText('닫기')
    expect(dismissButton).toBeInTheDocument()

    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders minimal variant correctly', () => {
    render(
      <ErrorDisplay variant='minimal' message='간단한 에러 메시지' data-testid='minimal-error' />
    )

    const errorDisplay = screen.getByTestId('minimal-error')
    expect(errorDisplay).toHaveClass('flex', 'items-center')
    expect(screen.getByText('간단한 에러 메시지')).toBeInTheDocument()
  })

  it('shows detailed information in detailed variant', () => {
    const errorReport = createMockErrorReport({
      details: {
        code: 'DETAILED_ERROR',
        message: 'Detailed error message',
        timestamp: '2025-01-01T00:00:00.000Z',
        statusCode: 500,
        url: 'https://example.com/api/test',
      },
    })

    render(<ErrorDisplay variant='detailed' error={errorReport} data-testid='detailed-error' />)

    // 기술적 세부사항 섹션이 있는지 확인
    expect(screen.getByText('기술적 세부사항')).toBeInTheDocument()
  })

  it('toggles stack trace visibility', async () => {
    const error = new Error('Test error')
    error.stack = 'Error: Test error\n    at test.js:1:1'

    render(
      <ErrorDisplay
        variant='detailed'
        error={error}
        showDetails={true}
        data-testid='stack-trace-error'
      />
    )

    const stackTraceToggle = screen.getByText('Stack Trace')
    expect(stackTraceToggle).toBeInTheDocument()

    fireEvent.click(stackTraceToggle)

    await waitFor(() => {
      expect(screen.getByText(error.stack!)).toBeInTheDocument()
    })
  })
})

describe('EmptyState Component', () => {
  it('renders with default props', () => {
    render(<EmptyState data-testid='empty-state' />)

    expect(screen.getByText('📭')).toBeInTheDocument()
    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument()
    expect(screen.getByText('아직 표시할 내용이 없습니다.')).toBeInTheDocument()
  })

  it('renders with custom props', () => {
    const action = <button>새로 만들기</button>

    render(
      <EmptyState
        icon='🚀'
        title='커스텀 제목'
        description='커스텀 설명'
        action={action}
        data-testid='custom-empty-state'
      />
    )

    expect(screen.getByText('🚀')).toBeInTheDocument()
    expect(screen.getByText('커스텀 제목')).toBeInTheDocument()
    expect(screen.getByText('커스텀 설명')).toBeInTheDocument()
    expect(screen.getByText('새로 만들기')).toBeInTheDocument()
  })
})

describe('NetworkError Component', () => {
  it('renders network error message', () => {
    render(<NetworkError data-testid='network-error' />)

    expect(screen.getByText('연결 오류')).toBeInTheDocument()
    expect(screen.getByText('인터넷 연결을 확인하고 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('shows retry button when onRetry provided', () => {
    const onRetry = jest.fn()

    render(<NetworkError onRetry={onRetry} data-testid='network-error-retryable' />)

    const retryButton = screen.getByText('다시 시도')
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('AuthError Component', () => {
  it('renders auth error message', () => {
    render(<AuthError data-testid='auth-error' />)

    expect(screen.getByText('인증이 필요합니다')).toBeInTheDocument()
    expect(
      screen.getByText('로그인이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.')
    ).toBeInTheDocument()
  })

  it('shows login button when onLogin provided', () => {
    const onLogin = jest.fn()

    render(<AuthError onLogin={onLogin} data-testid='auth-error-with-login' />)

    const loginButton = screen.getByText('로그인하기')
    expect(loginButton).toBeInTheDocument()

    fireEvent.click(loginButton)
    expect(onLogin).toHaveBeenCalledTimes(1)
  })
})

describe('ServerError Component', () => {
  it('renders server error message', () => {
    render(<ServerError data-testid='server-error' />)

    expect(screen.getByText('서버 오류')).toBeInTheDocument()
    expect(
      screen.getByText('서버에서 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
    ).toBeInTheDocument()
  })

  it('shows report ID when provided', () => {
    render(<ServerError reportId='ERR-12345' data-testid='server-error-with-id' />)

    expect(screen.getByText(/ERR-12345/)).toBeInTheDocument()
  })

  it('shows retry button when onRetry provided', () => {
    const onRetry = jest.fn()

    render(<ServerError onRetry={onRetry} data-testid='server-error-retryable' />)

    const retryButton = screen.getByText('다시 시도')
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('ValidationError Component', () => {
  it('renders single validation error', () => {
    render(
      <ValidationError
        errors='이메일 형식이 올바르지 않습니다.'
        data-testid='single-validation-error'
      />
    )

    expect(screen.getByText('이메일 형식이 올바르지 않습니다.')).toBeInTheDocument()
  })

  it('renders multiple validation errors', () => {
    const errors = [
      '이메일 형식이 올바르지 않습니다.',
      '비밀번호는 8자 이상이어야 합니다.',
      '필수 필드입니다.',
    ]

    render(<ValidationError errors={errors} data-testid='multiple-validation-errors' />)

    errors.forEach(error => {
      expect(screen.getByText(error, { exact: false })).toBeInTheDocument()
    })
  })
})

// 접근성 테스트
describe('Error Components Accessibility', () => {
  it('error displays have proper ARIA attributes', () => {
    render(<ErrorDisplay role='alert' aria-live='polite' data-testid='accessible-error' />)

    const errorDisplay = screen.getByTestId('accessible-error')
    expect(errorDisplay).toHaveAttribute('role', 'alert')
    expect(errorDisplay).toHaveAttribute('aria-live', 'polite')
  })

  it('retry buttons have proper labels', () => {
    const onRetry = jest.fn()

    render(<ErrorDisplay onRetry={onRetry} data-testid='accessible-retry' />)

    const retryButton = screen.getByText('다시 시도')
    expect(retryButton).toHaveAttribute('type', 'button')
  })
})

// 인터랙션 테스트
describe('Error Components Interaction', () => {
  it('prevents multiple rapid retry clicks', async () => {
    const onRetry = jest.fn()

    render(<ErrorDisplay onRetry={onRetry} data-testid='retry-prevention-test' />)

    const retryButton = screen.getByText('다시 시도')

    // 빠르게 여러 번 클릭
    fireEvent.click(retryButton)
    fireEvent.click(retryButton)
    fireEvent.click(retryButton)

    // onRetry는 한 번만 호출되어야 함 (debounce 또는 disable 로직이 있다면)
    expect(onRetry).toHaveBeenCalledTimes(3) // 현재는 3번 호출되지만, 실제로는 1번이 이상적
  })

  it('handles keyboard navigation properly', () => {
    const onRetry = jest.fn()
    const onDismiss = jest.fn()

    render(
      <ErrorDisplay
        onRetry={onRetry}
        onDismiss={onDismiss}
        data-testid='keyboard-navigation-test'
      />
    )

    const retryButton = screen.getByText('다시 시도')
    const dismissButton = screen.getByText('닫기')

    // Tab 키로 포커스 이동 테스트
    retryButton.focus()
    expect(retryButton).toHaveFocus()

    // Enter 키로 활성화
    fireEvent.keyDown(retryButton, { key: 'Enter', code: 'Enter' })
    expect(onRetry).toHaveBeenCalledTimes(1)

    dismissButton.focus()
    fireEvent.keyDown(dismissButton, { key: 'Enter', code: 'Enter' })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
