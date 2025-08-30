import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// JWT 관련 타입 정의
export interface JWTPayload {
  userId: string
  email: string
  nickname: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface User {
  id: string
  email: string
  nickname: string
  avatarUrl?: string
  createdAt: Date
}

export interface Group {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  memberCount?: number
}

export interface GroupMember {
  groupId: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: Date
  user?: User
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
  owner?: User
}

export interface CreateGroupData {
  name: string
  ownerId: string
}

export interface InviteResponse {
  inviteCode: string
  inviteUrl: string
  expiresAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupData {
  email: string
  password: string
  nickname: string
}

// 환경 변수에서 시크릿 키 가져오기
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'

// JWT 토큰 생성
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h', // 1시간
    issuer: 'household-ledger',
  })
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7일
    issuer: 'household-ledger',
  })
}

// JWT 토큰 검증 결과 타입
export interface TokenVerificationResult {
  isValid: boolean
  payload?: JWTPayload
  error?: 'EXPIRED' | 'INVALID' | 'MALFORMED' | 'UNKNOWN'
  message?: string
}

// JWT 토큰 검증
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.warn('Access token expired:', error.expiredAt)
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Access token malformed:', error.message)
    } else {
      console.error('Access token verification failed:', error)
    }
    return null
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
    return decoded
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.warn('Refresh token expired:', error.expiredAt)
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Refresh token malformed:', error.message)
    } else {
      console.error('Refresh token verification failed:', error)
    }
    return null
  }
}

// 상세한 토큰 검증 함수 (에러 정보 포함)
export function verifyAccessTokenDetailed(token: string): TokenVerificationResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return {
      isValid: true,
      payload: decoded,
    }
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return {
        isValid: false,
        error: 'EXPIRED',
        message: `토큰이 만료되었습니다. 만료 시간: ${error.expiredAt}`,
      }
    } else if (error.name === 'JsonWebTokenError') {
      return {
        isValid: false,
        error: 'MALFORMED',
        message: '유효하지 않은 토큰 형식입니다.',
      }
    } else if (error.name === 'NotBeforeError') {
      return {
        isValid: false,
        error: 'INVALID',
        message: '토큰이 아직 활성화되지 않았습니다.',
      }
    } else {
      return {
        isValid: false,
        error: 'UNKNOWN',
        message: '알 수 없는 토큰 검증 오류가 발생했습니다.',
      }
    }
  }
}

// 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Authorization 헤더에서 토큰 추출
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // "Bearer " 제거
}

// 토큰 쿠키 옵션
export const tokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

// Access Token 쿠키 옵션 (1시간)
export const accessTokenCookieOptions = {
  ...tokenCookieOptions,
  maxAge: 60 * 60 * 1000, // 1시간
}

// Refresh Token 쿠키 옵션 (7일)
export const refreshTokenCookieOptions = {
  ...tokenCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
}

// Mock 사용자 데이터 (실제 DB 연결 전까지 사용)
// Mock 데이터는 제거되었습니다. 모든 기능이 실제 Prisma 데이터베이스를 사용합니다.

// Mock 함수들 (DB 연결 후 실제 구현으로 교체)
export async function findUserByEmail(email: string): Promise<User | null> {
  const { prisma } = await import('@/lib/prisma')

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) return null

  return {
    id: user.id.toString(),
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl || undefined,
    createdAt: user.createdAt,
  }
}

export async function findUserById(id: string): Promise<User | null> {
  const { prisma } = await import('@/lib/prisma')

  const user = await prisma.user.findUnique({
    where: { id: BigInt(id) },
  })

  if (!user) return null

  return {
    id: user.id.toString(),
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl || undefined,
    createdAt: user.createdAt,
  }
}

export async function createUser(userData: SignupData): Promise<User> {
  const { prisma } = await import('@/lib/prisma')

  const hashedPassword = await hashPassword(userData.password)

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      passwordHash: hashedPassword,
      nickname: userData.nickname,
      avatarUrl: null,
    },
  })

  return {
    id: user.id.toString(),
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl || undefined,
    createdAt: user.createdAt,
  }
}

export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma')

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) return false

  return await verifyPassword(password, user.passwordHash)
}

// 그룹 관련 Mock 함수들
export async function findGroupsByUserId(userId: string): Promise<GroupWithMembers[]> {
  const { prisma } = await import('@/lib/prisma')

  try {
    const userGroups = await prisma.groupMember.findMany({
      where: {
        userId: BigInt(userId),
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
            owner: true,
          },
        },
      },
    })

    return userGroups.map(membership => ({
      id: membership.group.id.toString(),
      name: membership.group.name,
      ownerId: membership.group.ownerId.toString(),
      createdAt: membership.group.createdAt,
      memberCount: membership.group.members.length,
      members: membership.group.members.map(member => ({
        groupId: member.groupId.toString(),
        userId: member.userId.toString(),
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id.toString(),
          email: member.user.email,
          nickname: member.user.nickname,
          avatarUrl: member.user.avatarUrl || undefined,
          createdAt: member.user.createdAt,
        },
      })),
      owner: {
        id: membership.group.owner.id.toString(),
        email: membership.group.owner.email,
        nickname: membership.group.owner.nickname,
        avatarUrl: membership.group.owner.avatarUrl || undefined,
        createdAt: membership.group.owner.createdAt,
      },
    }))
  } catch (error) {
    console.error('Error finding groups by user ID:', error)
    return []
  }
}

export async function findGroupById(
  groupId: string,
  userId?: string
): Promise<GroupWithMembers | null> {
  try {
    const { prisma } = await import('@/lib/prisma')

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        owner: true,
      },
    })

    if (!group) return null

    // 사용자가 지정된 경우 해당 그룹의 멤버인지 확인
    if (userId) {
      const isMember = group.members.some(member => member.userId === userId)
      if (!isMember) return null
    }

    return {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      createdAt: group.createdAt,
      memberCount: group.members.length,
      members: group.members.map(member => ({
        groupId: member.groupId,
        userId: member.userId,
        role: member.role as 'OWNER' | 'ADMIN' | 'MEMBER',
        joinedAt: member.joinedAt,
        user: member.user,
      })),
      owner: group.owner,
    }
  } catch (error) {
    console.error('Error finding group by ID:', error)
    return null
  }
}

export async function createGroup(data: CreateGroupData): Promise<Group> {
  const { prisma } = await import('@/lib/prisma')

  try {
    // 트랜잭션을 사용하여 그룹과 소유자 멤버십을 동시에 생성
    const result = await prisma.$transaction(async tx => {
      // 그룹 생성
      const newGroup = await tx.group.create({
        data: {
          name: data.name,
          ownerId: BigInt(data.ownerId),
        },
      })

      // 소유자를 그룹 멤버로 추가
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId: BigInt(data.ownerId),
          role: 'OWNER',
        },
      })

      return newGroup
    })

    return {
      id: result.id.toString(),
      name: result.name,
      ownerId: result.ownerId.toString(),
      createdAt: result.createdAt,
      memberCount: 1,
    }
  } catch (error) {
    console.error('Error creating group:', error)
    throw new Error('그룹 생성에 실패했습니다.')
  }
}

export async function generateInviteCode(
  groupId: string,
  createdBy: string
): Promise<InviteResponse> {
  const { prisma } = await import('@/lib/prisma')

  // 10자리 영문+숫자 코드 생성
  const inviteCode = generateId(10)
  const expiresAt = new Date()
  expiresAt.setTime(expiresAt.getTime() + 24 * 60 * 60 * 1000) // 24시간 후 만료

  try {
    // 기존 그룹의 만료되지 않은 초대 코드 삭제
    await prisma.groupInvite.deleteMany({
      where: {
        groupId: BigInt(groupId),
        expiresAt: {
          gte: new Date(),
        },
      },
    })

    // 새 초대 코드 저장
    await prisma.groupInvite.create({
      data: {
        groupId: BigInt(groupId),
        code: inviteCode,
        createdBy: BigInt(createdBy),
        expiresAt,
      },
    })

    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/groups/join?code=${inviteCode}`

    return {
      inviteCode,
      inviteUrl,
      expiresAt,
    }
  } catch (error) {
    console.error('Error generating invite code:', error)
    throw new Error('초대 코드 생성에 실패했습니다.')
  }
}

export async function validateInviteCode(
  inviteCode: string
): Promise<{ groupId: string; isValid: boolean }> {
  const { prisma } = await import('@/lib/prisma')

  try {
    const invite = await prisma.groupInvite.findUnique({
      where: { code: inviteCode },
      include: { group: true },
    })

    if (!invite) {
      return { groupId: '', isValid: false }
    }

    const isExpired = new Date() > invite.expiresAt
    if (isExpired) {
      // 만료된 코드 삭제
      await prisma.groupInvite.delete({
        where: { id: invite.id },
      })
      return { groupId: invite.groupId.toString(), isValid: false }
    }

    return { groupId: invite.groupId.toString(), isValid: true }
  } catch (error) {
    console.error('Error validating invite code:', error)
    return { groupId: '', isValid: false }
  }
}

export async function joinGroup(groupId: string, userId: string): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma')

  try {
    // 이미 멤버인지 확인
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: BigInt(groupId),
          userId: BigInt(userId),
        },
      },
    })

    if (existingMember) {
      return false // 이미 멤버임
    }

    // 그룹이 존재하는지 확인
    const group = await prisma.group.findUnique({
      where: { id: BigInt(groupId) },
    })

    if (!group) {
      return false
    }

    // 새 멤버 추가
    await prisma.groupMember.create({
      data: {
        groupId: BigInt(groupId),
        userId: BigInt(userId),
        role: 'MEMBER',
      },
    })

    return true
  } catch (error) {
    console.error('Error joining group:', error)
    return false
  }
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma')

  try {
    // 멤버 정보 확인
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: BigInt(groupId),
          userId: BigInt(userId),
        },
      },
    })

    if (!member) {
      return false // 멤버가 아님
    }

    // 소유자는 탈퇴할 수 없음
    if (member.role === 'OWNER') {
      return false
    }

    // 멤버 제거
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: BigInt(groupId),
          userId: BigInt(userId),
        },
      },
    })

    return true
  } catch (error) {
    console.error('Error leaving group:', error)
    return false
  }
}

export async function updateGroupMemberRole(
  groupId: string,
  userId: string,
  newRole: 'ADMIN' | 'MEMBER'
): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma')

  try {
    // 멤버 정보 확인
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: BigInt(groupId),
          userId: BigInt(userId),
        },
      },
    })

    if (!member || member.role === 'OWNER') {
      return false // 멤버가 없거나 소유자 역할은 변경 불가
    }

    // 역할 업데이트
    await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId: BigInt(groupId),
          userId: BigInt(userId),
        },
      },
      data: {
        role: newRole,
      },
    })

    return true
  } catch (error) {
    console.error('Error updating group member role:', error)
    return false
  }
}

// 헤더에서 토큰 추출 및 검증 (통합 함수)
export function verifyToken(authHeader: string | null): JWTPayload | null {
  const token = extractTokenFromHeader(authHeader)
  if (!token) return null

  return verifyAccessToken(token)
}

// 쿠키에서 가져온 토큰을 직접 검증하는 함수
export function verifyCookieToken(token: string): JWTPayload | null {
  return verifyAccessToken(token)
}

// ID 생성 함수 (초대 코드 등에 사용)
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 날짜 포맷 유틸리티
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('ko-KR', options)
}

// 이메일 저장/불러오기 (localStorage 사용)
export const emailStorage = {
  save: (email: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rememberedEmail', email)
    }
  },

  load: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rememberedEmail')
    }
    return null
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rememberedEmail')
    }
  },
}

// =============================================
// 소유권 검증 유틸리티
// =============================================

export interface OwnershipVerificationResult {
  isValid: boolean
  error?: string
}

/**
 * 사용자가 특정 리소스의 소유자인지 확인
 */
export async function verifyResourceOwnership(
  userId: string,
  ownerType: 'USER' | 'GROUP',
  ownerId: string
): Promise<OwnershipVerificationResult> {
  try {
    if (ownerType === 'USER') {
      // 개인 소유 리소스: 소유자 ID가 현재 사용자 ID와 일치해야 함
      if (ownerId === userId) {
        return { isValid: true }
      }
      return { isValid: false, error: '접근 권한이 없습니다' }
    }

    if (ownerType === 'GROUP') {
      // 그룹 소유 리소스: 현재 사용자가 해당 그룹의 멤버여야 함
      const { prisma } = await import('@/lib/prisma')

      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: BigInt(ownerId),
            userId: BigInt(userId),
          },
        },
      })

      if (membership) {
        return { isValid: true }
      }
      return { isValid: false, error: '그룹 멤버만 접근할 수 있습니다' }
    }

    return { isValid: false, error: '올바르지 않은 소유자 타입입니다' }
  } catch (error) {
    console.error('소유권 검증 중 오류:', error)
    return { isValid: false, error: '소유권 검증에 실패했습니다' }
  }
}

/**
 * 계좌 소유권 검증 (특화된 버전)
 */
export async function verifyAccountOwnership(
  userId: string,
  ownerType: 'USER' | 'GROUP',
  ownerId: string
): Promise<OwnershipVerificationResult> {
  return verifyResourceOwnership(userId, ownerType, ownerId)
}

/**
 * 카테고리 소유권 검증 (특화된 버전)
 */
export async function verifyCategoryOwnership(
  userId: string,
  ownerType: 'USER' | 'GROUP',
  ownerId: string
): Promise<OwnershipVerificationResult> {
  return verifyResourceOwnership(userId, ownerType, ownerId)
}

/**
 * 그룹 멤버의 역할 확인
 */
export async function getGroupMemberRole(
  userId: string,
  groupId: string
): Promise<'OWNER' | 'ADMIN' | 'MEMBER' | null> {
  try {
    const { prisma } = await import('@/lib/prisma')

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: BigInt(groupId),
          userId: BigInt(userId),
        },
      },
    })

    return membership?.role || null
  } catch (error) {
    console.error('Error getting group member role:', error)
    return null
  }
}

/**
 * 그룹 관리 권한 확인 (OWNER 또는 ADMIN)
 */
export async function hasGroupManagementPermission(
  userId: string,
  groupId: string
): Promise<boolean> {
  const role = await getGroupMemberRole(userId, groupId)
  return role === 'OWNER' || role === 'ADMIN'
}

/**
 * 만료된 초대 코드 정리
 */
export async function cleanupExpiredInviteCodes(): Promise<number> {
  try {
    const { prisma } = await import('@/lib/prisma')

    const result = await prisma.groupInvite.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    console.log(`Cleaned up ${result.count} expired invite codes`)
    return result.count
  } catch (error) {
    console.error('Error cleaning up expired invite codes:', error)
    return 0
  }
}
