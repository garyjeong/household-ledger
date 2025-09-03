import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { safeConsole } from './security-utils'

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
      safeConsole.warn('Access token expired', { expiredAt: error.expiredAt })
    } else if (error.name === 'JsonWebTokenError') {
      safeConsole.error('Access token malformed', error)
    } else {
      safeConsole.error('Access token verification failed', error)
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
      safeConsole.warn('Refresh token expired', { expiredAt: error.expiredAt })
    } else if (error.name === 'JsonWebTokenError') {
      safeConsole.error('Refresh token malformed', error)
    } else {
      safeConsole.error('Refresh token verification failed', error)
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
    // GroupMember 테이블 대신 User.groupId 활용
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: {
        group: {
          include: {
            owner: { select: { id: true, nickname: true, email: true, createdAt: true } },
            members: {
              select: {
                id: true,
                nickname: true,
                email: true,
                groupId: true,
              },
            },
          },
        },
        ownedGroups: {
          include: {
            owner: { select: { id: true, nickname: true, email: true, createdAt: true } },
            members: {
              select: {
                id: true,
                nickname: true,
                email: true,
                groupId: true,
              },
            },
          },
        },
      },
    })

    const groups: GroupWithMembers[] = []

    // 소속 그룹
    if (user?.group) {
      groups.push({
        id: user.group.id.toString(),
        name: user.group.name,
        ownerId: user.group.ownerId.toString(),
        createdAt: user.group.createdAt,
        owner: {
          ...user.group.owner,
          id: user.group.owner.id.toString(),
        },
        members: user.group.members.map(member => ({
          groupId: member.groupId?.toString() || '',
          userId: member.id.toString(),
          role:
            member.id.toString() === user.group!.ownerId.toString()
              ? ('OWNER' as const)
              : ('MEMBER' as const),
          joinedAt: new Date(), // 단순화를 위해 현재 시간 사용
        })),
        memberCount: user.group.members.length,
      })
    }

    // 소유 그룹들
    user?.ownedGroups.forEach(group => {
      groups.push({
        id: group.id.toString(),
        name: group.name,
        ownerId: group.ownerId.toString(),
        createdAt: group.createdAt,
        owner: {
          ...group.owner,
          id: group.owner.id.toString(),
        },
        members: group.members.map(member => ({
          groupId: member.groupId?.toString() || '',
          userId: member.id.toString(),
          role:
            member.id.toString() === group.ownerId.toString()
              ? ('OWNER' as const)
              : ('MEMBER' as const),
          joinedAt: new Date(),
        })),
        memberCount: group.members.length,
      })
    })

    return groups
  } catch (error) {
    safeConsole.error('findGroupsByUserId error', error)
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
      where: { id: BigInt(groupId) },
      include: {
        members: {
          select: {
            id: true,
            nickname: true,
            email: true,
            groupId: true,
          },
        },
        owner: { select: { id: true, nickname: true, email: true, createdAt: true } },
      },
    })

    if (!group) return null

    // 사용자가 지정된 경우 해당 그룹의 멤버인지 확인
    if (userId) {
      const isMember = group.members.some(member => member.id.toString() === userId)
      if (!isMember) return null
    }

    return {
      id: group.id.toString(),
      name: group.name,
      ownerId: group.ownerId.toString(),
      createdAt: group.createdAt,
      memberCount: group.members.length,
      members: group.members.map(member => ({
        groupId: member.groupId?.toString() || '',
        userId: member.id.toString(),
        role: (member.id.toString() === group.ownerId.toString() ? 'OWNER' : 'MEMBER') as
          | 'OWNER'
          | 'ADMIN'
          | 'MEMBER',
        joinedAt: new Date(), // 단순화를 위해 현재 시간 사용
        user: {
          id: member.id.toString(),
          nickname: member.nickname,
          email: member.email,
          createdAt: new Date(), // 단순화를 위해 현재 시간 사용
        },
      })),
      owner: {
        ...group.owner,
        id: group.owner.id.toString(),
      },
    }
  } catch (error) {
    safeConsole.error('Error finding group by ID', error)
    return null
  }
}

export async function createGroup(data: CreateGroupData): Promise<Group> {
  const { prisma } = await import('@/lib/prisma')
  const { safeConsole } = await import('@/lib/security-utils')

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

      // 소유자의 그룹 설정
      await tx.user.update({
        where: { id: BigInt(data.ownerId) },
        data: { groupId: newGroup.id },
      })

      // 성공 로깅
      safeConsole.log('그룹 생성 성공 (DB)', {
        groupId: newGroup.id.toString(),
        groupName: newGroup.name,
        ownerId: data.ownerId,
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
    safeConsole.error('그룹 생성 실패 (DB)', error, {
      operation: 'createGroup',
      groupName: data.name,
      ownerId: data.ownerId,
    })
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
    safeConsole.error('Error generating invite code', error)
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
    safeConsole.error('Error validating invite code', error)
    return { groupId: '', isValid: false }
  }
}

export async function joinGroup(groupId: string, userId: string): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma')
  const { safeConsole } = await import('@/lib/security-utils')

  try {
    // 트랜잭션으로 데이터 무결성 보장
    const result = await prisma.$transaction(async tx => {
      // 1. 사용자 존재 및 그룹 상태 확인
      const user = await tx.user.findUnique({
        where: { id: BigInt(userId) },
      })

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다')
      }

      if (user.groupId) {
        throw new Error('이미 다른 그룹에 속해있습니다')
      }

      // 2. 그룹 존재 확인
      const group = await tx.group.findUnique({
        where: { id: BigInt(groupId) },
      })

      if (!group) {
        throw new Error('그룹을 찾을 수 없습니다')
      }

      // 3. 그룹 참여 (User.groupId 업데이트)
      await tx.user.update({
        where: { id: BigInt(userId) },
        data: { groupId: BigInt(groupId) },
      })

      // 4. 성공 로깅
      safeConsole.log('그룹 참여 성공', {
        groupId,
        userId,
        groupName: group.name,
      })

      return true
    })

    return result
  } catch (error) {
    safeConsole.error('그룹 참여 실패', error, {
      groupId,
      userId,
      operation: 'joinGroup',
    })
    return false
  }
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma')

  try {
    // 사용자 정보 및 그룹 소유권 확인
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: { ownedGroups: true },
    })

    if (!user || user.groupId?.toString() !== groupId) {
      return false // 그룹 멤버가 아님
    }

    // 소유자는 탈퇴할 수 없음
    const isOwner = user.ownedGroups.some(group => group.id.toString() === groupId)
    if (isOwner) {
      return false
    }

    // 그룹 탈퇴 (User.groupId를 null로 설정)
    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: { groupId: null },
    })

    return true
  } catch (error) {
    safeConsole.error('Error leaving group', error)
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
    // 단순화된 스키마에서는 역할이 OWNER/MEMBER로만 구분됨
    // 그룹 소유자는 변경할 수 없고, 멤버는 모두 동일한 역할을 가짐
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { groupId: true },
    })

    if (!user || user.groupId?.toString() !== groupId) {
      return false // 멤버를 찾을 수 없음
    }

    // 단순화된 스키마에서는 별도의 역할 업데이트 없음
    return true
  } catch (error) {
    safeConsole.error('Error updating group member role', error)
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

      const user = await prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: { groupId: true },
      })

      if (user && user.groupId?.toString() === ownerId) {
        return { isValid: true }
      }
      return { isValid: false, error: '그룹 멤버만 접근할 수 있습니다' }
    }

    return { isValid: false, error: '올바르지 않은 소유자 타입입니다' }
  } catch (error) {
    safeConsole.error('소유권 검증 중 오류', error)
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

    // 사용자가 해당 그룹의 멤버인지 확인
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { groupId: true },
    })

    if (!user || user.groupId?.toString() !== groupId) {
      return null // 멤버가 아님
    }

    // 그룹 소유자인지 확인
    const group = await prisma.group.findUnique({
      where: { id: BigInt(groupId) },
      select: { ownerId: true },
    })

    if (group && group.ownerId.toString() === userId) {
      return 'OWNER'
    }

    return 'MEMBER'
  } catch (error) {
    safeConsole.error('Error getting group member role', error)
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

    safeConsole.log(`Cleaned up ${result.count} expired invite codes`)
    return result.count
  } catch (error) {
    safeConsole.error('Error cleaning up expired invite codes', error)
    return 0
  }
}
