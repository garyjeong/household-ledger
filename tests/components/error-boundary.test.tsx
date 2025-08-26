/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, ErrorBoundaryWrapper, withErrorBoundary } from '@/components/error/ErrorBoundary'

// Mock the error handler
jest.mock('@/lib/error-handler', () => ({
  globalErrorHandler: {
    handleError: jest.fn(() => ({
      id: 'test-error-id',
      severity: 'high',
      category: 'runtime',
      userFriendlyMessage: '일시적인 오류가 발생했습니다.',
      retryable: true,
      details: {
        message: 'Test error message',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    })),
  },
}))

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

// 에러를 발생시키는 테스트 컴포넌트
function ThrowError({ shouldThrow = false, errorMessage = 'Test error' }) {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div>No error</div>
}

// 콘솔 에러 스파이 설정
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('ErrorBoundary', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('에러가 없을 때 자식 컴포넌트를 정상적으로 렌더링해야 한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('에러가 발생했을 때 에러 UI를 표시해야 한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Component crashed!" />
      </ErrorBoundary>
    )

    expect(screen.getByText('컴포넌트 오류')).toBeInTheDocument()
    expect(screen.getByText('일시적인 오류가 발생했습니다.')).toBeInTheDocument()
    expect(screen.getByText('다시 시도 (3회 남음)')).toBeInTheDocument()
    expect(screen.getByText('페이지 새로고침')).toBeInTheDocument()
  })

  it('커스텀 fallback을 사용할 수 있어야 한다', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('컴포넌트 오류')).not.toBeInTheDocument()
  })

  it('다시 시도 버튼이 작동해야 한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const retryButton = screen.getByText('다시 시도 (3회 남음)')
    fireEvent.click(retryButton)

    // 재시도 후에는 에러가 발생하지 않으므로 정상 컴포넌트가 렌더링됨
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('최대 재시도 횟수에 도달하면 재시도 버튼이 비활성화되어야 한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    // 3번 재시도
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.getByText(/다시 시도/)
      fireEvent.click(retryButton)
    }

    // 재시도 버튼이 사라져야 함
    expect(screen.queryByText(/다시 시도/)).not.toBeInTheDocument()
  })

  it('상세 정보 토글이 작동해야 한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Detailed error message" />
      </ErrorBoundary>
    )

    // 처음에는 상세 정보가 숨겨져 있어야 함
    expect(screen.queryByText('에러 타입:')).not.toBeInTheDocument()

    // 상세 정보 보기 버튼 클릭
    const toggleButton = screen.getByText('상세 정보 보기')
    fireEvent.click(toggleButton)

    // 상세 정보가 표시되어야 함
    expect(screen.getByText('에러 타입:')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Detailed error message')).toBeInTheDocument()

    // 다시 클릭하면 숨겨져야 함
    const hideButton = screen.getByText('상세 정보 숨기기')
    fireEvent.click(hideButton)

    expect(screen.queryByText('에러 타입:')).not.toBeInTheDocument()
  })

  it('레벨에 따른 다른 타이틀을 표시해야 한다', () => {
    render(
      <ErrorBoundary level="app">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('애플리케이션 오류')).toBeInTheDocument()
  })

  it('컴포넌트 이름을 표시해야 한다', () => {
    render(
      <ErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('TestComponent에서 오류가 발생했습니다')).toBeInTheDocument()
  })

  it('앱 레벨에서는 홈으로 가기 버튼이 표시되지 않아야 한다', () => {
    render(
      <ErrorBoundary level="app">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('홈으로 가기')).not.toBeInTheDocument()
  })

  it('페이지/컴포넌트 레벨에서는 홈으로 가기 버튼이 표시되어야 한다', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('홈으로 가기')).toBeInTheDocument()
  })
})

describe('ErrorBoundaryWrapper', () => {
  it('래퍼 컴포넌트가 올바르게 작동해야 한다', () => {
    render(
      <ErrorBoundaryWrapper level="page" componentName="WrapperTest">
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryWrapper>
    )

    expect(screen.getByText('페이지 오류')).toBeInTheDocument()
    expect(screen.getByText('WrapperTest에서 오류가 발생했습니다')).toBeInTheDocument()
  })
})

describe('withErrorBoundary HOC', () => {
  it('HOC가 컴포넌트를 올바르게 래핑해야 한다', () => {
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => (
      <ThrowError shouldThrow={shouldThrow} />
    )
    TestComponent.displayName = 'TestComponent'

    const WrappedComponent = withErrorBoundary(TestComponent)

    render(<WrappedComponent shouldThrow={true} />)

    expect(screen.getByText('컴포넌트 오류')).toBeInTheDocument()
    expect(screen.getByText('TestComponent에서 오류가 발생했습니다')).toBeInTheDocument()
  })

  it('HOC가 올바른 displayName을 설정해야 한다', () => {
    const TestComponent = () => <div>Test</div>
    TestComponent.displayName = 'TestComponent'

    const WrappedComponent = withErrorBoundary(TestComponent)

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
  })

  it('HOC에 에러 바운더리 props를 전달할 수 있어야 한다', () => {
    const TestComponent = () => <ThrowError shouldThrow={true} />
    const customFallback = <div>HOC Custom fallback</div>

    const WrappedComponent = withErrorBoundary(TestComponent, {
      fallback: customFallback,
      level: 'page',
    })

    render(<WrappedComponent />)

    expect(screen.getByText('HOC Custom fallback')).toBeInTheDocument()
  })
})
