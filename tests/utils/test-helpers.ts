import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import type { JWTPayload, User, Group, GroupMember } from '@/lib/auth'

// Mock JWT 토큰 생성 (테스트용)
export function createMockToken(payload: JWTPayload): string {
  return jwt.sign(payload, 'test-secret', { expiresIn: '1h' })
}

// Mock 사용자 데이터 (테스트용)
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'smat91@naver.com',
    nickname: 'Gary',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'demo@demo.com',
    nickname: '데모유저',
    avatarUrl: 'https://via.placeholder.com/100',
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    email: 'admin@example.com',
    nickname: '관리자',
    createdAt: new Date('2024-01-03'),
  },
]

// Mock 그룹 데이터
export const mockGroups: Group[] = [
  {
    id: '1',
    name: '테스트 그룹',
    ownerId: '1',
    createdAt: new Date('2024-01-01'),
    memberCount: 2,
  },
  {
    id: '2',
    name: '데모 그룹',
    ownerId: '2',
    createdAt: new Date('2024-01-15'),
    memberCount: 1,
  },
]

// Mock 그룹 멤버 데이터
export const mockGroupMembers: GroupMember[] = [
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

// HTTP 응답 헬퍼
export interface MockResponse {
  status: number
  body: Record<string, unknown>
  headers?: Record<string, string>
}

export function createMockResponse(data: MockResponse) {
  return {
    status: data.status,
    json: () => Promise.resolve(data.body),
    headers: new Map(Object.entries(data.headers || {})),
  }
}

// 쿠키 헬퍼
export function createMockCookies(tokens?: { accessToken?: string; refreshToken?: string }) {
  const cookiesMap = new Map()

  if (tokens?.accessToken) {
    cookiesMap.set('accessToken', { value: tokens.accessToken })
  }
  if (tokens?.refreshToken) {
    cookiesMap.set('refreshToken', { value: tokens.refreshToken })
  }

  return {
    get: (name: string) => cookiesMap.get(name),
    set: jest.fn(),
    delete: jest.fn(),
  }
}

// 테스트용 NextRequest Mock
export function createMockRequest(options: {
  method?: string
  body?: unknown
  cookies?: { accessToken?: string; refreshToken?: string }
  headers?: Record<string, string>
  url?: string
}) {
  const { method = 'GET', body, cookies, headers = {}, url = 'http://localhost:3000' } = options

  // URL이 상대 경로인 경우 baseURL을 앞에 붙임
  const fullUrl = url.startsWith('/') ? `http://localhost:3000${url}` : url

  const mockRequest = {
    method,
    url: fullUrl,
    nextUrl: new URL(fullUrl),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    cookies: createMockCookies(cookies),
    headers: new Map(Object.entries(headers)),
    // NextRequest의 필수 속성들 추가
    page: undefined,
    ua: undefined,
    cache: 'default' as const,
    credentials: 'same-origin' as const,
    destination: '' as const,
    integrity: '',
    keepalive: false,
    mode: 'cors' as const,
    redirect: 'follow' as const,
    referrer: '',
    referrerPolicy: '' as const,
    signal: new AbortController().signal,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    clone: () => mockRequest,
  }

  return mockRequest as unknown as NextRequest
}

// 테스트 케이스 헬퍼
export interface TestCase {
  name: string
  input: Record<string, unknown>
  expected: Record<string, unknown>
  setup?: () => void | Promise<void>
  cleanup?: () => void | Promise<void>
}

export function runTestCases(
  testCases: TestCase[],
  testFn: (testCase: TestCase) => void | Promise<void>
) {
  testCases.forEach(testCase => {
    it(testCase.name, async () => {
      if (testCase.setup) {
        await testCase.setup()
      }

      try {
        await testFn(testCase)
      } finally {
        if (testCase.cleanup) {
          await testCase.cleanup()
        }
      }
    })
  })
}

// API 테스트 헬퍼
export function expectApiSuccess(
  response: { status: number; body: Record<string, unknown> },
  expectedStatus = 200
) {
  expect(response.status).toBe(expectedStatus)
  expect(response.body).toHaveProperty('success', true)
}

export async function expectApiError(
  response: Response,
  expectedStatus: number,
  expectedError?: string
) {
  expect(response.status).toBe(expectedStatus)
  const body = await response.json()
  expect(body).toHaveProperty('error')
  if (expectedError) {
    expect(body.error).toContain(expectedError)
  }
}

// 비동기 테스트 헬퍼
export function expectAsync(promise: Promise<unknown>) {
  return {
    toResolve: async () => {
      await expect(promise).resolves.toBeDefined()
    },
    toReject: async (expectedError?: string) => {
      if (expectedError) {
        await expect(promise).rejects.toThrow(expectedError)
      } else {
        await expect(promise).rejects.toThrow()
      }
    },
  }
}
