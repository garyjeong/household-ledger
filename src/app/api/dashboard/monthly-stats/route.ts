/**
 * 월별 통계 API
 * 대시보드에 표시할 월별 수입/지출 통계를 제공
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인 - Auth API와 동일한 방식 사용
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        {
          error: '로그인이 필요합니다',
          code: 'AUTH_REQUIRED',
          message: 'Authentication token is required',
        },
        { status: 401 }
      )
    }

    const user = verifyAccessToken(accessToken)
    if (!user) {
      return NextResponse.json(
        {
          error: '유효하지 않은 토큰입니다',
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
        { status: 401 }
      )
    }

    // URL에서 기간 파라미터 추출
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || new Date().toISOString().slice(0, 7) // YYYY-MM 형식
    const groupId = url.searchParams.get('groupId')

    // 기간 파싱
    const [year, month] = period.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // 그룹 필터 설정
    let groupFilter = {}
    if (groupId) {
      groupFilter = {
        OR: [{ groupId: BigInt(groupId) }, { ownerUserId: parseInt(user.userId) }],
      }
    } else {
      groupFilter = {
        OR: [{ groupId: null }, { ownerUserId: parseInt(user.userId) }],
      }
    }

    // 성능 최적화: 병렬로 모든 통계 데이터 조회
    const [
      totalIncomeResult,
      totalExpenseResult,
      transactionCount,
      myExpenseResult,
      sharedExpenseResult,
      partnerExpenseResult,
      categoryStats,
      dailyTrend,
    ] = await Promise.all([
      // 총 수입 집계
      prisma.transaction.aggregate({
        where: {
          ...groupFilter,
          date: { gte: startDate, lte: endDate },
          type: 'INCOME',
        },
        _sum: { amount: true },
      }),
      // 총 지출 집계
      prisma.transaction.aggregate({
        where: {
          ...groupFilter,
          date: { gte: startDate, lte: endDate },
          type: 'EXPENSE',
        },
        _sum: { amount: true },
      }),
      // 거래 건수
      prisma.transaction.count({
        where: {
          ...groupFilter,
          date: { gte: startDate, lte: endDate },
        },
      }),
      // 내 지출
      prisma.transaction.aggregate({
        where: {
          ...groupFilter,
          date: { gte: startDate, lte: endDate },
          type: 'EXPENSE',
          ownerUserId: parseInt(user.userId),
        },
        _sum: { amount: true },
      }),
      // 공유 지출 (그룹 거래)
      prisma.transaction.aggregate({
        where: {
          ...groupFilter,
          date: { gte: startDate, lte: endDate },
          type: 'EXPENSE',
          groupId: { not: null },
        },
        _sum: { amount: true },
      }),
      // 배우자 지출 (그룹 내 다른 사용자)
      prisma.transaction.aggregate({
        where: {
          ...groupFilter,
          date: { gte: startDate, lte: endDate },
          type: 'EXPENSE',
          ownerUserId: { not: parseInt(user.userId) },
          groupId: null,
        },
        _sum: { amount: true },
      }),
      // 카테고리별 지출 통계 (상위 5개만)
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          ...groupFilter,
          date: { gte: startDate, lte: endDate },
          type: 'EXPENSE',
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
      // 일별 트렌드 데이터
      prisma.transaction.groupBy({
        by: ['date'],
        where: {
          ...groupFilter,
          date: { gte: startDate, lte: endDate },
          type: 'EXPENSE',
        },
        _sum: { amount: true },
        orderBy: { date: 'asc' },
      }),
    ])

    // 데이터 변환
    const totalIncome = Number(totalIncomeResult._sum.amount || 0)
    const totalExpense = Number(totalExpenseResult._sum.amount || 0)
    const myExpense = Number(myExpenseResult._sum.amount || 0)
    const sharedExpense = Number(sharedExpenseResult._sum.amount || 0)
    const partnerExpense = Number(partnerExpenseResult._sum.amount || 0)

    // 카테고리 정보 조회
    const categoryIds = categoryStats.map(stat => stat.categoryId).filter(Boolean)
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    })

    const categoryMap = new Map(categories.map(cat => [cat.id, cat]))
    const topCategories = categoryStats.map(stat => ({
      categoryId: stat.categoryId?.toString() || 'unknown',
      categoryName: stat.categoryId ? categoryMap.get(stat.categoryId)?.name || '기타' : '기타',
      categoryColor: stat.categoryId
        ? categoryMap.get(stat.categoryId)?.color || '#8B5CF6'
        : '#8B5CF6',
      totalAmount: Number(stat._sum.amount || 0),
      percentage:
        totalExpense > 0
          ? Number(((Number(stat._sum.amount || 0) / totalExpense) * 100).toFixed(1))
          : 0,
    }))

    // 일별 트렌드 데이터 포맷
    const dailyTrendFormatted = dailyTrend.map(day => ({
      date: day.date.toISOString().split('T')[0],
      amount: Number(day._sum.amount || 0),
    }))

    // 최종 응답 데이터
    const monthlyStats = {
      summary: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        transactionCount,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      },
      breakdown: {
        myExpense,
        partnerExpense,
        sharedExpense,
      },
      categories: topCategories,
      dailyTrend: dailyTrendFormatted,
      budgetComparison: [], // 실제로는 예산 테이블과 조인 필요
    }

    return NextResponse.json({
      success: true,
      data: monthlyStats,
    })
  } catch (error) {
    console.error('Monthly stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
