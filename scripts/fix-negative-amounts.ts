/**
 * 음수로 저장된 거래 금액을 양수로 변환하는 스크립트
 * amount 컬럼은 항상 양수로 저장되어야 하며, type 컬럼에 따라 계산 시 부호를 결정
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixNegativeAmounts() {
  try {
    console.log('🔍 음수 amount를 가진 거래 검색 중...')

    // 음수 amount를 가진 거래들 조회
    const negativeTransactions = await prisma.transaction.findMany({
      where: {
        amount: {
          lt: 0,
        },
      },
      select: {
        id: true,
        amount: true,
        type: true,
        memo: true,
        date: true,
      },
    })

    console.log(`📊 발견된 음수 거래: ${negativeTransactions.length}개`)

    if (negativeTransactions.length === 0) {
      console.log('✅ 모든 거래의 amount가 이미 양수입니다.')
      return
    }

    // 각 거래의 정보 출력
    negativeTransactions.forEach(transaction => {
      console.log(
        `- ID: ${transaction.id}, Amount: ${transaction.amount}, Type: ${transaction.type}, Memo: ${transaction.memo || 'N/A'}`
      )
    })

    console.log('\n🔧 음수 amount를 양수로 변환 중...')

    // 배치 업데이트 실행
    const updatePromises = negativeTransactions.map(transaction =>
      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          amount: Math.abs(Number(transaction.amount)),
        },
      })
    )

    await Promise.all(updatePromises)

    console.log(`✅ ${negativeTransactions.length}개 거래의 amount를 양수로 변환 완료`)

    // 변환 후 검증
    const remainingNegative = await prisma.transaction.count({
      where: {
        amount: {
          lt: 0,
        },
      },
    })

    if (remainingNegative === 0) {
      console.log('🎉 모든 거래의 amount가 성공적으로 양수로 변환되었습니다!')
    } else {
      console.warn(`⚠️ 여전히 ${remainingNegative}개의 음수 거래가 남아있습니다.`)
    }
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
fixNegativeAmounts()
  .then(() => {
    console.log('🏁 스크립트 실행 완료')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 스크립트 실행 실패:', error)
    process.exit(1)
  })
