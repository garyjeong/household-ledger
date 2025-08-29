/**
 * 시스템 헬스체크 API
 * 시스템 상태, 데이터베이스 연결, 외부 서비스 상태 등을 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    database: HealthCheck
    memory: HealthCheck
    disk?: HealthCheck
    externalServices: {
      exchangeRateApi: HealthCheck
    }
  }
  performance: {
    responseTime: number
    cpuUsage?: number
    memoryUsage: {
      used: number
      free: number
      total: number
      percentage: number
    }
  }
}

interface HealthCheck {
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  error?: string
  lastChecked: string
  details?: Record<string, any>
}

// 데이터베이스 상태 확인
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    // 간단한 쿼리로 DB 연결 확인
    await prisma.$queryRaw`SELECT 1`

    const responseTime = Date.now() - start

    return {
      status: responseTime < 1000 ? 'up' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        connectionPool: 'active',
        queryTime: `${responseTime}ms`,
      },
    }
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message,
      lastChecked: new Date().toISOString(),
    }
  }
}

// 메모리 사용량 확인
function checkMemory(): HealthCheck {
  const memoryUsage = process.memoryUsage()
  const totalMemory = memoryUsage.heapTotal
  const usedMemory = memoryUsage.heapUsed
  const freeMemory = totalMemory - usedMemory
  const memoryPercentage = (usedMemory / totalMemory) * 100

  return {
    status: memoryPercentage < 80 ? 'up' : memoryPercentage < 90 ? 'degraded' : 'down',
    lastChecked: new Date().toISOString(),
    details: {
      used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
      total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
      percentage: `${memoryPercentage.toFixed(1)}%`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    },
  }
}

// 외부 환율 API 상태 확인
async function checkExchangeRateApi(): Promise<HealthCheck> {
  const start = Date.now()

  try {
    const response = await fetch('https://api.exchangerate.host/latest?base=USD', {
      method: 'GET',
      headers: {
        'User-Agent': 'HouseholdLedger/1.0',
      },
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    })

    const responseTime = Date.now() - start

    if (!response.ok) {
      return {
        status: 'down',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        lastChecked: new Date().toISOString(),
      }
    }

    const data = await response.json()

    return {
      status: responseTime < 3000 ? 'up' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        base: data.base,
        date: data.date,
        ratesCount: Object.keys(data.rates || {}).length,
      },
    }
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message,
      lastChecked: new Date().toISOString(),
    }
  }
}

// 전체 시스템 상태 결정
function determineOverallStatus(checks: HealthCheckResult['checks']): HealthCheckResult['status'] {
  const allChecks = [checks.database, checks.memory, checks.externalServices.exchangeRateApi]

  if (allChecks.some(check => check.status === 'down')) {
    return 'unhealthy'
  }

  if (allChecks.some(check => check.status === 'degraded')) {
    return 'degraded'
  }

  return 'healthy'
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // URL 파라미터에서 상세 정보 요청 여부 확인
    const url = new URL(request.url)
    const includeDetails = url.searchParams.get('details') === 'true'

    // 병렬로 모든 헬스체크 실행
    const [databaseCheck, exchangeRateCheck] = await Promise.all([
      checkDatabase(),
      checkExchangeRateApi(),
    ])

    const memoryCheck = checkMemory()

    const checks = {
      database: databaseCheck,
      memory: memoryCheck,
      externalServices: {
        exchangeRateApi: exchangeRateCheck,
      },
    }

    const memoryUsage = process.memoryUsage()

    const healthResult: HealthCheckResult = {
      status: determineOverallStatus(checks),
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      performance: {
        responseTime: Date.now() - startTime,
        memoryUsage: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          free: Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          percentage: Number(((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1)),
        },
      },
    }

    // 상태에 따른 HTTP 상태 코드 설정
    const statusCode =
      healthResult.status === 'healthy' ? 200 : healthResult.status === 'degraded' ? 207 : 503

    // 간단한 응답 (모니터링 도구용)
    if (!includeDetails) {
      return NextResponse.json(
        {
          status: healthResult.status,
          timestamp: healthResult.timestamp,
          uptime: healthResult.uptime,
        },
        { status: statusCode }
      )
    }

    // 상세한 응답
    return NextResponse.json(healthResult, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Version': '1.0',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    })
  } catch (error: any) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check system failure',
        details: error.message,
      },
      { status: 503 }
    )
  }
}

// HEAD 요청 지원 (간단한 ping 확인용)
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
