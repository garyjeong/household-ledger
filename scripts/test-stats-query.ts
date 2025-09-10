/**
 * 통계 쿼리 직접 테스트 스크립트
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testStatsQuery() {
  try {
    console.log('🔍 통계 쿼리 직접 테스트 시작...')

    // 기본 정보 확인
    const startDate = new Date(2025, 8, 1) // 2025년 9월 1일
    const endDate = new Date(2025, 8, 30, 23, 59, 59) // 2025년 9월 30일
    const userIdInt = 4
    const groupIdBigInt = BigInt(4)

    console.log('📅 날짜 범위:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      userIdInt,
      groupIdBigInt: groupIdBigInt.toString(),
    })

    // 1. 기본 거래 조회
    console.log('\n1️⃣ 기본 거래 데이터 확인:')
    const basicTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        groupId: groupIdBigInt,
      },
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
        ownerUserId: true,
        groupId: true,
      },
    })

    console.log(`찾은 거래: ${basicTransactions.length}개`)
    basicTransactions.forEach(tx => {
      console.log(`  - ${tx.type}: ${tx.amount} (소유자: ${tx.ownerUserId}, 그룹: ${tx.groupId})`)
    })

    // 2. Raw SQL 쿼리 테스트 (그룹 필터 포함)
    console.log('\n2️⃣ Raw SQL 쿼리 테스트 (그룹 필터 포함):')
    const rawResults = await prisma.$queryRaw<
      Array<{
        metric_type: string
        total_amount: bigint | null
        count_value: bigint | null
      }>
    >`
      SELECT 
        'total_income' as metric_type,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN type = 'INCOME' THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        AND group_id = ${groupIdBigInt}
        
      UNION ALL
      
      SELECT 
        'total_expense' as metric_type,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN type = 'EXPENSE' THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        AND group_id = ${groupIdBigInt}
        
      UNION ALL
      
      SELECT 
        'my_expense' as metric_type,
        SUM(CASE WHEN type = 'EXPENSE' AND owner_user_id = ${userIdInt} THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN type = 'EXPENSE' AND owner_user_id = ${userIdInt} THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
        AND group_id = ${groupIdBigInt}
    `

    console.log('Raw SQL 결과:')
    rawResults.forEach(row => {
      console.log(`  - ${row.metric_type}: ${row.total_amount} (개수: ${row.count_value})`)
    })

    // 3. 그룹 필터 없이 테스트
    console.log('\n3️⃣ 그룹 필터 없이 테스트:')
    const noGroupResults = await prisma.$queryRaw<
      Array<{
        metric_type: string
        total_amount: bigint | null
        count_value: bigint | null
      }>
    >`
      SELECT 
        'total_expense' as metric_type,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN type = 'EXPENSE' THEN 1 END) as count_value
      FROM transactions 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
    `

    console.log('그룹 필터 없는 결과:')
    noGroupResults.forEach(row => {
      console.log(`  - ${row.metric_type}: ${row.total_amount} (개수: ${row.count_value})`)
    })
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
testStatsQuery()
  .then(() => {
    console.log('🏁 테스트 완료')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 테스트 실패:', error)
    process.exit(1)
  })
