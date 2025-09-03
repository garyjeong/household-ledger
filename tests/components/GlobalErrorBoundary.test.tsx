// tests/components/GlobalErrorBoundary.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GlobalErrorBoundary from '@/components/error/GlobalErrorBoundary'
import { safeConsole } from '@/lib/security-utils'

// Mock safeConsole
jest.mock('@/lib/security-utils', () => ({
  safeConsole: {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
  },
}))

// Mock window.location
const mockLocation = {
  href: '',
  reload: jest.fn(),
  pathname: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// 에러를 발생시키는 테스트 컴포넌트
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Normal content</div>
}

const NetworkError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    const error = new Error('Network request failed')
    error.name = 'NetworkError'
    throw error
  }
  return <div>Network content</div>
}

describe('GlobalErrorBoundary', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    // React Error Boundary 경고 메시지 억제
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockLocation.reload.mockClear()
    mockLocation.href = ''
    mockLocation.pathname = '/test-page'
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={false} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('Normal content')).toBeInTheDocument()
      expect(screen.queryByText('예상치 못한 오류가 발생했어요')).not.toBeInTheDocument()
    })

    it('should not call safeConsole.error when no error occurs', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={false} />
        </GlobalErrorBoundary>
      )

      expect(safeConsole.error).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should catch and display error UI when child component throws', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('앗! 예상치 못한 오류가 발생했어요')).toBeInTheDocument()
      expect(screen.getByText('서비스 이용에 불편을 드려 죄송합니다.')).toBeInTheDocument()
      expect(screen.queryByText('Normal content')).not.toBeInTheDocument()
    })

    it('should log error details using safeConsole', () => {
      render(
        <GlobalErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(safeConsole.error).toHaveBeenCalledWith(
        '[ErrorBoundary] Level: component',
        expect.any(Error),
        expect.any(Object)
      )
    })

    it('should display error message in error UI', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('오류 메시지:')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
  })

  describe('Error Level Handling', () => {
    it('should display global error message for global level', () => {
      render(
        <GlobalErrorBoundary level="global">
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('앗! 예상치 못한 오류가 발생했어요')).toBeInTheDocument()
    })

    it('should display page error message for page level', () => {
      render(
        <GlobalErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('페이지 로딩 중 오류가 발생했어요')).toBeInTheDocument()
    })

    it('should display component error message for component level', () => {
      render(
        <GlobalErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('컴포넌트 렌더링 중 오류가 발생했어요')).toBeInTheDocument()
    })

    it('should default to component level when no level specified', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('컴포넌트 렌더링 중 오류가 발생했어요')).toBeInTheDocument()
    })
  })

  describe('Retry Functionality', () => {
    it('should show retry button with correct attempt count', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      const retryButton = screen.getByText('다시 시도하기 (1/3)')
      expect(retryButton).toBeInTheDocument()
    })

    it('should reset error state when retry button is clicked', async () => {
      let shouldThrow = true
      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />

      const { rerender } = render(
        <GlobalErrorBoundary>
          <TestComponent />
        </GlobalErrorBoundary>
      )

      // 에러 상태 확인
      expect(screen.getByText('다시 시도하기 (1/3)')).toBeInTheDocument()

      // 에러 조건 해제하고 재시도
      shouldThrow = false
      fireEvent.click(screen.getByText('다시 시도하기 (1/3)'))

      // 리렌더링 후 정상 컨텐츠가 보여야 함
      rerender(
        <GlobalErrorBoundary>
          <TestComponent />
        </GlobalErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.queryByText('예상치 못한 오류가 발생했어요')).not.toBeInTheDocument()
      })
    })

    it('should increment retry count on subsequent retries', () => {
      const { rerender } = render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      // 첫 번째 재시도
      fireEvent.click(screen.getByText('다시 시도하기 (1/3)'))

      rerender(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('다시 시도하기 (2/3)')).toBeInTheDocument()
    })

    it('should disable retry after 3 attempts', () => {
      const { rerender } = render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      // 3번 재시도
      for (let i = 1; i <= 3; i++) {
        fireEvent.click(screen.getByText(`다시 시도하기 (${i}/3)`))
        rerender(
          <GlobalErrorBoundary>
            <ThrowError shouldThrow={true} />
          </GlobalErrorBoundary>
        )
      }

      expect(screen.getByText('여러 번 시도했지만 문제가 해결되지 않습니다.')).toBeInTheDocument()
      expect(screen.queryByText('다시 시도하기')).not.toBeInTheDocument()
    })

    it('should call onReset callback when retry is clicked', () => {
      const onReset = jest.fn()

      render(
        <GlobalErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      fireEvent.click(screen.getByText('다시 시도하기 (1/3)'))

      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('Page Refresh Functionality', () => {
    it('should show page refresh button', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('페이지 새로고침')).toBeInTheDocument()
    })

    it('should reload page when refresh button is clicked', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      fireEvent.click(screen.getByText('페이지 새로고침'))

      expect(mockLocation.reload).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>

      render(
        <GlobalErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.queryByText('예상치 못한 오류가 발생했어요')).not.toBeInTheDocument()
    })
  })

  describe('Development Mode Features', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should show stack trace in development mode', () => {
      process.env.NODE_ENV = 'development'

      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('스택 트레이스 (개발 모드):')).toBeInTheDocument()
    })

    it('should not show stack trace in production mode', () => {
      process.env.NODE_ENV = 'production'

      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.queryByText('스택 트레이스 (개발 모드):')).not.toBeInTheDocument()
    })
  })

  describe('Error Types', () => {
    it('should handle different error types appropriately', () => {
      render(
        <GlobalErrorBoundary>
          <NetworkError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('Network request failed')).toBeInTheDocument()
      expect(safeConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ErrorBoundary]'),
        expect.objectContaining({
          name: 'NetworkError',
          message: 'Network request failed',
        }),
        expect.any(Object)
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      const errorContainer = screen.getByRole('alert', { hidden: true }) || 
                           screen.getByText('앗! 예상치 못한 오류가 발생했어요').closest('div')
      
      expect(errorContainer).toBeInTheDocument()
    })

    it('should have keyboard accessible buttons', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      )

      const retryButton = screen.getByText('다시 시도하기 (1/3)')
      const refreshButton = screen.getByText('페이지 새로고침')

      expect(retryButton).toHaveAttribute('type', 'button')
      expect(refreshButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Edge Cases', () => {
    it('should handle errors without message', () => {
      const ErrorWithoutMessage = () => {
        const error = new Error()
        error.message = ''
        throw error
      }

      render(
        <GlobalErrorBoundary>
          <ErrorWithoutMessage />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('예상치 못한 오류가 발생했어요')).toBeInTheDocument()
    })

    it('should handle null or undefined errors gracefully', () => {
      const ErrorWithNull = () => {
        throw null
      }

      render(
        <GlobalErrorBoundary>
          <ErrorWithNull />
        </GlobalErrorBoundary>
      )

      expect(screen.getByText('예상치 못한 오류가 발생했어요')).toBeInTheDocument()
    })
  })
})
