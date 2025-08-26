/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  GET as getRecurringRulesHandler,
  POST as createRecurringRuleHandler,
} from '@/app/api/recurring-rules/route'
import {
  GET as getRecurringRuleHandler,
  PUT as updateRecurringRuleHandler,
  DELETE as deleteRecurringRuleHandler,
} from '@/app/api/recurring-rules/[id]/route'
import {
  createMockRequest,
  expectApiSuccess,
  expectApiError,
  createMockToken,
} from '../utils/test-helpers'

// Mock 모듈들
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  verifyToken: jest.fn(),
  verifyResourceOwnership: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    recurringRule: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  },
}))

import { verifyToken, verifyResourceOwnership } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const mockVerifyResourceOwnership = verifyResourceOwnership as jest.MockedFunction<
  typeof verifyResourceOwnership
>

// Mock 데이터
const mockUser = {
  userId: '1',
  email: 'test@example.com',
  nickname: 'testuser',
}

const mockRecurringRule = {
  id: BigInt(1),
  ownerType: 'USER',
  ownerId: BigInt(1),
  startDate: new Date('2024-01-01'),
  frequency: 'MONTHLY',
  dayRule: 'D25',
  amount: BigInt(50000),
  accountId: BigInt(1),
  categoryId: BigInt(1),
  merchant: '테스트 상점',
  memo: '테스트 메모',
  isActive: true,
  account: {
    id: BigInt(1),
    name: '테스트 계좌',
    type: 'BANK',
  },
  category: {
    id: BigInt(1),
    name: '생활비',
    color: '#FF0000',
    type: 'EXPENSE',
  },
}

const mockAccount = {
  id: BigInt(1),
  ownerType: 'USER',
  ownerId: BigInt(1),
  name: '테스트 계좌',
  type: 'BANK',
}

const mockCategory = {
  id: BigInt(1),
  ownerType: 'USER',
  ownerId: BigInt(1),
  name: '생활비',
  color: '#FF0000',
  type: 'EXPENSE',
}

describe('/api/recurring-rules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/recurring-rules', () => {
    it('인증되지 않은 요청을 거부해야 한다', async () => {
      const request = createMockRequest('GET', '/api/recurring-rules')

      const response = await getRecurringRulesHandler(request)

      expectApiError(response, 401, 'AUTH_REQUIRED')
    })

    it('고정 지출 목록을 성공적으로 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.recurringRule.findMany as jest.Mock).mockResolvedValue([mockRecurringRule])
      ;(prisma.recurringRule.count as jest.Mock).mockResolvedValue(1)

      const request = createMockRequest('GET', '/api/recurring-rules', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getRecurringRulesHandler(request)

      expectApiSuccess(response, 200)
      const data = await response.json()
      expect(data.recurringRules).toHaveLength(1)
      expect(data.pagination.totalCount).toBe(1)
    })

    it('잘못된 쿼리 파라미터를 거부해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)

      const request = createMockRequest('GET', '/api/recurring-rules?page=invalid', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getRecurringRulesHandler(request)

      expectApiError(response, 400, 'VALIDATION_ERROR')
    })
  })

  describe('POST /api/recurring-rules', () => {
    const validCreateData = {
      ownerType: 'USER',
      ownerId: '1',
      startDate: '2024-01-01',
      frequency: 'MONTHLY',
      dayRule: 'D25',
      amount: 50000,
      accountId: '1',
      categoryId: '1',
      merchant: '테스트 상점',
      memo: '테스트 메모',
      isActive: true,
    }

    it('인증되지 않은 요청을 거부해야 한다', async () => {
      const request = createMockRequest('POST', '/api/recurring-rules', validCreateData)

      const response = await createRecurringRuleHandler(request)

      expectApiError(response, 401, 'AUTH_REQUIRED')
    })

    it('고정 지출을 성공적으로 생성해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount)
      ;(prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory)
      ;(prisma.recurringRule.create as jest.Mock).mockResolvedValue(mockRecurringRule)

      const request = createMockRequest('POST', '/api/recurring-rules', validCreateData, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await createRecurringRuleHandler(request)

      expectApiSuccess(response, 201)
      const data = await response.json()
      expect(data.recurringRule.id).toBe('1')
      expect(data.message).toContain('성공적으로 추가')
    })

    it('잘못된 입력 데이터를 거부해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)

      const invalidData = {
        ...validCreateData,
        amount: -1000, // 음수 금액
      }

      const request = createMockRequest('POST', '/api/recurring-rules', invalidData, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await createRecurringRuleHandler(request)

      expectApiError(response, 400, 'VALIDATION_ERROR')
    })

    it('존재하지 않는 계좌를 참조하면 실패해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('POST', '/api/recurring-rules', validCreateData, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await createRecurringRuleHandler(request)

      expectApiError(response, 404, 'ACCOUNT_NOT_FOUND')
    })

    it('접근 권한이 없는 계좌를 참조하면 실패해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.account.findUnique as jest.Mock).mockResolvedValue({
        ...mockAccount,
        ownerType: 'GROUP',
        ownerId: BigInt(999), // 다른 소유자
      })

      const request = createMockRequest('POST', '/api/recurring-rules', validCreateData, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await createRecurringRuleHandler(request)

      expectApiError(response, 403, 'ACCOUNT_ACCESS_DENIED')
    })
  })
})

describe('/api/recurring-rules/[id]', () => {
  const routeParams = { params: { id: '1' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/recurring-rules/[id]', () => {
    it('인증되지 않은 요청을 거부해야 한다', async () => {
      const request = createMockRequest('GET', '/api/recurring-rules/1')

      const response = await getRecurringRuleHandler(request, routeParams)

      expectApiError(response, 401, 'AUTH_REQUIRED')
    })

    it('고정 지출을 성공적으로 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.recurringRule.findUnique as jest.Mock).mockResolvedValue(mockRecurringRule)

      const request = createMockRequest('GET', '/api/recurring-rules/1', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getRecurringRuleHandler(request, routeParams)

      expectApiSuccess(response, 200)
      const data = await response.json()
      expect(data.recurringRule.id).toBe('1')
    })

    it('존재하지 않는 고정 지출 조회 시 404를 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      ;(prisma.recurringRule.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('GET', '/api/recurring-rules/999', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getRecurringRuleHandler(request, { params: { id: '999' } })

      expectApiError(response, 404, 'NOT_FOUND')
    })

    it('잘못된 ID 형식을 거부해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)

      const request = createMockRequest('GET', '/api/recurring-rules/invalid', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await getRecurringRuleHandler(request, { params: { id: 'invalid' } })

      expectApiError(response, 400, 'INVALID_ID')
    })
  })

  describe('PUT /api/recurring-rules/[id]', () => {
    const updateData = {
      amount: 60000,
      memo: '수정된 메모',
    }

    it('인증되지 않은 요청을 거부해야 한다', async () => {
      const request = createMockRequest('PUT', '/api/recurring-rules/1', updateData)

      const response = await updateRecurringRuleHandler(request, routeParams)

      expectApiError(response, 401, 'AUTH_REQUIRED')
    })

    it('고정 지출을 성공적으로 수정해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.recurringRule.findUnique as jest.Mock).mockResolvedValue(mockRecurringRule)
      ;(prisma.recurringRule.update as jest.Mock).mockResolvedValue({
        ...mockRecurringRule,
        amount: BigInt(60000),
        memo: '수정된 메모',
      })

      const request = createMockRequest('PUT', '/api/recurring-rules/1', updateData, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await updateRecurringRuleHandler(request, routeParams)

      expectApiSuccess(response, 200)
      const data = await response.json()
      expect(data.recurringRule.amount).toBe(60000)
      expect(data.message).toContain('성공적으로 수정')
    })

    it('존재하지 않는 고정 지출 수정 시 404를 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      ;(prisma.recurringRule.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('PUT', '/api/recurring-rules/999', updateData, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await updateRecurringRuleHandler(request, { params: { id: '999' } })

      expectApiError(response, 404, 'NOT_FOUND')
    })
  })

  describe('DELETE /api/recurring-rules/[id]', () => {
    it('인증되지 않은 요청을 거부해야 한다', async () => {
      const request = createMockRequest('DELETE', '/api/recurring-rules/1')

      const response = await deleteRecurringRuleHandler(request, routeParams)

      expectApiError(response, 401, 'AUTH_REQUIRED')
    })

    it('고정 지출을 성공적으로 삭제해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      mockVerifyResourceOwnership.mockResolvedValue({ isValid: true })
      ;(prisma.recurringRule.findUnique as jest.Mock).mockResolvedValue(mockRecurringRule)
      ;(prisma.recurringRule.delete as jest.Mock).mockResolvedValue(mockRecurringRule)

      const request = createMockRequest('DELETE', '/api/recurring-rules/1', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await deleteRecurringRuleHandler(request, routeParams)

      expectApiSuccess(response, 200)
      const data = await response.json()
      expect(data.message).toContain('성공적으로 삭제')
    })

    it('존재하지 않는 고정 지출 삭제 시 404를 반환해야 한다', async () => {
      mockVerifyToken.mockResolvedValue(mockUser)
      ;(prisma.recurringRule.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('DELETE', '/api/recurring-rules/999', undefined, {
        cookies: { accessToken: 'valid-token' },
      })

      const response = await deleteRecurringRuleHandler(request, { params: { id: '999' } })

      expectApiError(response, 404, 'NOT_FOUND')
    })
  })
})
