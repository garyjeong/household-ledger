/**
 * 공통 API 응답 유틸리티 함수들
 * 일관성 있고 최적화된 API 응답을 위한 헬퍼 함수들
 */

import { NextResponse } from 'next/server'

export interface ApiSuccessResponse<T = any> {
  data?: T
  [key: string]: any
}

export interface ApiErrorResponse {
  error: string
  code?: string
  details?: any
}

export interface ApiResponseOptions {
  status?: number
  includeDevInfo?: boolean
  devInfo?: Record<string, any>
}

/**
 * 성공 응답 생성 (프로덕션 최적화)
 */
export function createSuccessResponse<T>(data: T, options: ApiResponseOptions = {}): NextResponse {
  const { status = 200, includeDevInfo = false, devInfo = {} } = options

  const response: Record<string, any> = {
    ...(typeof data === 'object' && data !== null ? data : { data }),
  }

  // 개발 환경에서만 디버그 정보 포함
  if (
    process.env.NODE_ENV === 'development' &&
    (includeDevInfo || Object.keys(devInfo).length > 0)
  ) {
    response.dev = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...devInfo,
    }
  }

  return NextResponse.json(response, { status })
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  error: string,
  options: { status?: number; code?: string; details?: any } = {}
): NextResponse {
  const { status = 500, code, details } = options

  const response: ApiErrorResponse = {
    error,
    ...(code && { code }),
    ...(details && { details }),
  }

  // 개발 환경에서만 추가 디버그 정보
  if (process.env.NODE_ENV === 'development') {
    response.dev = {
      timestamp: new Date().toISOString(),
      stack: new Error().stack,
    }
  }

  return NextResponse.json(response, { status })
}

/**
 * 페이지네이션 응답 생성
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    hasMore: boolean
    nextCursor?: string | null
    prevCursor?: string | null
    totalCount?: number
    page?: number
    limit?: number
    totalPages?: number
  },
  options: ApiResponseOptions = {}
): NextResponse {
  const response = {
    data,
    pagination: {
      hasMore: pagination.hasMore,
      ...(pagination.nextCursor !== undefined && { nextCursor: pagination.nextCursor }),
      ...(pagination.prevCursor !== undefined && { prevCursor: pagination.prevCursor }),
      ...(pagination.totalCount !== undefined && { totalCount: pagination.totalCount }),
      ...(pagination.page !== undefined && { page: pagination.page }),
      ...(pagination.limit !== undefined && { limit: pagination.limit }),
      ...(pagination.totalPages !== undefined && { totalPages: pagination.totalPages }),
    },
  }

  return createSuccessResponse(response, options)
}

/**
 * 리스트 응답 생성
 */
export function createListResponse<T>(
  items: T[],
  options: ApiResponseOptions & {
    key?: string
    includeCount?: boolean
  } = {}
): NextResponse {
  const { key = 'items', includeCount = false, ...responseOptions } = options

  const response: Record<string, any> = {
    [key]: items,
  }

  // 개발 환경이거나 명시적으로 요청한 경우에만 count 포함
  if (includeCount || process.env.NODE_ENV === 'development') {
    response.count = items.length
  }

  return createSuccessResponse(response, responseOptions)
}

/**
 * 리소스 생성 응답
 */
export function createResourceResponse<T>(
  resource: T,
  options: ApiResponseOptions & {
    key?: string
    message?: string
  } = {}
): NextResponse {
  const { key = 'resource', message, ...responseOptions } = options

  const response: Record<string, any> = {
    [key]: resource,
  }

  // 개발 환경에서만 메시지 포함
  if (message && process.env.NODE_ENV === 'development') {
    response.message = message
  }

  return createSuccessResponse(response, {
    status: 201,
    ...responseOptions,
  })
}

/**
 * 일반적인 HTTP 에러 응답들
 */
export const ApiErrors = {
  unauthorized: (message = '인증이 필요합니다') =>
    createErrorResponse(message, { status: 401, code: 'AUTH_REQUIRED' }),

  forbidden: (message = '권한이 없습니다') =>
    createErrorResponse(message, { status: 403, code: 'FORBIDDEN' }),

  notFound: (message = '리소스를 찾을 수 없습니다') =>
    createErrorResponse(message, { status: 404, code: 'NOT_FOUND' }),

  conflict: (message = '중복된 요청입니다') =>
    createErrorResponse(message, { status: 409, code: 'CONFLICT' }),

  validationError: (message = '잘못된 요청입니다', details?: any) =>
    createErrorResponse(message, { status: 400, code: 'VALIDATION_ERROR', details }),

  serverError: (message = '서버 오류가 발생했습니다') =>
    createErrorResponse(message, { status: 500, code: 'INTERNAL_ERROR' }),
}
