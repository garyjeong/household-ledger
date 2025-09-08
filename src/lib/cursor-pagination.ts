/**
 * 🔄 커서 기반 페이지네이션 유틸리티
 * 대량 데이터 처리 시 성능 최적화를 위한 커서 페이지네이션 구현
 */

import { safeConsole } from './security-utils'

export interface CursorPaginationParams {
  cursor?: string // 다음 페이지 시작점 (base64 인코딩된 ID)
  limit?: number // 페이지 크기 (기본: 20, 최대: 100)
  direction?: 'forward' | 'backward' // 페이지 방향
}

export interface CursorPaginationResult<T> {
  data: T[]
  pagination: {
    hasNext: boolean
    hasPrev: boolean
    nextCursor: string | null
    prevCursor: string | null
    limit: number
    totalEstimate?: number // 정확한 총 개수는 성능상 비추천
  }
  performance: {
    queryTime: number
    itemsReturned: number
    cursorUsed: boolean
  }
}

/**
 * 커서 인코딩/디코딩 유틸리티
 */
export class CursorUtils {
  /**
   * ID를 커서로 인코딩 (base64)
   */
  static encode(id: string | number | bigint): string {
    const idStr = typeof id === 'bigint' ? id.toString() : String(id)
    return Buffer.from(idStr).toString('base64')
  }

  /**
   * 커서를 ID로 디코딩
   */
  static decode(cursor: string): string {
    try {
      return Buffer.from(cursor, 'base64').toString('utf-8')
    } catch (error) {
      safeConsole.warn('Invalid cursor format', { cursor })
      throw new Error('유효하지 않은 커서 형식입니다')
    }
  }

  /**
   * 커서 유효성 검증
   */
  static isValid(cursor: string): boolean {
    try {
      const decoded = this.decode(cursor)
      return /^\d+$/.test(decoded) // 숫자만 허용
    } catch {
      return false
    }
  }
}

/**
 * Prisma를 위한 커서 페이지네이션 헬퍼
 */
export class PrismaCursorPagination {
  /**
   * 거래 내역 페이지네이션
   */
  static async getTransactions(
    prisma: any,
    params: CursorPaginationParams & {
      userId: string
      groupId?: string
      filters?: any
    }
  ): Promise<CursorPaginationResult<any>> {
    const startTime = Date.now()
    const { cursor, limit = 20, direction = 'forward', userId, groupId, filters = {} } = params

    // 파라미터 검증
    const safeLimit = Math.min(Math.max(1, limit), 100) // 1-100 범위로 제한

    let cursorId: string | undefined
    if (cursor) {
      if (!CursorUtils.isValid(cursor)) {
        throw new Error('유효하지 않은 커서입니다')
      }
      cursorId = CursorUtils.decode(cursor)
    }

    // 기본 where 조건
    const baseWhere = {
      ...filters,
      ownerUserId: BigInt(userId),
      ...(groupId && { groupId: BigInt(groupId) }),
    }

    // 커서 기반 where 조건 추가
    const whereWithCursor = cursorId
      ? {
          ...baseWhere,
          id:
            direction === 'forward'
              ? { lt: BigInt(cursorId) } // 최신순이므로 ID가 작은 것들
              : { gt: BigInt(cursorId) },
        }
      : baseWhere

    try {
      // 📄 데이터 조회 (limit + 1로 다음 페이지 존재 여부 확인)
      const transactions = await prisma.transaction.findMany({
        where: whereWithCursor,
        include: {
          category: {
            select: { id: true, name: true, color: true, type: true },
          },
          tag: {
            select: { id: true, name: true },
          },
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' },
          { id: 'desc' }, // 커서 정렬을 위해 id도 포함
        ],
        take: safeLimit + 1, // +1로 다음 페이지 존재 확인
      })

      // 실제 데이터와 다음 페이지 여부 분리
      const hasNext = transactions.length > safeLimit
      const data = hasNext ? transactions.slice(0, -1) : transactions

      // 커서 생성
      const nextCursor =
        hasNext && data.length > 0 ? CursorUtils.encode(data[data.length - 1].id.toString()) : null

      const prevCursor =
        data.length > 0 && cursorId ? CursorUtils.encode(data[0].id.toString()) : null

      // 🔄 이전 페이지 존재 여부 확인 (별도 쿼리로 최소화)
      let hasPrev = false
      if (cursorId) {
        const prevCount = await prisma.transaction.count({
          where: {
            ...baseWhere,
            id: { gt: BigInt(cursorId) },
          },
          take: 1, // 존재 여부만 확인
        })
        hasPrev = prevCount > 0
      }

      const queryTime = Date.now() - startTime

      const result: CursorPaginationResult<any> = {
        data,
        pagination: {
          hasNext,
          hasPrev,
          nextCursor,
          prevCursor,
          limit: safeLimit,
        },
        performance: {
          queryTime,
          itemsReturned: data.length,
          cursorUsed: !!cursor,
        },
      }

      // 성능 로깅 - 비활성화
      // safeConsole.log('커서 페이지네이션 조회 완료', {
      //   userId,
      //   queryTime,
      //   itemsReturned: data.length,
      //   hasNext,
      //   hasPrev,
      //   cursorUsed: !!cursor,
      // })

      return result
    } catch (error) {
      const queryTime = Date.now() - startTime

      safeConsole.error('커서 페이지네이션 조회 실패', error, {
        userId,
        queryTime,
        cursor,
        limit: safeLimit,
      })

      throw error
    }
  }

  /**
   * 통계용 총 개수 조회 (선택적)
   * 주의: 대량 데이터에서는 성능 저하 가능성
   */
  static async getTotalCount(
    prisma: any,
    where: any,
    options: {
      enableCount?: boolean // 기본: false (성능상 권장하지 않음)
      maxCountLimit?: number // 최대 카운트 제한 (기본: 10000)
    } = {}
  ): Promise<number | null> {
    const { enableCount = false, maxCountLimit = 10000 } = options

    if (!enableCount) {
      return null // 성능상 카운트하지 않음
    }

    try {
      // 제한된 카운트만 수행 (성능 보호)
      const count = await prisma.transaction.count({
        where,
        take: maxCountLimit,
      })

      return Math.min(count, maxCountLimit)
    } catch (error) {
      safeConsole.warn('총 개수 조회 실패', error)
      return null
    }
  }
}

/**
 * 레거시 오프셋 페이지네이션 → 커서 페이지네이션 변환 헬퍼
 */
export class PaginationMigrationHelper {
  /**
   * 기존 page/limit 파라미터를 커서로 변환
   * 호환성을 위해 제공하지만, 직접 커서 사용을 권장
   */
  static convertLegacyParams(params: { page?: number; limit?: number }): CursorPaginationParams {
    safeConsole.warn('레거시 페이지네이션 사용 감지', {
      recommendation: '성능 향상을 위해 cursor 기반 페이지네이션 사용을 권장합니다',
      params,
    })

    return {
      cursor: undefined, // 첫 페이지부터 시작
      limit: params.limit || 20,
      direction: 'forward',
    }
  }

  /**
   * 커서 페이지네이션 결과를 레거시 형식으로 변환
   */
  static toLegacyFormat<T>(
    result: CursorPaginationResult<T>,
    currentPage: number = 1
  ): {
    data: T[]
    pagination: {
      page: number
      limit: number
      hasNext: boolean
      hasPrev: boolean
      // totalCount는 성능상 제공하지 않음
    }
  } {
    return {
      data: result.data,
      pagination: {
        page: currentPage,
        limit: result.pagination.limit,
        hasNext: result.pagination.hasNext,
        hasPrev: result.pagination.hasPrev,
      },
    }
  }
}

/**
 * 커서 페이지네이션 성능 최적화 팁
 *
 * 1. 인덱스 설정:
 *    - (date DESC, createdAt DESC, id DESC) 복합 인덱스 필수
 *    - 필터 조건에 따른 추가 인덱스 고려
 *
 * 2. 쿼리 최적화:
 *    - take: limit + 1로 다음 페이지 존재 여부만 확인
 *    - 총 개수는 성능상 계산하지 않음 (선택적)
 *    - WHERE 조건 최소화
 *
 * 3. 사용법:
 *    - 첫 페이지: cursor 없이 호출
 *    - 다음 페이지: nextCursor 사용
 *    - 이전 페이지: prevCursor + direction: 'backward'
 *
 * 4. 장점:
 *    - 일정한 성능 (O(1) 시간 복잡도)
 *    - 실시간 데이터 변경에 안정적
 *    - 깊은 페이지에서도 빠른 성능
 *
 * 5. 제한사항:
 *    - 임의 페이지 접근 불가 (순차 탐색만)
 *    - 총 개수 정보 제한적
 *    - 정렬 기준이 고정적
 */
