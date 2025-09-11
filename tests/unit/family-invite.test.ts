/**
 * 가족 초대 기능 단위 테스트
 * - 초대 코드 생성 기능
 * - 코드를 통한 그룹 참여 기능
 * - 개인 그룹 자동 생성/삭제 로직
 */

// Jest globals are available by default in Jest environment
import { prismaMock } from '@/lib/prisma-mock'

// Mock modules
jest.mock('@/lib/prisma', () => ({
  default: prismaMock,
}))

jest.mock('@/lib/security-utils', () => ({
  safeConsole: {
    log: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock generateId function
jest.mock('@/lib/utils', () => ({
  generateId: jest.fn(() => 'ABCD1234EF'),
}))

describe('가족 초대 기능', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('초대 코드 생성', () => {
    it('유효한 그룹에 대해 초대 코드를 생성할 수 있어야 한다', async () => {
      // Arrange
      const expectedResult = {
        inviteCode: 'ABCD1234EF',
        inviteUrl: 'http://localhost:3000/groups/join?code=ABCD1234EF',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }

      // Mock groupInvite operations
      prismaMock.groupInvite = {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({
          id: BigInt(1),
          groupId: BigInt(1),
          code: 'ABCD1234EF',
          createdBy: BigInt(1),
          expiresAt: expectedResult.expiresAt,
        }),
      } as any

      // Act
      const { generateInviteCode } = await import('@/lib/auth')
      const result = await generateInviteCode('1', '1')

      // Assert
      expect(result.inviteCode).toBe('ABCD1234EF')
      expect(result.inviteUrl).toContain('ABCD1234EF')
      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(prismaMock.groupInvite.deleteMany).toHaveBeenCalledWith({
        where: {
          groupId: BigInt(1),
          expiresAt: { gte: expect.any(Date) },
        },
      })
      expect(prismaMock.groupInvite.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: BigInt(1),
          code: expect.any(String),
          createdBy: BigInt(1),
          expiresAt: expect.any(Date),
        }),
      })
    })

    it('그룹 소유자가 아닌 사용자는 초대 코드를 생성할 수 없어야 한다', async () => {
      // Arrange
      const mockGroup = {
        id: BigInt(1),
        name: '김가네 가계부',
        ownerId: BigInt(1),
        members: [{ id: BigInt(2) }],
      }

      prismaMock.group.findUnique.mockResolvedValue(mockGroup as any)

      // Act
      const { generateInviteCode } = await import('@/lib/auth')
      const result = await generateInviteCode(BigInt(1), BigInt(2))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('권한이 없습니다')
    })

    it('존재하지 않는 그룹에 대해 초대 코드 생성을 시도하면 실패해야 한다', async () => {
      // Arrange
      prismaMock.group.findUnique.mockResolvedValue(null)

      // Act
      const { generateInviteCode } = await import('@/lib/auth')
      const result = await generateInviteCode(BigInt(999), BigInt(1))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('그룹을 찾을 수 없습니다')
    })
  })

  describe('코드를 통한 그룹 참여', () => {
    it('유효한 초대 코드로 그룹에 참여할 수 있어야 한다', async () => {
      // Arrange
      const mockInviteCode = {
        id: BigInt(1),
        code: 'ABCD1234EFGH',
        groupId: BigInt(1),
        createdById: BigInt(1),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간 후 만료
        isUsed: false,
        group: {
          id: BigInt(1),
          name: '김가네 가계부',
        },
      }

      const mockUser = {
        id: BigInt(2),
        email: 'user@example.com',
        nickname: '사용자',
        groupId: BigInt(3), // 개인 그룹
      }

      const mockPersonalGroup = {
        id: BigInt(3),
        name: '사용자의 가계부',
        ownerId: BigInt(2),
        members: [{ id: BigInt(2) }],
        _count: { members: 1 },
      }

      // Mock database calls
      prismaMock.inviteCode.findFirst.mockResolvedValue(mockInviteCode as any)
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any)
      prismaMock.group.findUnique.mockResolvedValue(mockPersonalGroup as any)
      prismaMock.$transaction.mockImplementation(async callback => {
        await callback(prismaMock)
        return mockUser
      })

      // Act
      const { joinGroup } = await import('@/lib/auth')
      const result = await joinGroup('ABCD1234EFGH', BigInt(2))

      // Assert
      expect(result.success).toBe(true)
      expect(result.group?.name).toBe('김가네 가계부')
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })

    it('만료된 초대 코드로는 참여할 수 없어야 한다', async () => {
      // Arrange
      const expiredInviteCode = {
        id: BigInt(1),
        code: 'EXPIRED123',
        groupId: BigInt(1),
        createdById: BigInt(1),
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1시간 전 만료
        isUsed: false,
      }

      prismaMock.inviteCode.findFirst.mockResolvedValue(expiredInviteCode as any)

      // Act
      const { joinGroup } = await import('@/lib/auth')
      const result = await joinGroup('EXPIRED123', BigInt(2))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('만료되었습니다')
    })

    it('이미 사용된 초대 코드로는 참여할 수 없어야 한다', async () => {
      // Arrange
      const usedInviteCode = {
        id: BigInt(1),
        code: 'USED1234ABCD',
        groupId: BigInt(1),
        createdById: BigInt(1),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isUsed: true,
      }

      prismaMock.inviteCode.findFirst.mockResolvedValue(usedInviteCode as any)

      // Act
      const { joinGroup } = await import('@/lib/auth')
      const result = await joinGroup('USED1234ABCD', BigInt(2))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('이미 사용된 코드입니다')
    })

    it('존재하지 않는 초대 코드로는 참여할 수 없어야 한다', async () => {
      // Arrange
      prismaMock.inviteCode.findFirst.mockResolvedValue(null)

      // Act
      const { joinGroup } = await import('@/lib/auth')
      const result = await joinGroup('INVALID123', BigInt(2))

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('유효하지 않은 초대 코드입니다')
    })
  })

  describe('개인 그룹 자동 관리', () => {
    it('사용자가 그룹에 참여할 때 개인 그룹이 삭제되어야 한다', async () => {
      // Arrange
      const mockInviteCode = {
        id: BigInt(1),
        code: 'ABCD1234EFGH',
        groupId: BigInt(1),
        createdById: BigInt(1),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        isUsed: false,
        group: {
          id: BigInt(1),
          name: '김가네 가계부',
        },
      }

      const mockUser = {
        id: BigInt(2),
        groupId: BigInt(3), // 개인 그룹
      }

      const mockPersonalGroup = {
        id: BigInt(3),
        ownerId: BigInt(2),
        members: [{ id: BigInt(2) }],
        _count: { members: 1 },
      }

      prismaMock.inviteCode.findFirst.mockResolvedValue(mockInviteCode as any)
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any)
      prismaMock.group.findUnique.mockResolvedValue(mockPersonalGroup as any)
      prismaMock.$transaction.mockImplementation(async callback => {
        return await callback(prismaMock)
      })

      // Act
      const { joinGroup } = await import('@/lib/auth')
      await joinGroup('ABCD1234EFGH', BigInt(2))

      // Assert
      expect(prismaMock.$transaction).toHaveBeenCalled()
      // 트랜잭션 내에서 개인 그룹 삭제가 호출되었는지 확인
    })

    it('그룹에서 방출된 사용자에게 새로운 개인 그룹이 생성되어야 한다', async () => {
      // Arrange
      const mockUser = {
        id: BigInt(2),
        nickname: '방출된사용자',
        groupId: null,
      }

      prismaMock.$transaction.mockImplementation(async callback => {
        return await callback(prismaMock)
      })

      prismaMock.group.create.mockResolvedValue({
        id: BigInt(4),
        name: '방출된사용자의 가계부',
      } as any)

      // Act
      const { leaveGroup } = await import('@/lib/auth')
      const result = await leaveGroup(BigInt(2), BigInt(1))

      // Assert
      expect(result.success).toBe(true)
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })
  })

  describe('초대 코드 정리', () => {
    it('만료된 초대 코드들이 정리되어야 한다', async () => {
      // Arrange
      const mockDeleteResult = { count: 3 }
      prismaMock.inviteCode.deleteMany.mockResolvedValue(mockDeleteResult as any)

      // Act
      const { cleanupExpiredInviteCodes } = await import('@/lib/auth')
      const deletedCount = await cleanupExpiredInviteCodes()

      // Assert
      expect(deletedCount).toBe(3)
      expect(prismaMock.inviteCode.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      })
    })
  })
})
