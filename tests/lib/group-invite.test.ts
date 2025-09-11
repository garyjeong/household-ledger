// Jest globals are available by default in Jest environment
import { generateInviteCode, validateInviteCode, cleanupExpiredInviteCodes } from '@/lib/auth'

// Mock Prisma
const mockPrisma = {
  groupInvite: {
    deleteMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('Group Invite Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateInviteCode', () => {
    it('should generate 10-character invite code', async () => {
      mockPrisma.groupInvite.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.groupInvite.create.mockResolvedValue({
        id: 1n,
        groupId: 1n,
        code: 'ABC1234567',
        createdBy: 1n,
        expiresAt: new Date(),
        createdAt: new Date(),
      })

      const result = await generateInviteCode('1', '1')

      expect(result.inviteCode).toHaveLength(10)
      expect(result.inviteCode).toMatch(/^[A-Z0-9]{10}$/)
      expect(mockPrisma.groupInvite.deleteMany).toHaveBeenCalled()
      expect(mockPrisma.groupInvite.create).toHaveBeenCalled()
    })

    it('should set expiration to 24 hours from now', async () => {
      const mockDate = new Date('2024-01-01T00:00:00Z')
      const expectedExpiry = new Date('2024-01-02T00:00:00Z')

      jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

      mockPrisma.groupInvite.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.groupInvite.create.mockImplementation(data => {
        expect(data.data.expiresAt.getTime()).toBe(expectedExpiry.getTime())
        return Promise.resolve({
          id: 1n,
          groupId: 1n,
          code: 'ABC1234567',
          createdBy: 1n,
          expiresAt: data.data.expiresAt,
          createdAt: mockDate,
        })
      })

      await generateInviteCode('1', '1')

      jest.restoreAllMocks()
    })

    it('should clean up existing non-expired invite codes before creating new one', async () => {
      mockPrisma.groupInvite.deleteMany.mockResolvedValue({ count: 1 })
      mockPrisma.groupInvite.create.mockResolvedValue({
        id: 1n,
        groupId: 1n,
        code: 'ABC1234567',
        createdBy: 1n,
        expiresAt: new Date(),
        createdAt: new Date(),
      })

      await generateInviteCode('1', '1')

      expect(mockPrisma.groupInvite.deleteMany).toHaveBeenCalledWith({
        where: {
          groupId: BigInt('1'),
          expiresAt: {
            gte: expect.any(Date),
          },
        },
      })
    })
  })

  describe('validateInviteCode', () => {
    it('should return valid for non-expired invite code', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

      mockPrisma.groupInvite.findUnique.mockResolvedValue({
        id: 1n,
        groupId: 1n,
        code: 'ABC1234567',
        createdBy: 1n,
        expiresAt: futureDate,
        createdAt: new Date(),
        group: { id: 1n, name: 'Test Group' },
      })

      const result = await validateInviteCode('ABC1234567')

      expect(result.isValid).toBe(true)
      expect(result.groupId).toBe('1')
    })

    it('should return invalid and delete expired invite code', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

      mockPrisma.groupInvite.findUnique.mockResolvedValue({
        id: 1n,
        groupId: 1n,
        code: 'ABC1234567',
        createdBy: 1n,
        expiresAt: pastDate,
        createdAt: new Date(),
        group: { id: 1n, name: 'Test Group' },
      })
      mockPrisma.groupInvite.delete.mockResolvedValue({
        id: 1n,
        groupId: 1n,
        code: 'ABC1234567',
        createdBy: 1n,
        expiresAt: pastDate,
        createdAt: new Date(),
      })

      const result = await validateInviteCode('ABC1234567')

      expect(result.isValid).toBe(false)
      expect(result.groupId).toBe('1')
      expect(mockPrisma.groupInvite.delete).toHaveBeenCalledWith({
        where: { id: 1n },
      })
    })

    it('should return invalid for non-existent invite code', async () => {
      mockPrisma.groupInvite.findUnique.mockResolvedValue(null)

      const result = await validateInviteCode('NOTFOUND123')

      expect(result.isValid).toBe(false)
      expect(result.groupId).toBe('')
    })
  })

  describe('cleanupExpiredInviteCodes', () => {
    it('should delete expired invite codes and return count', async () => {
      mockPrisma.groupInvite.deleteMany.mockResolvedValue({ count: 5 })

      const deletedCount = await cleanupExpiredInviteCodes()

      expect(deletedCount).toBe(5)
      expect(mockPrisma.groupInvite.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      })
    })

    it('should return 0 when database error occurs', async () => {
      mockPrisma.groupInvite.deleteMany.mockRejectedValue(new Error('Database error'))

      const deletedCount = await cleanupExpiredInviteCodes()

      expect(deletedCount).toBe(0)
    })
  })
})
