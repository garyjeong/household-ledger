/**
 * 가족 초대 API 테스트
 * - API endpoint를 통한 그룹 참여 테스트
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { POST } from '@/app/api/groups/join/route'

// Mock the auth functions
jest.mock('@/lib/auth', () => ({
  verifyAccessToken: jest.fn(),
  validateInviteCode: jest.fn(),
  joinGroup: jest.fn(),
  findGroupById: jest.fn(),
}))

// Mock NextRequest and NextResponse
const mockRequest = (body: any, cookies: Record<string, string> = {}) => {
  const request = {
    json: async () => body,
    cookies: {
      get: (name: string) => ({ value: cookies[name] }),
    },
  } as any

  return request
}

describe('초대 API 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('유효한 초대 코드로 그룹 참여에 성공해야 한다', async () => {
    // Arrange
    const { verifyAccessToken, validateInviteCode, joinGroup, findGroupById } = await import(
      '@/lib/auth'
    )

    ;(verifyAccessToken as jest.Mock).mockReturnValue({ userId: '1' })
    ;(validateInviteCode as jest.Mock).mockResolvedValue({
      groupId: '2',
      isValid: true,
    })
    ;(joinGroup as jest.Mock).mockResolvedValue(true)
    ;(findGroupById as jest.Mock).mockResolvedValue({
      id: '2',
      name: '김가네 가계부',
    })

    const request = mockRequest({ inviteCode: 'ABCD1234EF' }, { accessToken: 'valid-token' })

    // Act
    const response = await POST(request)
    const result = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.group.name).toBe('김가네 가계부')
    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token')
    expect(validateInviteCode).toHaveBeenCalledWith('ABCD1234EF')
    expect(joinGroup).toHaveBeenCalledWith('2', '1')
  })

  it('인증 토큰이 없으면 401 오류를 반환해야 한다', async () => {
    // Arrange
    const request = mockRequest({ inviteCode: 'ABCD1234EF' })

    // Act
    const response = await POST(request)
    const result = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(result.error).toBe('인증이 필요합니다.')
  })

  it('유효하지 않은 초대 코드로 400 오류를 반환해야 한다', async () => {
    // Arrange
    const { verifyAccessToken, validateInviteCode } = await import('@/lib/auth')

    ;(verifyAccessToken as jest.Mock).mockReturnValue({ userId: '1' })
    ;(validateInviteCode as jest.Mock).mockResolvedValue({
      groupId: '',
      isValid: false,
    })

    const request = mockRequest({ inviteCode: 'INVALID123' }, { accessToken: 'valid-token' })

    // Act
    const response = await POST(request)
    const result = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(result.error).toContain('유효하지 않거나 만료된')
  })

  it('빈 초대 코드로 400 오류를 반환해야 한다', async () => {
    // Arrange
    const { verifyAccessToken } = await import('@/lib/auth')

    ;(verifyAccessToken as jest.Mock).mockReturnValue({ userId: '1' })

    const request = mockRequest({ inviteCode: '' }, { accessToken: 'valid-token' })

    // Act
    const response = await POST(request)
    const result = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(result.error).toContain('초대 코드를 입력해주세요')
  })

  it('그룹 참여에 실패하면 400 오류를 반환해야 한다', async () => {
    // Arrange
    const { verifyAccessToken, validateInviteCode, joinGroup } = await import('@/lib/auth')

    ;(verifyAccessToken as jest.Mock).mockReturnValue({ userId: '1' })
    ;(validateInviteCode as jest.Mock).mockResolvedValue({
      groupId: '2',
      isValid: true,
    })
    ;(joinGroup as jest.Mock).mockResolvedValue(false)

    const request = mockRequest({ inviteCode: 'ABCD1234EF' }, { accessToken: 'valid-token' })

    // Act
    const response = await POST(request)
    const result = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(result.error).toContain('이미 그룹에 참여했거나')
  })
})
