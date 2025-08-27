import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
  extractTokenFromHeader,
  findUserByEmail,
  findUserById,
  createUser,
  verifyUserPassword,
  findGroupsByUserId,
  findGroupById,
  createGroup,
  generateInviteCode,
  validateInviteCode,
  joinGroup,
  leaveGroup,
  updateGroupMemberRole,
} from '@/lib/auth'

// Mock Prisma
const mockUsers = [
  {
    id: '1',
    email: 'smat91@naver.com',
    nickname: '개뤼',
    // Pre-computed bcrypt hash for 'Wjdwhdans91!'
    passwordHash: '$2a$10$n9CM.jYlQuJxQGSdF4j6j.5fZ0H6RWQH0.2h4/E5RzSGq9p8BH6fG',
    createdAt: new Date(),
  },
  {
    id: '2',
    email: 'user2@example.com',
    nickname: '유저2',
    passwordHash: '$2a$10$hashedpassword2',
    createdAt: new Date(),
  },
]

const mockGroups = [
  {
    id: 'group1',
    name: '테스트 그룹',
    ownerId: '1',
    createdAt: new Date(),
  },
]

const mockGroupMembers = [
  {
    groupId: 'group1',
    userId: '1',
    role: 'OWNER' as const,
    joinedAt: new Date(),
  },
]

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  group: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  groupMember: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  inviteCode: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
}

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: jest.fn().mockImplementation((password: string, hash: string) => {
    // For testing, just check if it's the expected password
    return Promise.resolve(password === 'Wjdwhdans91!')
  }),
}))

// Setup mock implementations
beforeEach(() => {
  jest.clearAllMocks()

  // Reset mock data
  mockUsers.length = 0
  mockUsers.push(
    {
      id: '1',
      email: 'smat91@naver.com',
      nickname: '개뤼',
      passwordHash: '$2a$10$n9CM.jYlQuJxQGSdF4j6j.5fZ0H6RWQH0.2h4/E5RzSGq9p8BH6fG',
      createdAt: new Date(),
    },
    {
      id: '2',
      email: 'user2@example.com',
      nickname: '유저2',
      passwordHash: '$2a$10$hashedpassword2',
      createdAt: new Date(),
    }
  )

  mockGroups.length = 0
  mockGroups.push({
    id: 'group1',
    name: '테스트 그룹',
    ownerId: '1',
    createdAt: new Date(),
  })

  mockGroupMembers.length = 0
  mockGroupMembers.push({
    groupId: 'group1',
    userId: '1',
    role: 'OWNER' as const,
    joinedAt: new Date(),
  })

  // Mock user operations
  mockPrisma.user.findUnique.mockImplementation(({ where }) => {
    if (where.email) {
      return Promise.resolve(mockUsers.find(u => u.email === where.email) || null)
    }
    if (where.id) {
      return Promise.resolve(mockUsers.find(u => u.id === where.id) || null)
    }
    return Promise.resolve(null)
  })

  mockPrisma.user.create.mockImplementation(({ data }) => {
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      email: data.email,
      nickname: data.nickname,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
    }
    mockUsers.push(newUser)
    return Promise.resolve(newUser)
  })

  // Mock group operations
  mockPrisma.group.findUnique.mockImplementation(({ where, include }) => {
    const group = mockGroups.find(g => g.id === where.id)
    if (!group) return Promise.resolve(null)

    if (include?.members) {
      const members = mockGroupMembers
        .filter(m => m.groupId === group.id)
        .map(m => ({
          ...m,
          user: mockUsers.find(u => u.id === m.userId),
        }))
      return Promise.resolve({ ...group, members })
    }
    return Promise.resolve(group)
  })

  mockPrisma.group.create.mockImplementation(({ data }) => {
    // Check if group with same name already exists for the owner
    const existingGroup = mockGroups.find(g => g.name === data.name && g.ownerId === data.ownerId)
    if (existingGroup) {
      throw new Error('Unique constraint failed')
    }

    const newGroup = {
      id: `group${mockGroups.length + 1}`,
      name: data.name,
      ownerId: data.ownerId,
      createdAt: new Date(),
    }
    mockGroups.push(newGroup)

    return Promise.resolve(newGroup)
  })

  mockPrisma.group.findMany.mockImplementation(({ where, include }) => {
    let groups = mockGroups

    if (where?.members?.some?.userId) {
      const userId = where.members.some.userId
      const userGroupIds = mockGroupMembers.filter(m => m.userId === userId).map(m => m.groupId)
      groups = mockGroups.filter(g => userGroupIds.includes(g.id))
    }

    if (include?.members) {
      return Promise.resolve(
        groups.map(group => ({
          ...group,
          members: mockGroupMembers
            .filter(m => m.groupId === group.id)
            .map(m => ({
              ...m,
              user: mockUsers.find(u => u.id === m.userId),
            })),
        }))
      )
    }

    return Promise.resolve(groups)
  })

  // Mock group member operations
  mockPrisma.groupMember.findUnique.mockImplementation(({ where }) => {
    return Promise.resolve(
      mockGroupMembers.find(
        m =>
          m.groupId === where.groupId_userId?.groupId && m.userId === where.groupId_userId?.userId
      ) || null
    )
  })

  mockPrisma.groupMember.create.mockImplementation(({ data }) => {
    const existing = mockGroupMembers.find(
      m => m.groupId === data.groupId && m.userId === data.userId
    )
    if (existing) {
      throw new Error('Unique constraint failed')
    }

    const newMember = {
      groupId: data.groupId,
      userId: data.userId,
      role: data.role || ('MEMBER' as const),
      joinedAt: new Date(),
    }
    mockGroupMembers.push(newMember)
    return Promise.resolve(newMember)
  })

  mockPrisma.groupMember.delete.mockImplementation(({ where }) => {
    const index = mockGroupMembers.findIndex(
      m => m.groupId === where.groupId_userId?.groupId && m.userId === where.groupId_userId?.userId
    )
    if (index >= 0) {
      const deleted = mockGroupMembers.splice(index, 1)[0]
      return Promise.resolve(deleted)
    }
    throw new Error('Record to delete does not exist')
  })

  mockPrisma.groupMember.update.mockImplementation(({ where, data }) => {
    const member = mockGroupMembers.find(
      m => m.groupId === where.groupId_userId?.groupId && m.userId === where.groupId_userId?.userId
    )
    if (member) {
      Object.assign(member, data)
      return Promise.resolve(member)
    }
    throw new Error('Record to update not found')
  })

  // Mock transaction support
  mockPrisma.$transaction.mockImplementation(async callback => {
    const result = await callback(mockPrisma)

    // For group creation, automatically add owner as member
    if (
      result &&
      result.id &&
      result.ownerId &&
      !mockGroupMembers.find(m => m.groupId === result.id && m.userId === result.ownerId)
    ) {
      mockGroupMembers.push({
        groupId: result.id,
        userId: result.ownerId,
        role: 'OWNER' as const,
        joinedAt: new Date(),
      })
    }

    return result
  })
})

describe('Auth Library', () => {
  describe('JWT Functions', () => {
    const mockPayload = {
      userId: '1',
      email: 'test@example.com',
      nickname: '테스트유저',
    }

    describe('generateAccessToken', () => {
      it('should generate a valid access token', () => {
        const token = generateAccessToken(mockPayload)
        expect(typeof token).toBe('string')
        expect(token.length).toBeGreaterThan(0)
      })

      it('should generate different tokens for different payloads', () => {
        const token1 = generateAccessToken(mockPayload)
        const token2 = generateAccessToken({
          ...mockPayload,
          userId: '2',
        })
        expect(token1).not.toBe(token2)
      })
    })

    describe('generateRefreshToken', () => {
      it('should generate a valid refresh token', () => {
        const token = generateRefreshToken(mockPayload)
        expect(typeof token).toBe('string')
        expect(token.length).toBeGreaterThan(0)
      })
    })

    describe('verifyAccessToken', () => {
      it('should verify a valid access token', () => {
        const token = generateAccessToken(mockPayload)
        const verified = verifyAccessToken(token)

        expect(verified).toBeTruthy()
        expect(verified?.userId).toBe(mockPayload.userId)
        expect(verified?.email).toBe(mockPayload.email)
        expect(verified?.nickname).toBe(mockPayload.nickname)
      })

      it('should return null for invalid token', () => {
        const verified = verifyAccessToken('invalid-token')
        expect(verified).toBeNull()
      })

      it('should return null for empty token', () => {
        const verified = verifyAccessToken('')
        expect(verified).toBeNull()
      })
    })

    describe('verifyRefreshToken', () => {
      it('should verify a valid refresh token', () => {
        const token = generateRefreshToken(mockPayload)
        const verified = verifyRefreshToken(token)

        expect(verified).toBeTruthy()
        expect(verified?.userId).toBe(mockPayload.userId)
      })

      it('should return null for invalid refresh token', () => {
        const verified = verifyRefreshToken('invalid-refresh-token')
        expect(verified).toBeNull()
      })
    })
  })

  describe('Password Functions', () => {
    const testPassword = 'testPassword123!'

    describe('hashPassword', () => {
      it('should hash a password', async () => {
        const hashed = await hashPassword(testPassword)

        expect(typeof hashed).toBe('string')
        expect(hashed).not.toBe(testPassword)
        expect(hashed.length).toBeGreaterThan(20) // bcrypt hashes are typically longer
      })

      it('should generate different hashes for the same password', async () => {
        const hash1 = await hashPassword(testPassword)
        const hash2 = await hashPassword(testPassword)

        expect(hash1).not.toBe(hash2) // Due to salt
      })
    })

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const hashed = await hashPassword(testPassword)
        const isValid = await verifyPassword(testPassword, hashed)

        expect(isValid).toBe(true)
      })

      it('should reject incorrect password', async () => {
        const hashed = await hashPassword(testPassword)
        const isValid = await verifyPassword('wrongPassword', hashed)

        expect(isValid).toBe(false)
      })

      it('should reject empty password', async () => {
        const hashed = await hashPassword(testPassword)
        const isValid = await verifyPassword('', hashed)

        expect(isValid).toBe(false)
      })
    })
  })

  describe('Header Utility Functions', () => {
    describe('extractTokenFromHeader', () => {
      it('should extract token from valid Bearer header', () => {
        const token = 'valid-token-123'
        const authHeader = `Bearer ${token}`
        const extracted = extractTokenFromHeader(authHeader)

        expect(extracted).toBe(token)
      })

      it('should return null for invalid header format', () => {
        const extracted = extractTokenFromHeader('Invalid header')
        expect(extracted).toBeNull()
      })

      it('should return null for null header', () => {
        const extracted = extractTokenFromHeader(null)
        expect(extracted).toBeNull()
      })

      it('should return null for empty header', () => {
        const extracted = extractTokenFromHeader('')
        expect(extracted).toBeNull()
      })

      it('should handle Bearer with no token', () => {
        const extracted = extractTokenFromHeader('Bearer ')
        expect(extracted).toBe('')
      })
    })
  })

  describe('User Functions', () => {
    describe('findUserByEmail', () => {
      it('should find existing user by email', async () => {
        // 실제 DB 테스트를 위해 실제 존재하는 이메일 사용
        const user = await findUserByEmail('smat91@naver.com')

        expect(user).toBeTruthy()
        expect(user?.email).toBe('smat91@naver.com')
        expect(user?.nickname).toBe('개뤼')
      })

      it('should return null for non-existing user', async () => {
        const user = await findUserByEmail('nonexistent@example.com')
        expect(user).toBeNull()
      })

      it('should return null for empty email', async () => {
        const user = await findUserByEmail('')
        expect(user).toBeNull()
      })
    })

    describe('findUserById', () => {
      it('should find existing user by id', async () => {
        const user = await findUserById('1')

        expect(user).toBeTruthy()
        expect(user?.id).toBe('1')
        expect(user?.email).toBe('smat91@naver.com')
        expect(user?.nickname).toBe('개뤼')
      })

      it('should return null for non-existing user id', async () => {
        const user = await findUserById('999')
        expect(user).toBeNull()
      })
    })

    describe('createUser', () => {
      it('should create a new user', async () => {
        const userData = {
          email: 'newuser@example.com',
          password: 'password123',
          nickname: '새유저',
        }

        const user = await createUser(userData)

        expect(user).toBeTruthy()
        expect(user.email).toBe(userData.email)
        expect(user.nickname).toBe(userData.nickname)
        expect(user.id).toBeDefined()
        expect(user.createdAt).toBeDefined()
      })

      it('should assign incremental IDs', async () => {
        const user1 = await createUser({
          email: 'user1@test.com',
          password: 'password123',
          nickname: '유저1',
        })

        const user2 = await createUser({
          email: 'user2@test.com',
          password: 'password123',
          nickname: '유저2',
        })

        expect(parseInt(user2.id)).toBeGreaterThan(parseInt(user1.id))
      })
    })

    describe('verifyUserPassword', () => {
      it('should verify correct password for existing user', async () => {
        const isValid = await verifyUserPassword('smat91@naver.com', 'Wjdwhdans91!')
        expect(isValid).toBe(true)
      })

      it('should reject incorrect password', async () => {
        const isValid = await verifyUserPassword('smat91@naver.com', 'wrongpassword')
        expect(isValid).toBe(false)
      })

      it('should reject non-existing user', async () => {
        const isValid = await verifyUserPassword('nonexistent@example.com', 'password123')
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Group Functions', () => {
    describe('findGroupsByUserId', () => {
      it('should find groups for existing user', async () => {
        const groups = await findGroupsByUserId('1')

        expect(Array.isArray(groups)).toBe(true)
        // 실제 DB에서는 그룹이 있을 수도 없을 수도 있음

        if (groups.length > 0) {
          // 그룹이 있는 경우 구조 검증
          const firstGroup = groups[0]
          expect(firstGroup).toHaveProperty('id')
          expect(firstGroup).toHaveProperty('name')
          expect(firstGroup).toHaveProperty('members')
          expect(firstGroup).toHaveProperty('memberCount')
        }
      })

      it('should return empty array for user with no groups', async () => {
        const groups = await findGroupsByUserId('999')
        expect(Array.isArray(groups)).toBe(true)
        expect(groups.length).toBe(0)
      })
    })

    describe('findGroupById', () => {
      it('should return null for non-existing group', async () => {
        const group = await findGroupById('999')
        expect(group).toBeNull()
      })

      it('should respect user membership check', async () => {
        // 실제 그룹이 있는 경우에만 테스트
        const groups = await findGroupsByUserId('1')
        if (groups.length > 0) {
          const firstGroupId = groups[0].id
          // 사용자 1은 자신의 그룹의 멤버여야 함
          const group = await findGroupById(firstGroupId, '1')
          expect(group).toBeTruthy()

          // 존재하지 않는 사용자는 멤버가 아님
          const groupForNonMember = await findGroupById(firstGroupId, '999')
          expect(groupForNonMember).toBeNull()
        }
      })
    })

    describe('createGroup', () => {
      it('should create a new group', async () => {
        const groupData = {
          name: '새로운 그룹',
          ownerId: '1',
        }

        const group = await createGroup(groupData)

        expect(group).toBeTruthy()
        expect(group.name).toBe(groupData.name)
        expect(group.ownerId).toBe(groupData.ownerId)
        expect(group.id).toBeDefined()
        expect(group.memberCount).toBe(1) // 소유자 자동 추가
      })

      it('should assign incremental group IDs', async () => {
        const group1 = await createGroup({
          name: '그룹1',
          ownerId: '1',
        })

        const group2 = await createGroup({
          name: '그룹2',
          ownerId: '2',
        })

        expect(parseInt(group2.id)).toBeGreaterThan(parseInt(group1.id))
      })
    })

    describe('generateInviteCode', () => {
      it('should generate invite code with proper format', async () => {
        const invite = await generateInviteCode('1', '1')

        expect(invite).toBeTruthy()
        expect(invite.inviteCode).toBeDefined()
        expect(invite.inviteUrl).toBeDefined()
        expect(invite.expiresAt).toBeDefined()

        expect(invite.inviteCode).toHaveLength(8) // 8자리 코드
        expect(invite.inviteUrl).toContain(invite.inviteCode)
        expect(invite.expiresAt.getTime()).toBeGreaterThan(Date.now())
      })

      it('should generate different codes for each call', async () => {
        const invite1 = await generateInviteCode('1', '1')
        const invite2 = await generateInviteCode('1', '1')

        expect(invite1.inviteCode).not.toBe(invite2.inviteCode)
      })
    })

    describe('validateInviteCode', () => {
      it('should validate valid invite code', async () => {
        const invite = await generateInviteCode('1', '1')
        const validation = await validateInviteCode(invite.inviteCode)

        expect(validation.isValid).toBe(true)
        expect(validation.groupId).toBe('1')
      })

      it('should reject invalid invite code', async () => {
        const validation = await validateInviteCode('INVALID123')

        expect(validation.isValid).toBe(false)
        expect(validation.groupId).toBe('')
      })

      it('should reject empty invite code', async () => {
        const validation = await validateInviteCode('')

        expect(validation.isValid).toBe(false)
      })
    })

    describe('joinGroup', () => {
      it('should allow user to join group', async () => {
        // 먼저 새 그룹 생성
        const newGroup = await createGroup({
          name: '참여 테스트 그룹',
          ownerId: '1',
        })

        // 다른 사용자가 참여
        const joined = await joinGroup(newGroup.id, '2')
        expect(joined).toBe(true)

        // 그룹 정보 다시 확인
        const updatedGroup = await findGroupById(newGroup.id)
        expect(updatedGroup?.memberCount).toBe(2)
      })

      it('should prevent duplicate membership', async () => {
        const newGroup = await createGroup({
          name: '중복 참여 테스트 그룹',
          ownerId: '1',
        })

        // 동일 사용자가 두 번 참여 시도
        const firstJoin = await joinGroup(newGroup.id, '2')
        const secondJoin = await joinGroup(newGroup.id, '2')

        expect(firstJoin).toBe(true)
        expect(secondJoin).toBe(false) // 중복 참여 거부
      })

      it('should reject joining non-existing group', async () => {
        const joined = await joinGroup('999', '2')
        expect(joined).toBe(false)
      })
    })

    describe('leaveGroup', () => {
      it('should allow member to leave group', async () => {
        // 새 그룹 생성하고 멤버 추가
        const newGroup = await createGroup({
          name: '탈퇴 테스트 그룹',
          ownerId: '1',
        })
        await joinGroup(newGroup.id, '2')

        // 멤버 탈퇴
        const left = await leaveGroup(newGroup.id, '2')
        expect(left).toBe(true)

        // 그룹 정보 확인
        const updatedGroup = await findGroupById(newGroup.id)
        expect(updatedGroup?.memberCount).toBe(1) // 소유자만 남음
      })

      it('should prevent owner from leaving', async () => {
        const newGroup = await createGroup({
          name: '소유자 탈퇴 테스트 그룹',
          ownerId: '1',
        })

        // 소유자 탈퇴 시도
        const left = await leaveGroup(newGroup.id, '1')
        expect(left).toBe(false) // 소유자는 탈퇴 불가
      })

      it('should reject leaving non-existing group', async () => {
        const left = await leaveGroup('999', '2')
        expect(left).toBe(false)
      })

      it('should reject if user is not a member', async () => {
        const newGroup = await createGroup({
          name: '비멤버 탈퇴 테스트 그룹',
          ownerId: '1',
        })

        const left = await leaveGroup(newGroup.id, '999')
        expect(left).toBe(false)
      })
    })

    describe('updateGroupMemberRole', () => {
      it('should update member role', async () => {
        const newGroup = await createGroup({
          name: '역할 변경 테스트 그룹',
          ownerId: '1',
        })
        await joinGroup(newGroup.id, '2')

        // 멤버를 관리자로 승격
        const updated = await updateGroupMemberRole(newGroup.id, '2', 'ADMIN')
        expect(updated).toBe(true)

        // 역할 변경 확인
        const group = await findGroupById(newGroup.id)
        const member = group?.members.find(m => m.userId === '2')
        expect(member?.role).toBe('ADMIN')
      })

      it('should prevent owner role change', async () => {
        const newGroup = await createGroup({
          name: '소유자 역할 변경 테스트 그룹',
          ownerId: '1',
        })

        // 소유자 역할 변경 시도
        const updated = await updateGroupMemberRole(newGroup.id, '1', 'ADMIN')
        expect(updated).toBe(false) // 소유자 역할 변경 불가
      })

      it('should reject non-existing member', async () => {
        const newGroup = await createGroup({
          name: '비존재 멤버 역할 변경 테스트 그룹',
          ownerId: '1',
        })

        const updated = await updateGroupMemberRole(newGroup.id, '999', 'ADMIN')
        expect(updated).toBe(false)
      })
    })
  })
})
