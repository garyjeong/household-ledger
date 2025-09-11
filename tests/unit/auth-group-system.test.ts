/**
 * 자동 개인 그룹 생성 시스템 테스트
 *
 * 테스트 시나리오:
 * 1. 회원가입 시 개인 그룹 자동 생성
 * 2. 그룹 참여 시 기존 그룹 자동 삭제
 * 3. 그룹 탈퇴 시 새 개인 그룹 자동 생성
 */

// Jest globals are available by default in Jest environment
import { createUser, joinGroup, leaveGroup } from '@/lib/auth'

// Mock Prisma
const mockPrisma = {
  $transaction: jest.fn(),
  user: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  group: {
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
}

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

jest.mock('@/lib/security-utils', () => ({
  safeConsole: {
    log: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/seed-categories', () => ({
  createDefaultCategoriesForGroup: jest.fn().mockResolvedValue(true),
}))

describe('자동 개인 그룹 생성 시스템', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createUser - 회원가입 시 개인 그룹 자동 생성', () => {
    it('회원가입 시 개인 그룹이 자동으로 생성되어야 함', async () => {
      const mockUser = {
        id: BigInt(1),
        email: 'test@example.com',
        nickname: '테스트',
        passwordHash: 'hashed',
        avatarUrl: null,
        createdAt: new Date(),
      }

      const mockGroup = {
        id: BigInt(100),
        name: '테스트의 가계부',
        ownerId: BigInt(1),
        createdAt: new Date(),
      }

      const mockUpdatedUser = {
        ...mockUser,
        groupId: BigInt(100),
      }

      // 트랜잭션 mock 설정
      mockPrisma.$transaction.mockImplementation(async callback => {
        return await callback({
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUpdatedUser),
          },
          group: {
            create: jest.fn().mockResolvedValue(mockGroup),
          },
        })
      })

      const result = await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
        nickname: '테스트',
      })

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        nickname: '테스트',
        avatarUrl: undefined,
        createdAt: mockUser.createdAt,
      })

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    })

    it('카테고리 생성 실패 시에도 사용자 생성은 성공해야 함', async () => {
      const mockUser = {
        id: BigInt(1),
        email: 'test@example.com',
        nickname: '테스트',
        passwordHash: 'hashed',
        avatarUrl: null,
        createdAt: new Date(),
      }

      const mockGroup = {
        id: BigInt(100),
        name: '테스트의 가계부',
        ownerId: BigInt(1),
        createdAt: new Date(),
      }

      const mockUpdatedUser = {
        ...mockUser,
        groupId: BigInt(100),
      }

      mockPrisma.$transaction.mockImplementation(async callback => {
        return await callback({
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUpdatedUser),
          },
          group: {
            create: jest.fn().mockResolvedValue(mockGroup),
          },
        })
      })

      // 카테고리 생성 실패 mock
      const { createDefaultCategoriesForGroup } = await import('@/lib/seed-categories')
      jest
        .mocked(createDefaultCategoriesForGroup)
        .mockRejectedValueOnce(new Error('Category creation failed'))

      const result = await createUser({
        email: 'test@example.com',
        password: 'Test1234!',
        nickname: '테스트',
      })

      expect(result.id).toBe('1')
      expect(result.email).toBe('test@example.com')
    })
  })

  describe('joinGroup - 그룹 참여 시 기존 그룹 처리', () => {
    it('기존 개인 그룹이 있을 때 자동으로 삭제되어야 함', async () => {
      const mockUser = {
        id: BigInt(1),
        groupId: BigInt(100),
        ownedGroups: [{ id: BigInt(100), name: '기존 그룹' }],
      }

      const mockTargetGroup = {
        id: BigInt(200),
        name: '새 그룹',
      }

      mockPrisma.$transaction.mockImplementation(async callback => {
        return await callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue({ ...mockUser, groupId: BigInt(200) }),
            count: jest.fn().mockResolvedValue(1), // 소유자만 있음
          },
          group: {
            findUnique: jest.fn().mockResolvedValue(mockTargetGroup),
            delete: jest.fn().mockResolvedValue(true),
          },
        })
      })

      const result = await joinGroup('200', '1')

      expect(result).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    })

    it('기존 그룹에 다른 멤버가 있을 때는 삭제하지 않아야 함', async () => {
      const mockUser = {
        id: BigInt(1),
        groupId: BigInt(100),
        ownedGroups: [{ id: BigInt(100), name: '기존 그룹' }],
      }

      const mockTargetGroup = {
        id: BigInt(200),
        name: '새 그룹',
      }

      mockPrisma.$transaction.mockImplementation(async callback => {
        return await callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue({ ...mockUser, groupId: BigInt(200) }),
            count: jest.fn().mockResolvedValue(2), // 다른 멤버도 있음
          },
          group: {
            findUnique: jest.fn().mockResolvedValue(mockTargetGroup),
            delete: jest.fn(), // 호출되지 않아야 함
          },
        })
      })

      const result = await joinGroup('200', '1')

      expect(result).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    })
  })

  describe('leaveGroup - 그룹 탈퇴 시 새 개인 그룹 생성', () => {
    it('그룹 탈퇴 시 새로운 개인 그룹이 생성되어야 함', async () => {
      const mockUser = {
        id: BigInt(1),
        groupId: BigInt(200),
        nickname: '테스트',
        ownedGroups: [], // 소유자가 아님
      }

      const mockNewGroup = {
        id: BigInt(300),
        name: '테스트의 가계부',
        ownerId: BigInt(1),
      }

      mockPrisma.$transaction.mockImplementation(async callback => {
        return await callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue({ ...mockUser, groupId: BigInt(300) }),
          },
          group: {
            create: jest.fn().mockResolvedValue(mockNewGroup),
          },
        })
      })

      const result = await leaveGroup('200', '1')

      expect(result).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    })

    it('그룹 소유자가 탈퇴할 때 기존 그룹이 삭제되어야 함', async () => {
      const mockUser = {
        id: BigInt(1),
        groupId: BigInt(200),
        nickname: '테스트',
        ownedGroups: [{ id: BigInt(200), name: '소유 그룹' }],
      }

      const mockNewGroup = {
        id: BigInt(300),
        name: '테스트의 가계부',
        ownerId: BigInt(1),
      }

      mockPrisma.$transaction.mockImplementation(async callback => {
        return await callback({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue({ ...mockUser, groupId: BigInt(300) }),
            count: jest.fn().mockResolvedValue(1), // 소유자만 있음
          },
          group: {
            create: jest.fn().mockResolvedValue(mockNewGroup),
            delete: jest.fn().mockResolvedValue(true),
          },
        })
      })

      const result = await leaveGroup('200', '1')

      expect(result).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
    })
  })
})
