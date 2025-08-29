/**
 * 시스템 메트릭스 수집 API
 * 성능 지표, 사용량 통계, 에러율 등을 수집하여 모니터링 대시보드에 제공
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'

interface SystemMetrics {
  timestamp: string
  performance: {
    responseTime: {
      average: number
      p95: number
      p99: number
    }
    throughput: {
      requestsPerMinute: number
      requestsPerHour: number
    }
    errorRate: {
      percentage: number
      total: number
      byCategory: Record<string, number>
    }
  }
  database: {
    activeConnections: number
    queryTime: {
      average: number
      slow: number // > 1초
    }
    transactions: {
      total: number
      successful: number
      failed: number
    }
  }
  users: {
    activeUsers: {
      last24h: number
      last7d: number
      last30d: number
    }
    newRegistrations: {
      today: number
      thisWeek: number
      thisMonth: number
    }
  }
  business: {
    transactions: {
      total: number
      totalAmount: number
      avgAmount: number
      byType: {
        income: number
        expense: number
        transfer: number
      }
    }
    categories: {
      total: number
      mostUsed: Array<{
        name: string
        count: number
      }>
    }
    groups: {
      total: number
      active: number
      avgMembersPerGroup: number
    }
  }
}

// 성능 메트릭스 수집 (실제로는 별도 로깅 시스템에서 가져와야 함)
async function getPerformanceMetrics(): Promise<SystemMetrics['performance']> {
  // 실제 구현에서는 로그 분석이나 APM 도구에서 데이터를 가져와야 함
  // 여기서는 임시 데이터 반환
  return {
    responseTime: {
      average: 150,
      p95: 350,
      p99: 800,
    },
    throughput: {
      requestsPerMinute: 45,
      requestsPerHour: 2700,
    },
    errorRate: {
      percentage: 2.3,
      total: 23,
      byCategory: {
        network: 8,
        auth: 5,
        validation: 6,
        api: 4,
      },
    },
  }
}

// 데이터베이스 메트릭스 수집
async function getDatabaseMetrics(): Promise<SystemMetrics['database']> {
  try {
    // 실제 데이터베이스 연결 풀 상태 확인 (Prisma 메트릭스)
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const queryTime = Date.now() - startTime

    return {
      activeConnections: 5, // 실제로는 연결 풀에서 가져와야 함
      queryTime: {
        average: queryTime,
        slow: 0, // 1초 이상 쿼리 개수
      },
      transactions: {
        total: 100,
        successful: 98,
        failed: 2,
      },
    }
  } catch (error) {
    return {
      activeConnections: 0,
      queryTime: {
        average: 0,
        slow: 0,
      },
      transactions: {
        total: 0,
        successful: 0,
        failed: 1,
      },
    }
  }
}

// 사용자 메트릭스 수집
async function getUserMetrics(): Promise<SystemMetrics['users']> {
  try {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [users24h, users7d, users30d, newToday, newThisWeek, newThisMonth] = await Promise.all([
      // 활성 사용자 (마지막 로그인 기준, 실제로는 세션 테이블에서 가져와야 함)
      prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: monthAgo,
          },
        },
      }),
      // 신규 가입자
      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: thisWeekStart,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: thisMonthStart,
          },
        },
      }),
    ])

    return {
      activeUsers: {
        last24h: users24h,
        last7d: users7d,
        last30d: users30d,
      },
      newRegistrations: {
        today: newToday,
        thisWeek: newThisWeek,
        thisMonth: newThisMonth,
      },
    }
  } catch (error) {
    console.error('Failed to get user metrics:', error)
    return {
      activeUsers: {
        last24h: 0,
        last7d: 0,
        last30d: 0,
      },
      newRegistrations: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      },
    }
  }
}

// 비즈니스 메트릭스 수집
async function getBusinessMetrics(): Promise<SystemMetrics['business']> {
  try {
    const [transactionStats, categoryStats, groupStats, topCategories] = await Promise.all([
      // 거래 통계
      prisma.transaction.aggregate({
        _count: { id: true },
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      // 카테고리 통계
      prisma.category.count(),
      // 그룹 통계
      Promise.all([
        prisma.group.count(),
        prisma.groupMember.groupBy({
          by: ['groupId'],
          _count: { userId: true },
        }),
      ]),
      // 가장 많이 사용된 카테고리
      prisma.transaction.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5,
        where: {
          categoryId: { not: null },
        },
      }),
    ])

    // 거래 유형별 통계
    const [incomeCount, expenseCount, transferCount] = await Promise.all([
      prisma.transaction.count({ where: { type: 'INCOME' } }),
      prisma.transaction.count({ where: { type: 'EXPENSE' } }),
      prisma.transaction.count({ where: { type: 'TRANSFER' } }),
    ])

    // 카테고리 이름 가져오기
    const categoryIds = topCategories.map(cat => cat.categoryId).filter(Boolean)
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    })

    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]))

    const [totalGroups, groupMembers] = groupStats
    const avgMembersPerGroup =
      groupMembers.length > 0
        ? groupMembers.reduce((sum, g) => sum + g._count.userId, 0) / groupMembers.length
        : 0

    return {
      transactions: {
        total: transactionStats._count.id,
        totalAmount: Number(transactionStats._sum.amount || 0),
        avgAmount: Number(transactionStats._avg.amount || 0),
        byType: {
          income: incomeCount,
          expense: expenseCount,
          transfer: transferCount,
        },
      },
      categories: {
        total: categoryStats,
        mostUsed: topCategories.map(cat => ({
          name: cat.categoryId ? categoryMap.get(cat.categoryId) || 'Unknown' : 'Unknown',
          count: cat._count.categoryId,
        })),
      },
      groups: {
        total: totalGroups,
        active: groupMembers.length,
        avgMembersPerGroup: Number(avgMembersPerGroup.toFixed(1)),
      },
    }
  } catch (error) {
    console.error('Failed to get business metrics:', error)
    return {
      transactions: {
        total: 0,
        totalAmount: 0,
        avgAmount: 0,
        byType: {
          income: 0,
          expense: 0,
          transfer: 0,
        },
      },
      categories: {
        total: 0,
        mostUsed: [],
      },
      groups: {
        total: 0,
        active: 0,
        avgMembersPerGroup: 0,
      },
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인 (실제로는 별도 인증 시스템 필요)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const user = verifyAccessToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // URL 파라미터 확인
    const url = new URL(request.url)
    const category = url.searchParams.get('category') // 'performance', 'database', 'users', 'business'

    const startTime = Date.now()

    if (category) {
      // 특정 카테고리만 요청
      let metrics: any

      switch (category) {
        case 'performance':
          metrics = await getPerformanceMetrics()
          break
        case 'database':
          metrics = await getDatabaseMetrics()
          break
        case 'users':
          metrics = await getUserMetrics()
          break
        case 'business':
          metrics = await getBusinessMetrics()
          break
        default:
          return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        category,
        data: metrics,
        responseTime: Date.now() - startTime,
      })
    }

    // 전체 메트릭스 수집
    const [performance, database, users, business] = await Promise.all([
      getPerformanceMetrics(),
      getDatabaseMetrics(),
      getUserMetrics(),
      getBusinessMetrics(),
    ])

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      performance,
      database,
      users,
      business,
    }

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Metrics-Version': '1.0',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    })
  } catch (error: any) {
    console.error('Metrics collection failed:', error)

    return NextResponse.json(
      {
        error: 'Metrics collection failure',
        timestamp: new Date().toISOString(),
        details: error.message,
      },
      { status: 500 }
    )
  }
}
