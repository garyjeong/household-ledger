/**
 * 거래 데이터 확인 스크립트
 */

/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTransactions() {
  try {
    console.log('🔍 데이터베이스 거래 데이터 확인 중...')

    // 모든 거래 조회
    const allTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
        memo: true,
        ownerUserId: true,
        groupId: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    console.log(`📊 총 거래 수: ${allTransactions.length}개`)

    if (allTransactions.length === 0) {
      console.log('❌ 데이터베이스에 거래 데이터가 없습니다.')
      return
    }

    console.log('\n📋 거래 목록:')
    allTransactions.forEach(transaction => {
      console.log(`- ID: ${transaction.id}`)
      console.log(`  타입: ${transaction.type}`)
      console.log(`  금액: ${transaction.amount}`)
      console.log(`  날짜: ${transaction.date.toISOString().split('T')[0]}`)
      console.log(`  메모: ${transaction.memo || 'N/A'}`)
      console.log(`  소유자: ${transaction.ownerUserId}`)
      console.log(`  그룹: ${transaction.groupId || 'N/A'}`)
      console.log(
        `  카테고리: ${transaction.category?.name || 'N/A'} (${transaction.category?.type || 'N/A'})`
      )
      console.log('')
    })

    // 2025년 9월 거래만 확인
    const september2025 = await prisma.transaction.findMany({
      where: {
        date: {
          gte: new Date('2025-09-01'),
          lte: new Date('2025-09-30'),
        },
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

    console.log(`📅 2025년 9월 거래: ${september2025.length}개`)
    september2025.forEach(tx => {
      console.log(
        `  - ${tx.type}: ${tx.amount} (날짜: ${tx.date.toISOString().split('T')[0]}, 소유자: ${tx.ownerUserId}, 그룹: ${tx.groupId})`
      )
    })

    // 사용자 4의 그룹 정보 확인
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(4),
      },
      include: {
        group: true,
        ownedGroups: true,
      },
    })

    const userGroups = [...(user?.group ? [user.group] : []), ...(user?.ownedGroups || [])]
    console.log(`\n👥 사용자 4의 그룹 멤버십: ${userGroups.length}개`)
    userGroups.forEach(group => {
      console.log(`  - 그룹 ID: ${group.id}, 이름: ${group.name}`)
    })
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
checkTransactions()
  .then(() => {
    console.log('🏁 스크립트 실행 완료')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 스크립트 실행 실패:', error)
    process.exit(1)
  })
