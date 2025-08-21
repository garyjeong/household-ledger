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

// JWT 토큰 검증
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Access token verification failed:', error)
    return null
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
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
const mockUsers: User[] = [
  {
    id: '1',
    email: 'test@example.com',
    nickname: '테스트유저',
    createdAt: new Date(),
  },
  {
    id: '2',
    email: 'demo@demo.com',
    nickname: '데모유저',
    avatarUrl: 'https://via.placeholder.com/100',
    createdAt: new Date(),
  },
]

// Mock 비밀번호 저장소 (실제로는 DB에서 해시된 비밀번호를 가져옴)
const mockPasswords: Record<string, string> = {}

// Mock 그룹 데이터
const mockGroups: Group[] = [
  {
    id: '1',
    name: '우리 가족',
    ownerId: '1',
    createdAt: new Date('2024-01-01'),
    memberCount: 2,
  },
  {
    id: '2',
    name: '회사 동료',
    ownerId: '2',
    createdAt: new Date('2024-01-15'),
    memberCount: 1,
  },
]

// Mock 그룹 멤버 데이터
const mockGroupMembers: GroupMember[] = [
  {
    groupId: '1',
    userId: '1',
    role: 'OWNER',
    joinedAt: new Date('2024-01-01'),
  },
  {
    groupId: '1',
    userId: '2',
    role: 'MEMBER',
    joinedAt: new Date('2024-01-02'),
  },
  {
    groupId: '2',
    userId: '2',
    role: 'OWNER',
    joinedAt: new Date('2024-01-15'),
  },
]

// Mock 초대 코드 저장소
const mockInviteCodes: Record<string, { groupId: string; expiresAt: Date; createdBy: string }> = {}

// Mock 데이터 초기화 함수
async function initializeMockData() {
  if (Object.keys(mockPasswords).length === 0) {
    // 기본 사용자들의 비밀번호 해시 생성
    mockPasswords['test@example.com'] = await hashPassword('password123')
    mockPasswords['demo@demo.com'] = await hashPassword('password123')
  }
}

// 즉시 초기화 실행
initializeMockData().catch(console.error)

// Mock 함수들 (DB 연결 후 실제 구현으로 교체)
export async function findUserByEmail(email: string): Promise<User | null> {
  const user = mockUsers.find((u) => u.email === email)
  return user || null
}

export async function findUserById(id: string): Promise<User | null> {
  const user = mockUsers.find((u) => u.id === id)
  return user || null
}

export async function createUser(userData: SignupData): Promise<User> {
  const hashedPassword = await hashPassword(userData.password)

  const newUser: User = {
    id: (mockUsers.length + 1).toString(),
    email: userData.email,
    nickname: userData.nickname,
    createdAt: new Date(),
  }

  // Mock 데이터에 추가
  mockUsers.push(newUser)
  mockPasswords[userData.email] = hashedPassword

  return newUser
}

export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  const hashedPassword = mockPasswords[email]
  if (!hashedPassword) return false

  return await verifyPassword(password, hashedPassword)
}

// 그룹 관련 Mock 함수들
export async function findGroupsByUserId(userId: string): Promise<GroupWithMembers[]> {
  const userGroups = mockGroupMembers
    .filter((member) => member.userId === userId)
    .map((member) => {
      const group = mockGroups.find((g) => g.id === member.groupId)
      if (!group) return null

      const groupMembers = mockGroupMembers
        .filter((gm) => gm.groupId === group.id)
        .map((gm) => ({
          ...gm,
          user: mockUsers.find((u) => u.id === gm.userId),
        }))

      const owner = mockUsers.find((u) => u.id === group.ownerId)

      return {
        ...group,
        members: groupMembers,
        owner,
        memberCount: groupMembers.length,
      }
    })
    .filter(Boolean) as GroupWithMembers[]

  return userGroups
}

export async function findGroupById(
  groupId: string,
  userId?: string
): Promise<GroupWithMembers | null> {
  const group = mockGroups.find((g) => g.id === groupId)
  if (!group) return null

  // 사용자가 지정된 경우 해당 그룹의 멤버인지 확인
  if (userId) {
    const isMember = mockGroupMembers.some(
      (member) => member.groupId === groupId && member.userId === userId
    )
    if (!isMember) return null
  }

  const groupMembers = mockGroupMembers
    .filter((gm) => gm.groupId === group.id)
    .map((gm) => ({
      ...gm,
      user: mockUsers.find((u) => u.id === gm.userId),
    }))

  const owner = mockUsers.find((u) => u.id === group.ownerId)

  return {
    ...group,
    members: groupMembers,
    owner,
    memberCount: groupMembers.length,
  }
}

export async function createGroup(data: CreateGroupData): Promise<Group> {
  const newGroup: Group = {
    id: (mockGroups.length + 1).toString(),
    name: data.name,
    ownerId: data.ownerId,
    createdAt: new Date(),
    memberCount: 1,
  }

  // Mock 데이터에 추가
  mockGroups.push(newGroup)

  // 소유자를 그룹 멤버로 추가
  const ownerMember: GroupMember = {
    groupId: newGroup.id,
    userId: data.ownerId,
    role: 'OWNER',
    joinedAt: new Date(),
  }
  mockGroupMembers.push(ownerMember)

  return newGroup
}

export async function generateInviteCode(
  groupId: string,
  createdBy: string
): Promise<InviteResponse> {
  const inviteCode = generateId(8) // 8자리 랜덤 코드
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7일 후 만료

  // Mock 저장소에 저장
  mockInviteCodes[inviteCode] = {
    groupId,
    expiresAt,
    createdBy,
  }

  const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/groups/join?code=${inviteCode}`

  return {
    inviteCode,
    inviteUrl,
    expiresAt,
  }
}

export async function validateInviteCode(
  inviteCode: string
): Promise<{ groupId: string; isValid: boolean }> {
  const invite = mockInviteCodes[inviteCode]

  if (!invite) {
    return { groupId: '', isValid: false }
  }

  const isExpired = new Date() > invite.expiresAt
  if (isExpired) {
    delete mockInviteCodes[inviteCode] // 만료된 코드 삭제
    return { groupId: invite.groupId, isValid: false }
  }

  return { groupId: invite.groupId, isValid: true }
}

export async function joinGroup(groupId: string, userId: string): Promise<boolean> {
  // 이미 멤버인지 확인
  const existingMember = mockGroupMembers.find(
    (member) => member.groupId === groupId && member.userId === userId
  )

  if (existingMember) {
    return false // 이미 멤버임
  }

  // 그룹이 존재하는지 확인
  const group = mockGroups.find((g) => g.id === groupId)
  if (!group) {
    return false
  }

  // 새 멤버 추가
  const newMember: GroupMember = {
    groupId,
    userId,
    role: 'MEMBER',
    joinedAt: new Date(),
  }
  mockGroupMembers.push(newMember)

  // 그룹 멤버 수 업데이트
  group.memberCount = (group.memberCount || 0) + 1

  return true
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const memberIndex = mockGroupMembers.findIndex(
    (member) => member.groupId === groupId && member.userId === userId
  )

  if (memberIndex === -1) {
    return false // 멤버가 아님
  }

  const member = mockGroupMembers[memberIndex]

  // 소유자는 탈퇴할 수 없음
  if (member.role === 'OWNER') {
    return false
  }

  // 멤버 제거
  mockGroupMembers.splice(memberIndex, 1)

  // 그룹 멤버 수 업데이트
  const group = mockGroups.find((g) => g.id === groupId)
  if (group) {
    group.memberCount = (group.memberCount || 1) - 1
  }

  return true
}

export async function updateGroupMemberRole(
  groupId: string,
  userId: string,
  newRole: 'ADMIN' | 'MEMBER'
): Promise<boolean> {
  const member = mockGroupMembers.find(
    (member) => member.groupId === groupId && member.userId === userId
  )

  if (!member || member.role === 'OWNER') {
    return false // 멤버가 없거나 소유자 역할은 변경 불가
  }

  member.role = newRole
  return true
}

// 헤더에서 토큰 추출
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
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
      const membership = mockGroupMembers.find(
        (member) => member.groupId === ownerId && member.userId === userId
      )

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
export function getGroupMemberRole(
  userId: string,
  groupId: string
): 'OWNER' | 'ADMIN' | 'MEMBER' | null {
  const membership = mockGroupMembers.find(
    (member) => member.groupId === groupId && member.userId === userId
  )
  return membership?.role || null
}

/**
 * 그룹 관리 권한 확인 (OWNER 또는 ADMIN)
 */
export function hasGroupManagementPermission(userId: string, groupId: string): boolean {
  const role = getGroupMemberRole(userId, groupId)
  return role === 'OWNER' || role === 'ADMIN'
}
