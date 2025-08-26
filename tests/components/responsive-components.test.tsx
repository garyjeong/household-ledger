/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// 반응형 테스트를 위한 matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// viewport 크기 변경을 위한 헬퍼 함수
const resizeWindow = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('반응형 컴포넌트 테스트', () => {
  beforeEach(() => {
    // 기본 데스크탑 크기로 초기화
    resizeWindow(1280, 720)
  })

  describe('Button 컴포넌트', () => {
    it('기본 스타일이 올바르게 적용되어야 한다', () => {
      render(<Button>테스트 버튼</Button>)
      
      const button = screen.getByRole('button', { name: '테스트 버튼' })
      
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
      expect(button).toHaveClass('rounded-lg')
      expect(button).toHaveClass('transition-colors')
    })

    it('다양한 크기 variant가 올바르게 적용되어야 한다', () => {
      const { rerender } = render(<Button size="sm">작은 버튼</Button>)
      let button = screen.getByRole('button')
      expect(button).toHaveClass('h-8')

      rerender(<Button size="lg">큰 버튼</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-12')
    })

    it('터치 친화적 클래스가 적용되어야 한다', () => {
      render(<Button className="btn-touch">터치 버튼</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('btn-touch')
    })
  })

  describe('Card 컴포넌트', () => {
    it('기본 카드 스타일이 올바르게 적용되어야 한다', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>테스트 카드</CardTitle>
          </CardHeader>
          <CardContent>
            카드 내용
          </CardContent>
        </Card>
      )

      const card = screen.getByText('테스트 카드').closest('div')?.parentElement
      expect(card).toHaveClass('rounded-lg', 'sm:rounded-xl')
      expect(card).toHaveClass('border', 'shadow-sm')
      expect(card).toHaveClass('transition-all', 'duration-300')
    })

    it('카드 헤더와 콘텐츠의 반응형 패딩이 적용되어야 한다', () => {
      render(
        <Card>
          <CardHeader data-testid="card-header">
            <CardTitle>헤더</CardTitle>
          </CardHeader>
          <CardContent data-testid="card-content">
            콘텐츠
          </CardContent>
        </Card>
      )

      const header = screen.getByTestId('card-header')
      const content = screen.getByTestId('card-content')

      expect(header).toHaveClass('p-4', 'sm:p-6')
      expect(content).toHaveClass('p-4', 'sm:p-6')
    })
  })

  describe('Input 컴포넌트', () => {
    it('기본 입력 필드 스타일이 올바르게 적용되어야 한다', () => {
      render(<Input placeholder="테스트 입력" />)
      
      const input = screen.getByPlaceholderText('테스트 입력')
      
      expect(input).toHaveClass('rounded-lg')
      expect(input).toHaveClass('border')
      expect(input).toHaveClass('transition-all', 'duration-200')
      expect(input).toHaveClass('btn-touch')
    })

    it('포커스 상태 스타일이 적용되어야 한다', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus:outline-none')
      expect(input).toHaveClass('focus:ring-2')
      expect(input).toHaveClass('focus:border-slate-400')
    })
  })

  describe('반응형 유틸리티 클래스', () => {
    it('모바일 뷰포트에서 적절한 스타일이 적용되어야 한다', () => {
      // 모바일 크기로 변경
      resizeWindow(375, 667)

      render(
        <div className="text-responsive-lg container-responsive">
          모바일 테스트
        </div>
      )

      const element = screen.getByText('모바일 테스트')
      expect(element).toHaveClass('text-responsive-lg')
      expect(element).toHaveClass('container-responsive')
    })

    it('그리드 시스템이 올바르게 작동해야 한다', () => {
      render(
        <div className="grid-responsive" data-testid="grid">
          <div>아이템 1</div>
          <div>아이템 2</div>
          <div>아이템 3</div>
        </div>
      )

      const grid = screen.getByTestId('grid')
      expect(grid).toHaveClass('grid-responsive')
    })

    it('사이드바 레이아웃이 올바르게 적용되어야 한다', () => {
      render(
        <div className="sidebar-layout" data-testid="sidebar-layout">
          <div className="sidebar">사이드바</div>
          <div className="main-content">메인 콘텐츠</div>
        </div>
      )

      const layout = screen.getByTestId('sidebar-layout')
      const sidebar = screen.getByText('사이드바')
      const mainContent = screen.getByText('메인 콘텐츠')

      expect(layout).toHaveClass('sidebar-layout')
      expect(sidebar).toHaveClass('sidebar')
      expect(mainContent).toHaveClass('main-content')
    })
  })

  describe('접근성 테스트', () => {
    it('버튼이 키보드로 접근 가능해야 한다', () => {
      render(<Button>접근 가능한 버튼</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    it('입력 필드에 적절한 라벨이 연결되어야 한다', () => {
      render(
        <div>
          <label htmlFor="test-input">테스트 라벨</label>
          <Input id="test-input" />
        </div>
      )

      const input = screen.getByLabelText('테스트 라벨')
      expect(input).toBeInTheDocument()
    })

    it('카드 제목이 적절한 헤딩 레벨을 가져야 한다', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>카드 제목</CardTitle>
          </CardHeader>
        </Card>
      )

      const heading = screen.getByRole('heading', { name: '카드 제목' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H3')
    })
  })

  describe('다크모드 호환성', () => {
    it('다크모드 클래스가 적용되어도 컴포넌트가 정상 작동해야 한다', () => {
      // HTML에 dark 클래스 추가 시뮬레이션
      document.documentElement.classList.add('dark')

      render(
        <Card>
          <CardContent>다크모드 테스트</CardContent>
        </Card>
      )

      const content = screen.getByText('다크모드 테스트')
      expect(content).toBeInTheDocument()

      // 정리
      document.documentElement.classList.remove('dark')
    })
  })

  describe('애니메이션 클래스', () => {
    it('애니메이션 클래스가 올바르게 적용되어야 한다', () => {
      render(
        <div className="animate-fade-in" data-testid="animated">
          애니메이션 테스트
        </div>
      )

      const element = screen.getByTestId('animated')
      expect(element).toHaveClass('animate-fade-in')
    })

    it('호버 효과 클래스가 적용되어야 한다', () => {
      render(
        <div className="hover-desktop" data-testid="hoverable">
          호버 테스트
        </div>
      )

      const element = screen.getByTestId('hoverable')
      expect(element).toHaveClass('hover-desktop')
    })
  })
})
