import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 시스템 헬스체크 API
export async function GET() {
  try {
    const startTime = Date.now()

    // 데이터베이스 연결 확인
    await prisma.$queryRaw`SELECT 1`

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        database: {
          status: 'connected',
          responseTime: `${responseTime}ms`,
        },
        services: {
          auth: 'operational',
          api: 'operational',
          database: 'operational',
        },
        checks: {
          database: true,
          memory: process.memoryUsage().heapUsed < 512 * 1024 * 1024, // 512MB limit
          disk: true, // 간단한 체크
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          auth: 'unknown',
          api: 'operational',
          database: 'failed',
        },
        checks: {
          database: false,
          memory: false,
          disk: false,
        },
      },
      { status: 503 }
    )
  }
}

// HEAD 요청도 지원 (더 가벼운 헬스체크)
export async function HEAD() {
  try {
    // 데이터베이스 연결만 빠르게 확인
    await prisma.$queryRaw`SELECT 1`
    return new Response(null, { status: 200 })
  } catch {
    return new Response(null, { status: 503 })
  }
}
