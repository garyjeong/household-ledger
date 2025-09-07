import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DatabaseConnectionChecker } from '@/components/database/DatabaseConnectionChecker'
import { DatabaseErrorUI } from '@/components/database/DatabaseErrorUI'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

describe('DatabaseConnectionChecker', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('shows loading state initially', async () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => resolve(new Response('', { status: 200 })), 100)
      })
    )

    render(
      <DatabaseConnectionChecker>
        <div>App Content</div>
      </DatabaseConnectionChecker>
    )

    expect(screen.getByText('시스템 초기화 중...')).toBeInTheDocument()
    expect(screen.getByText('데이터베이스 연결을 확인하고 있습니다.')).toBeInTheDocument()
  })

  it('shows app content when database connection is successful', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 200 }))

    render(
      <DatabaseConnectionChecker>
        <div>App Content</div>
      </DatabaseConnectionChecker>
    )

    await waitFor(() => {
      expect(screen.getByText('App Content')).toBeInTheDocument()
    })
  })

  it('shows error UI when database connection fails', async () => {
    mockFetch.mockRejectedValue(new Error('Connection failed'))

    render(
      <DatabaseConnectionChecker>
        <div>App Content</div>
      </DatabaseConnectionChecker>
    )

    await waitFor(() => {
      expect(screen.getByText('데이터베이스 연결 실패')).toBeInTheDocument()
    })
  })

  it('shows error UI when health check returns non-200 status', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 503 }))

    render(
      <DatabaseConnectionChecker>
        <div>App Content</div>
      </DatabaseConnectionChecker>
    )

    await waitFor(() => {
      expect(screen.getByText('데이터베이스 연결 실패')).toBeInTheDocument()
    })
  })

  it('calls health API with correct parameters', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 200 }))

    render(
      <DatabaseConnectionChecker>
        <div>App Content</div>
      </DatabaseConnectionChecker>
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: expect.any(AbortSignal),
      })
    })
  })
})

describe('DatabaseErrorUI', () => {
  const defaultProps = {
    error: 'Connection timeout',
    retryCount: 1,
    onRetry: jest.fn(),
  }

  beforeEach(() => {
    defaultProps.onRetry.mockClear()
    jest.clearAllMocks()
  })

  it('displays error message and retry count', () => {
    render(<DatabaseErrorUI {...defaultProps} />)

    expect(screen.getByText('데이터베이스 연결 실패')).toBeInTheDocument()
    expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    expect(screen.getByText('재시도 횟수: 1회')).toBeInTheDocument()
  })

  it('shows troubleshooting steps', () => {
    render(<DatabaseErrorUI {...defaultProps} />)

    expect(screen.getByText('🔧 문제 해결 방법')).toBeInTheDocument()
    expect(screen.getByText('1. Docker 서비스 확인')).toBeInTheDocument()
    expect(screen.getByText('2. 환경 변수 설정')).toBeInTheDocument()
    expect(screen.getByText('3. 네트워크 연결')).toBeInTheDocument()
  })

  it('displays Docker commands', () => {
    render(<DatabaseErrorUI {...defaultProps} />)

    expect(screen.getByText('🐳 Docker 명령어')).toBeInTheDocument()
    expect(screen.getByText('docker ps -a')).toBeInTheDocument()
    expect(screen.getByText('docker-compose up -d database')).toBeInTheDocument()
    expect(screen.getByText('docker-compose up -d')).toBeInTheDocument()
    expect(screen.getByText('docker-compose logs database')).toBeInTheDocument()
  })

  it('shows database connection info', () => {
    render(<DatabaseErrorUI {...defaultProps} />)

    expect(screen.getByText('💡 예상 데이터베이스 설정')).toBeInTheDocument()
    expect(screen.getByText('localhost')).toBeInTheDocument()
    expect(screen.getByText('3307')).toBeInTheDocument()
    expect(screen.getByText('household_ledger')).toBeInTheDocument()
    expect(screen.getByText('user / root')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    render(<DatabaseErrorUI {...defaultProps} />)

    const retryButton = screen.getByText('다시 연결 시도')
    fireEvent.click(retryButton)

    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1)
  })

  it('copies Docker commands to clipboard', async () => {
    render(<DatabaseErrorUI {...defaultProps} />)

    const copyButtons = screen.getAllByRole('button', { name: /Copy/ })
    expect(copyButtons.length).toBeGreaterThan(0)

    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('docker ps -a')
    })
  })

  it('shows success state after copying command', async () => {
    render(<DatabaseErrorUI {...defaultProps} />)

    const copyButtons = screen.getAllByRole('button', { name: /Copy/ })
    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /Check/ })).toBeInTheDocument()
    })
  })

  it('handles clipboard copy errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    // Mock clipboard failure
    ;(navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'))

    render(<DatabaseErrorUI {...defaultProps} />)

    const copyButtons = screen.getAllByRole('button', { name: /Copy/ })
    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy command:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('shows default error message when error prop is undefined', () => {
    render(<DatabaseErrorUI {...{ ...defaultProps, error: undefined }} />)

    expect(screen.getByText('Unknown database connection error')).toBeInTheDocument()
  })

  it('does not show retry count when retryCount is 0', () => {
    render(<DatabaseErrorUI {...{ ...defaultProps, retryCount: 0 }} />)

    expect(screen.queryByText(/재시도 횟수:/)).not.toBeInTheDocument()
  })
})
