/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import {
  GET as getCategoriesHandler,
  POST as createCategoryHandler,
} from '@/app/api/categories/route'
import {
  PUT as updateCategoryHandler,
  DELETE as deleteCategoryHandler,
} from '@/app/api/categories/[id]/route'
import { createMockRequest, expectApiSuccess, expectApiError } from '../utils/test-helpers'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  verifyAccessToken: jest.fn(),
  findUserById: jest.fn(),
  verifyCookieToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
  verifyToken: jest.fn(),
}))

import {
  verifyAccessToken,
  findUserById,
  verifyCookieToken,
  extractTokenFromHeader,
  verifyToken,
} from '@/lib/auth'

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>
const mockFindUserById = findUserById as jest.MockedFunction<typeof findUserById>
const mockVerifyCookieToken = verifyCookieToken as jest.MockedFunction<typeof verifyCookieToken>
const mockExtractTokenFromHeader = extractTokenFromHeader as jest.MockedFunction<
  typeof extractTokenFromHeader
>
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>

const mockUser = {
  id: '1',
  email: 'test@example.com',
  nickname: '테스트유저',
  createdAt: new Date(),
}

const mockTokenPayload = {
  userId: mockUser.id,
  email: mockUser.email,
  nickname: mockUser.nickname,
}

describe('Categories API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
    mockFindUserById.mockResolvedValue(mockUser)
    mockVerifyCookieToken.mockReturnValue(mockTokenPayload)
    mockExtractTokenFromHeader.mockReturnValue('valid-token')
    mockVerifyToken.mockResolvedValue(mockTokenPayload)
  })

  describe('GET /api/categories', () => {
    it('should get categories successfully with valid auth', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/categories?groupId=1',
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await getCategoriesHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(Array.isArray(responseData.categories)).toBe(true)
    })

    it('should reject request without auth token', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/categories?groupId=1',
        cookies: {},
      }) as unknown as NextRequest

      const response = await getCategoriesHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should require groupId parameter', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/categories',
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await getCategoriesHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('그룹 ID')
    })

    it('should filter by type when specified', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: '/api/categories?groupId=1&type=EXPENSE',
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await getCategoriesHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })
  })

  describe('POST /api/categories', () => {
    const validCategoryData = {
      groupId: '1',
      name: '새로운 카테고리',
      color: '#FF0000',
      type: 'EXPENSE' as const,
    }

    it('should create category successfully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: validCategoryData,
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await createCategoryHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.category).toBeDefined()
      expect(responseData.category.name).toBe(validCategoryData.name)
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        groupId: '1',
        name: '카테고리',
        // missing type and color
      }

      const request = createMockRequest({
        method: 'POST',
        body: incompleteData,
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await createCategoryHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBeDefined()
    })

    it('should validate category name length', async () => {
      const invalidData = {
        ...validCategoryData,
        name: '', // empty name
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await createCategoryHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('이름')
    })

    it('should validate color format', async () => {
      const invalidData = {
        ...validCategoryData,
        color: 'invalid-color',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await createCategoryHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('색상')
    })

    it('should validate category type', async () => {
      const invalidData = {
        ...validCategoryData,
        type: 'INVALID_TYPE',
      }

      const request = createMockRequest({
        method: 'POST',
        body: invalidData,
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await createCategoryHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBeDefined()
    })

    it('should reject duplicate category names within group', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          ...validCategoryData,
          name: '식비', // 이미 존재하는 카테고리 이름
        },
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await createCategoryHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(409)
      expect(responseData.error).toContain('이미 존재')
    })
  })

  describe('PUT /api/categories/[id]', () => {
    const updateData = {
      name: '수정된 카테고리',
      color: '#00FF00',
    }

    it('should update category successfully', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await updateCategoryHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.category).toBeDefined()
    })

    it('should reject update without auth', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: {},
      }) as unknown as NextRequest

      const response = await updateCategoryHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should validate category ID format', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await updateCategoryHandler(request, { params: { id: 'invalid-id' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('ID')
    })

    it('should handle non-existing category', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: updateData,
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await updateCategoryHandler(request, { params: { id: '999' } })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('카테고리를 찾을 수 없습니다')
    })
  })

  describe('DELETE /api/categories/[id]', () => {
    it('should delete category successfully', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await deleteCategoryHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should reject delete without auth', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: {},
      }) as unknown as NextRequest

      const response = await deleteCategoryHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증')
    })

    it('should prevent deletion of categories with transactions', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      // 거래가 있는 카테고리 삭제 시도
      const response = await deleteCategoryHandler(request, { params: { id: '1' } })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('거래가 있는')
    })

    it('should handle non-existing category', async () => {
      const request = createMockRequest({
        method: 'DELETE',
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await deleteCategoryHandler(request, { params: { id: '999' } })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('카테고리를 찾을 수 없습니다')
    })
  })
})
