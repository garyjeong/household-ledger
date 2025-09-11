// tests/components/SkeletonLoaders.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  TransactionListSkeleton,
  MonthlyDashboardSkeleton,
  StatisticsPageSkeleton,
  CategoryGridSkeleton,
  LoadingSpinner,
  PageLoadingOverlay,
} from '@/components/loading/SkeletonLoaders'
import { cn } from '@/lib/utils'

// Mock Card components from shadcn/ui
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={cn('card', className)}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={cn('card-header', className)}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={cn('card-content', className)}>{children}</div>,
}))

describe('SkeletonLoaders', () => {
  describe('Skeleton', () => {
    it('should render with default classes', () => {
      render(<Skeleton data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-gray-200')
    })

    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('custom-class')
    })

    it('should support dark mode classes', () => {
      render(<Skeleton className="dark:bg-gray-800" data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('dark:bg-gray-800')
    })

    it('should pass through additional props', () => {
      render(<Skeleton data-testid="skeleton" />)
      
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('role', 'presentation')
    })
  })

  describe('TransactionListSkeleton', () => {
    it('should render 5 transaction skeleton items', () => {
      render(<TransactionListSkeleton />)
      
      // 각 트랜잭션 아이템은 아바타(원형), 텍스트 2줄, 금액으로 구성
      const avatars = document.querySelectorAll('.rounded-full')
      const textLines = document.querySelectorAll('.h-4')
      
      expect(avatars).toHaveLength(5) // 5개의 아바타
      expect(textLines.length).toBeGreaterThanOrEqual(10) // 각 아이템당 최소 2줄 + 금액
    })

    it('should have proper structure for transaction items', () => {
      const { container } = render(<TransactionListSkeleton />)
      
      const transactionItems = container.querySelectorAll('.space-y-4 > div')
      expect(transactionItems).toHaveLength(5)
      
      // 각 아이템이 flex 레이아웃과 올바른 구조를 가지는지 확인
      transactionItems.forEach(item => {
        expect(item).toHaveClass('flex', 'items-center', 'space-x-4')
      })
    })

    it('should include avatar, content and amount skeletons', () => {
      const { container } = render(<TransactionListSkeleton />)
      
      // 아바타 스켈레톤 (원형, 12x12)
      const avatars = container.querySelectorAll('.h-12.w-12.rounded-full')
      expect(avatars).toHaveLength(5)
      
      // 금액 스켈레톤 (고정 너비)
      const amounts = container.querySelectorAll('.h-6.w-20')
      expect(amounts).toHaveLength(5)
    })
  })

  describe('MonthlyDashboardSkeleton', () => {
    it('should render dashboard structure with proper spacing', () => {
      const { container } = render(<MonthlyDashboardSkeleton />)
      
      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass('space-y-6', 'p-4')
    })

    it('should include title, summary cards, chart and transaction list', () => {
      const { container } = render(<MonthlyDashboardSkeleton />)
      
      // 타이틀 스켈레톤
      const title = container.querySelector('.h-8.w-48')
      expect(title).toBeInTheDocument()
      
      // 그리드 컨테이너 (요약 카드들)
      const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
      
      // 차트 영역
      const chart = container.querySelector('.h-48.w-full')
      expect(chart).toBeInTheDocument()
    })

    it('should have responsive grid layout for summary cards', () => {
      const { container } = render(<MonthlyDashboardSkeleton />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3', 'gap-4')
      
      // 3개의 요약 카드
      const summaryCards = grid?.children
      expect(summaryCards).toHaveLength(3)
    })

    it('should include section title and transaction list', () => {
      const { container } = render(<MonthlyDashboardSkeleton />)
      
      // 섹션 타이틀
      const sectionTitle = container.querySelector('.h-6.w-32')
      expect(sectionTitle).toBeInTheDocument()
      
      // TransactionListSkeleton이 포함되어야 함
      const transactionList = container.querySelector('.space-y-4')
      expect(transactionList).toBeInTheDocument()
    })
  })

  describe('StatisticsPageSkeleton', () => {
    it('should render statistics page structure', () => {
      const { container } = render(<StatisticsPageSkeleton />)
      
      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass('space-y-6', 'p-4')
    })

    it('should include page title and chart grid', () => {
      const { container } = render(<StatisticsPageSkeleton />)
      
      // 페이지 타이틀
      const pageTitle = container.querySelector('.h-8.w-64')
      expect(pageTitle).toBeInTheDocument()
      
      // 차트 그리드 (2열)
      const chartGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2')
      expect(chartGrid).toBeInTheDocument()
      expect(chartGrid).toHaveClass('gap-6')
      
      // 2개의 차트
      const charts = chartGrid?.children
      expect(charts).toHaveLength(2)
    })

    it('should include transaction list section', () => {
      const { container } = render(<StatisticsPageSkeleton />)
      
      // 트랜잭션 리스트 섹션의 타이틀
      const sectionTitle = container.querySelector('.h-6.w-48')
      expect(sectionTitle).toBeInTheDocument()
      
      // TransactionListSkeleton 포함
      const transactionList = container.querySelector('.space-y-4')
      expect(transactionList).toBeInTheDocument()
    })
  })

  describe('CategoryGridSkeleton', () => {
    it('should render category item structure', () => {
      const { container } = render(<CategoryGridSkeleton />)
      
      const item = container.firstChild
      expect(item).toHaveClass('flex', 'items-center', 'justify-between', 'p-3', 'border', 'rounded-md')
    })

    it('should include category icon, name and action buttons', () => {
      const { container } = render(<CategoryGridSkeleton />)
      
      // 카테고리 아이콘 (원형)
      const icon = container.querySelector('.h-6.w-6.rounded-full')
      expect(icon).toBeInTheDocument()
      
      // 카테고리 이름
      const name = container.querySelector('.h-4.w-24')
      expect(name).toBeInTheDocument()
      
      // 액션 버튼들 (2개의 8x8 버튼)
      const actionButtons = container.querySelectorAll('.h-8.w-8.rounded-md')
      expect(actionButtons).toHaveLength(2)
    })

    it('should have proper flex layout', () => {
      const { container } = render(<CategoryGridSkeleton />)
      
      // 왼쪽 섹션 (아이콘 + 이름)
      const leftSection = container.querySelector('.flex.items-center.space-x-3')
      expect(leftSection).toBeInTheDocument()
      
      // 오른쪽 섹션 (금액 + 액션버튼들)
      const rightSection = container.querySelector('.flex.items-center.space-x-2')
      expect(rightSection).toBeInTheDocument()
    })
  })

  // GroupCardSkeleton 컴포넌트가 제거됨

  describe('LoadingSpinner', () => {
    it('should render with default medium size', () => {
      const { container } = render(<LoadingSpinner data-testid="spinner" />)
      
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('flex', 'items-center', 'justify-center')
      
      const icon = container.querySelector('.h-6.w-6')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('animate-spin', 'text-primary')
    })

    it('should support different sizes', () => {
      const { container: smallContainer } = render(<LoadingSpinner size="sm" />)
      const { container: largeContainer } = render(<LoadingSpinner size="lg" />)
      
      const smallIcon = smallContainer.querySelector('.h-4.w-4')
      const largeIcon = largeContainer.querySelector('.h-8.w-8')
      
      expect(smallIcon).toBeInTheDocument()
      expect(largeIcon).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-spinner" data-testid="spinner" />)
      
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveClass('custom-spinner')
    })

    it('should pass through additional props', () => {
      render(<LoadingSpinner data-testid="spinner" role="status" />)
      
      const spinner = screen.getByTestId('spinner')
      expect(spinner).toHaveAttribute('role', 'status')
    })
  })

  describe('PageLoadingOverlay', () => {
    it('should not render when isLoading is false', () => {
      const { container } = render(<PageLoadingOverlay isLoading={false} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should render overlay when isLoading is true', () => {
      const { container } = render(<PageLoadingOverlay isLoading={true} />)
      
      const overlay = container.firstChild
      expect(overlay).toHaveClass(
        'fixed',
        'inset-0',
        'z-50',
        'flex',
        'items-center',
        'justify-center',
        'bg-black/50',
        'backdrop-blur-sm'
      )
    })

    it('should display spinner in overlay', () => {
      const { container } = render(<PageLoadingOverlay isLoading={true} />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('h-8', 'w-8') // large size
    })

    it('should display custom message when provided', () => {
      render(<PageLoadingOverlay isLoading={true} message="데이터를 불러오는 중..." />)
      
      expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument()
    })

    it('should not display message when not provided', () => {
      const { container } = render(<PageLoadingOverlay isLoading={true} />)
      
      const message = container.querySelector('p')
      expect(message).toBeNull()
    })

    it('should have proper overlay styling', () => {
      const { container } = render(<PageLoadingOverlay isLoading={true} message="Loading..." />)
      
      const contentBox = container.querySelector('.bg-white.rounded-lg.shadow-xl')
      expect(contentBox).toBeInTheDocument()
      expect(contentBox).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-4', 'p-6')
    })

    it('should handle overlay clicks properly', () => {
      const { container } = render(<PageLoadingOverlay isLoading={true} />)
      
      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('fixed', 'inset-0')
      
      // 오버레이는 클릭 이벤트를 막아야 함 (이벤트 핸들러 테스트는 별도 통합 테스트에서)
    })
  })

  describe('Accessibility', () => {
    it('should provide proper ARIA attributes for loaders', () => {
      render(<LoadingSpinner role="status" aria-label="로딩 중" />)
      
      const spinner = document.querySelector('[role="status"]')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveAttribute('aria-label', '로딩 중')
    })

    it('should support screen reader text for skeleton content', () => {
      render(<Skeleton aria-hidden="true" />)
      
      const skeleton = document.querySelector('[role="presentation"]')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Animation Performance', () => {
    it('should use CSS animations for skeleton pulse effect', () => {
      const { container } = render(<Skeleton />)
      
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('should use CSS animations for spinner rotation', () => {
      const { container } = render(<LoadingSpinner />)
      
      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('animate-spin')
    })
  })

  describe('Responsive Design', () => {
    it('should handle responsive classes in dashboard skeleton', () => {
      const { container } = render(<MonthlyDashboardSkeleton />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3')
    })

    it('should handle responsive classes in statistics skeleton', () => {
      const { container } = render(<StatisticsPageSkeleton />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2')
    })
  })
})
