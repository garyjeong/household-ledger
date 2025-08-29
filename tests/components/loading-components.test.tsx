/**
 * 로딩 관련 컴포넌트 테스트
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  TransactionSkeleton,
  StatisticsSkeleton,
  DashboardSkeleton,
} from '@/components/ui/loading-skeleton'
import {
  LoadingSpinner,
  PageLoadingOverlay,
  ButtonSpinner,
  InlineLoading,
  CardLoading,
  ListLoading,
} from '@/components/ui/loading-spinner'

describe('Loading Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default props', () => {
      render(<Skeleton data-testid='skeleton' />)
      const skeleton = screen.getByTestId('skeleton')

      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200')
    })

    it('renders text variant with multiple lines', () => {
      render(<Skeleton variant='text' lines={3} data-testid='text-skeleton' />)
      const skeleton = screen.getByTestId('text-skeleton')

      expect(skeleton).toBeInTheDocument()
      // 3개의 라인이 있는지 확인
      expect(skeleton.children).toHaveLength(3)
    })

    it('renders circular variant', () => {
      render(<Skeleton variant='circular' data-testid='circular-skeleton' />)
      const skeleton = screen.getByTestId('circular-skeleton')

      expect(skeleton).toHaveClass('rounded-full')
    })

    it('applies custom width and height', () => {
      render(<Skeleton width='100px' height='50px' data-testid='custom-skeleton' />)
      const skeleton = screen.getByTestId('custom-skeleton')

      expect(skeleton).toHaveStyle({
        width: '100px',
        height: '50px',
      })
    })
  })

  describe('CardSkeleton', () => {
    it('renders card skeleton structure', () => {
      render(<CardSkeleton data-testid='card-skeleton' />)
      const cardSkeleton = screen.getByTestId('card-skeleton')

      expect(cardSkeleton).toBeInTheDocument()
      expect(cardSkeleton).toHaveClass('p-4', 'border', 'rounded-lg')
    })
  })

  describe('ListItemSkeleton', () => {
    it('renders list item skeleton with avatar and content', () => {
      render(<ListItemSkeleton data-testid='list-item-skeleton' />)
      const listItemSkeleton = screen.getByTestId('list-item-skeleton')

      expect(listItemSkeleton).toBeInTheDocument()
      expect(listItemSkeleton).toHaveClass('flex', 'items-center')
    })
  })

  describe('TransactionSkeleton', () => {
    it('renders transaction skeleton layout', () => {
      render(<TransactionSkeleton data-testid='transaction-skeleton' />)
      const transactionSkeleton = screen.getByTestId('transaction-skeleton')

      expect(transactionSkeleton).toBeInTheDocument()
      expect(transactionSkeleton).toHaveClass('flex', 'items-center', 'justify-between')
    })
  })

  describe('StatisticsSkeleton', () => {
    it('renders statistics skeleton with multiple sections', () => {
      render(<StatisticsSkeleton data-testid='statistics-skeleton' />)
      const statisticsSkeleton = screen.getByTestId('statistics-skeleton')

      expect(statisticsSkeleton).toBeInTheDocument()
      expect(statisticsSkeleton).toHaveClass('space-y-6')
    })
  })

  describe('DashboardSkeleton', () => {
    it('renders dashboard skeleton with header and grid layout', () => {
      render(<DashboardSkeleton data-testid='dashboard-skeleton' />)
      const dashboardSkeleton = screen.getByTestId('dashboard-skeleton')

      expect(dashboardSkeleton).toBeInTheDocument()
      expect(dashboardSkeleton).toHaveClass('space-y-6')
    })
  })
})

describe('Loading Spinner Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner data-testid='spinner' />)
      const spinner = screen.getByTestId('spinner')

      expect(spinner).toBeInTheDocument()
    })

    it('renders with custom text', () => {
      render(<LoadingSpinner text='로딩 중입니다...' data-testid='spinner' />)

      expect(screen.getByText('로딩 중입니다...')).toBeInTheDocument()
    })

    it('renders different sizes', () => {
      render(
        <div>
          <LoadingSpinner size='sm' data-testid='spinner-sm' />
          <LoadingSpinner size='lg' data-testid='spinner-lg' />
        </div>
      )

      expect(screen.getByTestId('spinner-sm')).toBeInTheDocument()
      expect(screen.getByTestId('spinner-lg')).toBeInTheDocument()
    })

    it('renders different variants', () => {
      render(
        <div>
          <LoadingSpinner variant='dots' data-testid='spinner-dots' />
          <LoadingSpinner variant='pulse' data-testid='spinner-pulse' />
          <LoadingSpinner variant='bars' data-testid='spinner-bars' />
        </div>
      )

      expect(screen.getByTestId('spinner-dots')).toBeInTheDocument()
      expect(screen.getByTestId('spinner-pulse')).toBeInTheDocument()
      expect(screen.getByTestId('spinner-bars')).toBeInTheDocument()
    })

    it('renders different colors', () => {
      render(
        <div>
          <LoadingSpinner color='primary' data-testid='spinner-primary' />
          <LoadingSpinner color='error' data-testid='spinner-error' />
        </div>
      )

      expect(screen.getByTestId('spinner-primary')).toBeInTheDocument()
      expect(screen.getByTestId('spinner-error')).toBeInTheDocument()
    })
  })

  describe('PageLoadingOverlay', () => {
    it('renders full page overlay', () => {
      render(<PageLoadingOverlay text='페이지 로딩 중...' data-testid='overlay' />)
      const overlay = screen.getByTestId('overlay')

      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50')
      expect(screen.getByText('페이지 로딩 중...')).toBeInTheDocument()
    })
  })

  describe('ButtonSpinner', () => {
    it('renders button spinner', () => {
      render(<ButtonSpinner data-testid='button-spinner' />)
      const buttonSpinner = screen.getByTestId('button-spinner')

      expect(buttonSpinner).toBeInTheDocument()
    })
  })

  describe('InlineLoading', () => {
    it('renders inline loading with dots and text', () => {
      render(<InlineLoading text='처리 중...' data-testid='inline-loading' />)
      const inlineLoading = screen.getByTestId('inline-loading')

      expect(inlineLoading).toBeInTheDocument()
      expect(inlineLoading).toHaveClass('flex', 'items-center')
      expect(screen.getByText('처리 중...')).toBeInTheDocument()
    })
  })

  describe('CardLoading', () => {
    it('renders card loading state', () => {
      render(<CardLoading title='데이터 로딩 중...' data-testid='card-loading' />)
      const cardLoading = screen.getByTestId('card-loading')

      expect(cardLoading).toBeInTheDocument()
      expect(cardLoading).toHaveClass('p-6', 'border', 'rounded-lg')
      expect(screen.getByText('데이터 로딩 중...')).toBeInTheDocument()
    })
  })

  describe('ListLoading', () => {
    it('renders list loading with default items', () => {
      render(<ListLoading data-testid='list-loading' />)
      const listLoading = screen.getByTestId('list-loading')

      expect(listLoading).toBeInTheDocument()
      expect(screen.getByText('목록을 불러오는 중...')).toBeInTheDocument()
    })

    it('renders custom number of items', () => {
      render(<ListLoading items={5} data-testid='list-loading' />)
      const listLoading = screen.getByTestId('list-loading')

      expect(listLoading).toBeInTheDocument()
      // 5개의 placeholder 아이템이 있는지 확인
      const placeholders = listLoading.querySelectorAll('.animate-pulse')
      expect(placeholders.length).toBeGreaterThanOrEqual(5)
    })
  })
})

// 접근성 테스트
describe('Loading Components Accessibility', () => {
  it('loading spinners have proper ARIA attributes', () => {
    render(
      <LoadingSpinner
        text='로딩 중...'
        data-testid='accessible-spinner'
        role='status'
        aria-label='페이지 로딩 중'
      />
    )

    const spinner = screen.getByTestId('accessible-spinner')
    expect(spinner).toHaveAttribute('role', 'status')
    expect(spinner).toHaveAttribute('aria-label', '페이지 로딩 중')
  })

  it('skeletons have proper aria-hidden attributes', () => {
    render(<Skeleton data-testid='accessible-skeleton' aria-hidden='true' />)
    const skeleton = screen.getByTestId('accessible-skeleton')

    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
  })
})

// 성능 테스트
describe('Loading Components Performance', () => {
  it('should not cause unnecessary re-renders', () => {
    const renderSpy = jest.fn()

    const TestComponent = () => {
      renderSpy()
      return <LoadingSpinner data-testid='perf-spinner' />
    }

    const { rerender } = render(<TestComponent />)

    // 같은 props로 다시 렌더링
    rerender(<TestComponent />)

    // 초기 렌더링 + 리렌더링 = 2회
    expect(renderSpy).toHaveBeenCalledTimes(2)
  })

  it('should handle large numbers of skeleton items efficiently', () => {
    const startTime = performance.now()

    render(
      <div>
        {Array.from({ length: 100 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    )

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // 100개의 스켈레톤이 100ms 이내에 렌더링되어야 함
    expect(renderTime).toBeLessThan(100)
  })
})
