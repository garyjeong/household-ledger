import { prisma } from '@/lib/prisma'
import { defaultCategories } from '@/lib/schemas/category'

/**
 * 기본 카테고리 시드 데이터를 데이터베이스에 삽입
 * 이미 존재하는 기본 카테고리는 건너뜀
 */
export async function seedDefaultCategories() {
  try {
    const createdCategories = []

    for (const category of defaultCategories) {
      // 기본 카테고리가 이미 존재하는지 확인
      const existingCategory = await prisma.category.findFirst({
        where: {
          ownerType: 'USER',
          ownerId: BigInt(0), // 시스템 기본 카테고리는 ownerId를 0으로 설정
          name: category.name,
          type: category.type,
          isDefault: true,
        },
      })

      if (!existingCategory) {
        const newCategory = await prisma.category.create({
          data: {
            ownerType: 'USER',
            ownerId: BigInt(0), // 시스템 기본 카테고리
            name: category.name,
            type: category.type,
            color: category.color,
            isDefault: true,
          },
        })
        createdCategories.push(newCategory)
        console.log(`기본 카테고리 생성: ${category.name} (${category.type})`)
      }
    }

    console.log(`기본 카테고리 시드 완료: ${createdCategories.length}개 생성`)
    return createdCategories
  } catch (error) {
    console.error('기본 카테고리 시드 중 오류:', error)
    throw error
  }
}

/**
 * 특정 사용자/그룹의 사용 가능한 카테고리 목록 조회
 * (기본 카테고리 + 해당 소유자의 커스텀 카테고리)
 */
export async function getAvailableCategories(
  ownerType: 'USER' | 'GROUP',
  ownerId: string,
  transactionType?: 'EXPENSE' | 'INCOME' | 'TRANSFER'
) {
  try {
    const whereConditions = [
      // 기본 카테고리 (시스템)
      {
        ownerType: 'USER' as const,
        ownerId: BigInt(0),
        isDefault: true,
        ...(transactionType && { type: transactionType }),
      },
      // 사용자/그룹의 커스텀 카테고리
      {
        ownerType,
        ownerId: BigInt(ownerId),
        isDefault: false,
        ...(transactionType && { type: transactionType }),
      },
    ]

    const categories = await prisma.category.findMany({
      where: {
        OR: whereConditions,
      },
      orderBy: [
        { isDefault: 'desc' }, // 기본 카테고리 먼저
        { type: 'asc' }, // 타입별 정렬
        { name: 'asc' }, // 이름순 정렬
      ],
    })

    return categories
  } catch (error) {
    console.error('카테고리 목록 조회 중 오류:', error)
    throw error
  }
}

/**
 * 기본 카테고리인지 확인
 */
export function isDefaultCategory(category: any): boolean {
  return category.isDefault && category.ownerType === 'USER' && category.ownerId.toString() === '0'
}

/**
 * 카테고리 삭제 가능 여부 확인
 */
export function canDeleteCategory(category: any, userId: string): boolean {
  // 기본 카테고리는 삭제 불가
  if (isDefaultCategory(category)) {
    return false
  }

  // 커스텀 카테고리는 소유자만 삭제 가능
  if (category.ownerType === 'USER') {
    return category.ownerId.toString() === userId
  }

  // 그룹 카테고리는 그룹 멤버만 삭제 가능 (추후 권한 확인 로직 추가)
  return true
}

/**
 * 카테고리 수정 가능 여부 확인
 */
export function canEditCategory(category: any, userId: string): boolean {
  // 기본 카테고리는 수정 불가
  if (isDefaultCategory(category)) {
    return false
  }

  // 커스텀 카테고리는 소유자만 수정 가능
  if (category.ownerType === 'USER') {
    return category.ownerId.toString() === userId
  }

  // 그룹 카테고리는 그룹 멤버만 수정 가능 (추후 권한 확인 로직 추가)
  return true
}
