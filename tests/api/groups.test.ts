/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getGroupsHandler, POST as createGroupHandler } from '@/app/api/groups/route'
import { POST as inviteHandler } from '@/app/api/groups/[groupId]/invite/route'
import { POST as joinHandler } from '@/app/api/groups/join/route'
import { POST as leaveHandler } from '@/app/api/groups/[groupId]/leave/route'
import { createMockRequest, mockUsers, mockGroups } from '../utils/test-helpers'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  verifyAccessToken: jest.fn(),
  findGroupsByUserId: jest.fn(),
  createGroup: jest.fn(),
  findGroupById: jest.fn(),
  generateInviteCode: jest.fn(),
  validateInviteCode: jest.fn(),
  joinGroup: jest.fn(),
  leaveGroup: jest.fn(),
}))

import {
  verifyAccessToken,
  findGroupsByUserId,
  createGroup,
  findGroupById,
  generateInviteCode,
  validateInviteCode,
  joinGroup,
  leaveGroup,
} from '@/lib/auth'

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>
const mockFindGroupsByUserId = findGroupsByUserId as jest.MockedFunction<typeof findGroupsByUserId>
const mockCreateGroup = createGroup as jest.MockedFunction<typeof createGroup>
const mockFindGroupById = findGroupById as jest.MockedFunction<typeof findGroupById>
const mockGenerateInviteCode = generateInviteCode as jest.MockedFunction<typeof generateInviteCode>
const mockValidateInviteCode = validateInviteCode as jest.MockedFunction<typeof validateInviteCode>
const mockJoinGroup = joinGroup as jest.MockedFunction<typeof joinGroup>
const mockLeaveGroup = leaveGroup as jest.MockedFunction<typeof leaveGroup>

describe('Groups API Routes', () => {
  const mockTokenPayload = {
    userId: '1',
    email: 'test@example.com',
    nickname: '테스트유저',
  }

  const mockGroup = {
    id: '1',
    name: '테스트 그룹',
    ownerId: '1',
    createdAt: new Date(),
    memberCount: 2,
    members: [
      {
        groupId: '1',
        userId: '1',
        role: 'OWNER' as const,
        joinedAt: new Date(),
        user: mockUsers[0],
      },
      {
        groupId: '1',
        userId: '2',
        role: 'MEMBER' as const,
        joinedAt: new Date(),
        user: mockUsers[1],
      },
    ],
    owner: mockUsers[0],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/groups', () => {
    it('should return user groups successfully', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockFindGroupsByUserId.mockResolvedValue([mockGroup])

      const request = createMockRequest({
        method: 'GET',
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await getGroupsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.groups).toHaveLength(1)
      expect(responseData.groups[0].id).toBe(mockGroup.id)
      expect(mockFindGroupsByUserId).toHaveBeenCalledWith(mockTokenPayload.userId)
    })

    it('should reject request without token', async () => {
      const request = createMockRequest({
        method: 'GET',
        cookies: {},
      }) as NextRequest

      const response = await getGroupsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증이 필요')
    })

    it('should reject request with invalid token', async () => {
      mockVerifyAccessToken.mockReturnValue(null)

      const request = createMockRequest({
        method: 'GET',
        cookies: { accessToken: 'invalid-token' },
      }) as NextRequest

      const response = await getGroupsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('유효하지 않은 토큰')
    })

    it('should return empty array when user has no groups', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockFindGroupsByUserId.mockResolvedValue([])

      const request = createMockRequest({
        method: 'GET',
        cookies: { accessToken: 'valid-token' },
      }) as unknown as NextRequest

      const response = await getGroupsHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.groups).toHaveLength(0)
    })
  })

  describe('POST /api/groups', () => {
    const validGroupData = {
      name: '새로운 그룹',
    }

    it('should create group successfully', async () => {
      const newGroup = {
        id: '3',
        name: validGroupData.name,
        ownerId: mockTokenPayload.userId,
        createdAt: new Date(),
        memberCount: 1,
      }

      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockCreateGroup.mockResolvedValue(newGroup)

      const request = createMockRequest({
        method: 'POST',
        body: validGroupData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createGroupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.group.name).toBe(validGroupData.name)
      expect(responseData.group.ownerId).toBe(mockTokenPayload.userId)
      expect(mockCreateGroup).toHaveBeenCalledWith({
        name: validGroupData.name,
        ownerId: mockTokenPayload.userId,
      })
    })

    it('should validate group name', async () => {
      const invalidGroupData = {
        name: '', // Empty name
      }

      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)

      const request = createMockRequest({
        method: 'POST',
        body: invalidGroupData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createGroupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('그룹 이름')
    })

    it('should validate group name length', async () => {
      const longNameData = {
        name: 'a'.repeat(51), // Too long
      }

      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)

      const request = createMockRequest({
        method: 'POST',
        body: longNameData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createGroupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('50자까지')
    })

    it('should trim group name', async () => {
      const spacedNameData = {
        name: '  트림 테스트  ',
      }

      const newGroup = {
        id: '3',
        name: '트림 테스트',
        ownerId: mockTokenPayload.userId,
        createdAt: new Date(),
        memberCount: 1,
      }

      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockCreateGroup.mockResolvedValue(newGroup)

      const request = createMockRequest({
        method: 'POST',
        body: spacedNameData,
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await createGroupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(mockCreateGroup).toHaveBeenCalledWith({
        name: '트림 테스트',
        ownerId: mockTokenPayload.userId,
      })
    })

    it('should reject request without authentication', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: validGroupData,
        cookies: {},
      }) as NextRequest

      const response = await createGroupHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증이 필요')
    })
  })

  describe('POST /api/groups/[groupId]/invite', () => {
    const mockInviteResponse = {
      inviteCode: 'ABC12345',
      inviteUrl: 'http://localhost:3000/groups/join?code=ABC12345',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }

    it('should generate invite successfully for group owner', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockFindGroupById.mockResolvedValue(mockGroup)
      mockGenerateInviteCode.mockResolvedValue(mockInviteResponse)

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await inviteHandler(request, { params: Promise.resolve({ groupId: '1' }) })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.inviteCode).toBe(mockInviteResponse.inviteCode)
      expect(responseData.inviteUrl).toBe(mockInviteResponse.inviteUrl)
      expect(mockGenerateInviteCode).toHaveBeenCalledWith('1', mockTokenPayload.userId)
    })

    it('should generate invite successfully for group admin', async () => {
      const adminGroup = {
        ...mockGroup,
        members: [
          ...mockGroup.members,
          {
            groupId: '1',
            userId: '3',
            role: 'ADMIN' as const,
            joinedAt: new Date(),
            user: mockUsers[2],
          },
        ],
      }

      const adminTokenPayload = {
        userId: '3',
        email: 'admin@example.com',
        nickname: '관리자',
      }

      mockVerifyAccessToken.mockReturnValue(adminTokenPayload)
      mockFindGroupById.mockResolvedValue(adminGroup)
      mockGenerateInviteCode.mockResolvedValue(mockInviteResponse)

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await inviteHandler(request, { params: Promise.resolve({ groupId: '1' }) })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should reject regular member trying to invite', async () => {
      const memberTokenPayload = {
        userId: '2',
        email: 'member@example.com',
        nickname: '멤버',
      }

      mockVerifyAccessToken.mockReturnValue(memberTokenPayload)
      mockFindGroupById.mockResolvedValue(mockGroup)

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await inviteHandler(request, { params: Promise.resolve({ groupId: '1' }) })
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.error).toContain('초대 권한')
    })

    it('should reject non-existing group', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockFindGroupById.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await inviteHandler(request, { params: { groupId: '999' } })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('그룹을 찾을 수 없거나')
    })

    it('should reject non-member trying to invite', async () => {
      const nonMemberTokenPayload = {
        userId: '999',
        email: 'outsider@example.com',
        nickname: '외부인',
      }

      mockVerifyAccessToken.mockReturnValue(nonMemberTokenPayload)
      mockFindGroupById.mockResolvedValue(null) // User is not a member

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await inviteHandler(request, { params: Promise.resolve({ groupId: '1' }) })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('그룹을 찾을 수 없거나')
    })
  })

  describe('POST /api/groups/join', () => {
    const validInviteCode = 'ABC12345'

    it('should join group successfully with valid invite code', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockValidateInviteCode.mockResolvedValue({ groupId: '2', isValid: true })
      mockJoinGroup.mockResolvedValue(true)
      mockFindGroupById.mockResolvedValue(mockGroup)

      const request = createMockRequest({
        method: 'POST',
        body: { inviteCode: validInviteCode },
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await joinHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.group).toBeDefined()
      expect(responseData.message).toContain('성공적으로 참여')
      expect(mockJoinGroup).toHaveBeenCalledWith('2', mockTokenPayload.userId)
    })

    it('should reject invalid invite code', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockValidateInviteCode.mockResolvedValue({ groupId: '', isValid: false })

      const request = createMockRequest({
        method: 'POST',
        body: { inviteCode: 'INVALID123' },
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await joinHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('유효하지 않거나 만료된')
    })

    it('should reject empty invite code', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)

      const request = createMockRequest({
        method: 'POST',
        body: { inviteCode: '' },
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await joinHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('초대 코드를 입력')
    })

    it('should handle already joined group', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockValidateInviteCode.mockResolvedValue({ groupId: '2', isValid: true })
      mockJoinGroup.mockResolvedValue(false) // Already joined

      const request = createMockRequest({
        method: 'POST',
        body: { inviteCode: validInviteCode },
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await joinHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('이미 그룹에 참여했거나')
    })

    it('should reject request without authentication', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { inviteCode: validInviteCode },
        cookies: {},
      }) as NextRequest

      const response = await joinHandler(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증이 필요')
    })
  })

  describe('POST /api/groups/[groupId]/leave', () => {
    it('should leave group successfully', async () => {
      const memberTokenPayload = {
        userId: '2',
        email: 'member@example.com',
        nickname: '멤버',
      }

      mockVerifyAccessToken.mockReturnValue(memberTokenPayload)
      mockFindGroupById.mockResolvedValue(mockGroup)
      mockLeaveGroup.mockResolvedValue(true)

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await leaveHandler(request, { params: Promise.resolve({ groupId: '1' }) })
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toContain('성공적으로 탈퇴')
      expect(mockLeaveGroup).toHaveBeenCalledWith('1', memberTokenPayload.userId)
    })

    it('should prevent owner from leaving', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload) // Owner
      mockFindGroupById.mockResolvedValue(mockGroup)

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await leaveHandler(request, { params: Promise.resolve({ groupId: '1' }) })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('그룹 소유자는 탈퇴할 수 없습니다')
      expect(mockLeaveGroup).not.toHaveBeenCalled()
    })

    it('should reject non-existing group', async () => {
      mockVerifyAccessToken.mockReturnValue(mockTokenPayload)
      mockFindGroupById.mockResolvedValue(null)

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await leaveHandler(request, { params: Promise.resolve({ groupId: '999' }) })
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toContain('그룹을 찾을 수 없거나')
    })

    it('should handle leave group failure', async () => {
      const memberTokenPayload = {
        userId: '2',
        email: 'member@example.com',
        nickname: '멤버',
      }

      mockVerifyAccessToken.mockReturnValue(memberTokenPayload)
      mockFindGroupById.mockResolvedValue(mockGroup)
      mockLeaveGroup.mockResolvedValue(false) // Leave failed

      const request = createMockRequest({
        method: 'POST',
        cookies: { accessToken: 'valid-token' },
      }) as NextRequest

      const response = await leaveHandler(request, { params: Promise.resolve({ groupId: '1' }) })
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('그룹 탈퇴에 실패')
    })

    it('should reject request without authentication', async () => {
      const request = createMockRequest({
        method: 'POST',
        cookies: {},
      }) as NextRequest

      const response = await leaveHandler(request, { params: Promise.resolve({ groupId: '1' }) })
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toContain('인증이 필요')
    })
  })
})
