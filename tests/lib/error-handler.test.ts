/**
 * @jest-environment jsdom
 */

import {
  createErrorReport,
  handleApiError,
  handleNetworkError,
  handleValidationError,
  globalErrorHandler,
  errorLogger,
  withRetry,
} from '@/lib/error-handler'

// Mock window 객체
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test',
  },
  writable: true,
})

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Jest Test Environment',
  },
  writable: true,
})

describe('Error Handler System', () => {
  beforeEach(() => {
    // 각 테스트 전에 에러 로그 초기화
    errorLogger.clearLogs()
    jest.clearAllMocks()
  })

  describe('createErrorReport', () => {
    it('네트워크 에러를 올바르게 분류해야 한다', () => {
      const error = new Error('Network request failed')
      const report = createErrorReport(error)

      expect(report.category).toBe('network')
      expect(report.severity).toBe('medium')
      expect(report.shouldNotifyUser).toBe(true)
      expect(report.retryable).toBe(true)
      expect(report.userFriendlyMessage).toBe('네트워크 연결을 확인해주세요.')
    })

    it('인증 에러를 올바르게 분류해야 한다', () => {
      const error = new Error('Authentication failed')
      const report = createErrorReport(error, { statusCode: 401 })

      expect(report.category).toBe('auth')
      expect(report.severity).toBe('high')
      expect(report.shouldNotifyUser).toBe(true)
      expect(report.retryable).toBe(false)
      expect(report.userFriendlyMessage).toBe('인증이 만료되었습니다. 다시 로그인해주세요.')
    })

    it('유효성 검증 에러를 올바르게 분류해야 한다', () => {
      const error = new Error('Validation failed')
      const report = createErrorReport(error, { statusCode: 400 })

      expect(report.category).toBe('validation')
      expect(report.severity).toBe('low')
      expect(report.shouldNotifyUser).toBe(true)
      expect(report.retryable).toBe(false)
      expect(report.userFriendlyMessage).toBe('입력한 정보를 다시 확인해주세요.')
    })

    it('API 서버 에러를 올바르게 분류해야 한다', () => {
      const error = new Error('Internal server error')
      const report = createErrorReport(error, { statusCode: 500 })

      expect(report.category).toBe('api')
      expect(report.severity).toBe('medium')
      expect(report.shouldNotifyUser).toBe(true)
      expect(report.retryable).toBe(true)
    })

    it('런타임 에러를 올바르게 분류해야 한다', () => {
      const error = new TypeError('Cannot read property of undefined')
      const report = createErrorReport(error)

      expect(report.category).toBe('runtime')
      expect(report.severity).toBe('high')
      expect(report.shouldNotifyUser).toBe(true)
      expect(report.retryable).toBe(false)
    })

    it('에러 상세 정보를 포함해야 한다', () => {
      const error = new Error('Test error')
      const context = {
        statusCode: 400,
        url: '/api/test',
        userId: 'user123',
        additionalContext: { testData: 'value' },
      }
      const report = createErrorReport(error, context)

      expect(report.details.code).toBe('Error')
      expect(report.details.message).toBe('Test error')
      expect(report.details.statusCode).toBe(400)
      expect(report.details.url).toBe('/api/test')
      expect(report.details.userId).toBe('user123')
      expect(report.details.context?.testData).toBe('value')
      expect(report.details.timestamp).toBeDefined()
      expect(report.id).toMatch(/^err_/)
    })
  })

  describe('globalErrorHandler', () => {
    it('에러를 처리하고 로깅해야 한다', () => {
      const error = new Error('Test error')
      const report = globalErrorHandler.handleError(error)

      expect(report).toBeDefined()
      expect(report.details.message).toBe('Test error')

      // 로그에 저장되었는지 확인
      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].id).toBe(report.id)
    })

    it('알림 콜백을 호출해야 한다', () => {
      const mockCallback = jest.fn()
      globalErrorHandler.onNotification(mockCallback)

      const error = new Error('Test error with notification')
      globalErrorHandler.handleError(error)

      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            message: 'Test error with notification',
          }),
        })
      )
    })

    it('알림 콜백 등록 해제가 작동해야 한다', () => {
      const mockCallback = jest.fn()
      const unsubscribe = globalErrorHandler.onNotification(mockCallback)

      unsubscribe()

      const error = new Error('Test error')
      globalErrorHandler.handleError(error)

      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('에러 헬퍼 함수들', () => {
    it('handleApiError가 올바르게 작동해야 한다', () => {
      const error = { status: 404, message: 'Not found' }
      const report = handleApiError(error, '/api/users', 'user123')

      expect(report.category).toBe('api')
      expect(report.details.statusCode).toBe(404)
      expect(report.details.url).toBe('/api/users')
      expect(report.details.userId).toBe('user123')
    })

    it('handleNetworkError가 올바르게 작동해야 한다', () => {
      const error = new Error('fetch failed')
      const report = handleNetworkError(error, '/api/data')

      expect(report.category).toBe('network')
      expect(report.details.url).toBe('/api/data')
      expect(report.details.context?.networkError).toBe(true)
    })

    it('handleValidationError가 올바르게 작동해야 한다', () => {
      const errors = { name: 'required', email: 'invalid' }
      const report = handleValidationError(errors, 'user-form')

      expect(report.category).toBe('validation')
      expect(report.details.statusCode).toBe(400)
      expect(report.details.context?.validationDetails).toEqual(errors)
      expect(report.details.context?.context).toBe('user-form')
    })
  })

  describe('withRetry', () => {
    it('성공하는 작업을 재시도 없이 실행해야 한다', async () => {
      const operation = jest.fn().mockResolvedValue('success')

      const result = await withRetry(operation, 3)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('실패하는 작업을 최대 재시도 횟수만큼 실행해야 한다', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Temporary failure'))

      await expect(withRetry(operation, 3)).rejects.toThrow('Temporary failure')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('재시도 불가능한 에러는 즉시 실패해야 한다', async () => {
      const authError = new Error('Authentication failed')
      const operation = jest.fn().mockRejectedValue(authError)

      await expect(withRetry(operation, 3)).rejects.toThrow('Authentication failed')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('중간에 성공하면 재시도를 중단해야 한다', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const result = await withRetry(operation, 3)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('errorLogger', () => {
    it('에러 로그를 저장해야 한다', () => {
      const error = new Error('Test error')
      const report = createErrorReport(error)

      errorLogger.log(report)

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0]).toEqual(report)
    })

    it('최대 로그 수를 초과하면 오래된 로그를 제거해야 한다', () => {
      // 101개의 로그 생성 (maxLogs = 100)
      for (let i = 0; i < 101; i++) {
        const error = new Error(`Test error ${i}`)
        const report = createErrorReport(error)
        errorLogger.log(report)
      }

      const logs = errorLogger.getLogs()
      expect(logs).toHaveLength(100)
      expect(logs[0].details.message).toBe('Test error 100') // 가장 최근 로그
    })

    it('로그를 초기화할 수 있어야 한다', () => {
      const error = new Error('Test error')
      const report = createErrorReport(error)
      errorLogger.log(report)

      expect(errorLogger.getLogs()).toHaveLength(1)

      errorLogger.clearLogs()

      expect(errorLogger.getLogs()).toHaveLength(0)
    })
  })
})
