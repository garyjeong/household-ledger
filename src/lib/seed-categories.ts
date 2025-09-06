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
          groupId: null, // 기본 카테고리는 groupId가 null
          name: category.name,
          type: category.type,
          isDefault: true,
        },
      })

      if (!existingCategory) {
        const newCategory = await prisma.category.create({
          data: {
            groupId: null, // 기본 카테고리는 그룹에 속하지 않음
            createdBy: BigInt(1), // 첫 번째 사용자로 설정 (기본 카테고리)
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
  groupId: string | null,
  transactionType?: 'EXPENSE' | 'INCOME' | 'TRANSFER'
) {
  try {
    const whereConditions = [
      // 기본 카테고리 (시스템)
      {
        groupId: null,
        isDefault: true,
        ...(transactionType && { type: transactionType }),
      },
      // 그룹의 커스텀 카테고리
      ...(groupId
        ? [
            {
              groupId: BigInt(groupId),
              isDefault: false,
              ...(transactionType && { type: transactionType }),
            },
          ]
        : []),
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
  return category.isDefault && category.groupId === null
}

/**
 * 카테고리 삭제 가능 여부 확인
 */
export function canDeleteCategory(
  category: any,
  userId: string,
  userGroupId?: string | null
): boolean {
  // 기본 카테고리는 삭제 불가
  if (isDefaultCategory(category)) {
    return false
  }

  // 그룹 카테고리는 같은 그룹 멤버만 삭제 가능
  if (category.groupId) {
    return userGroupId && category.groupId.toString() === userGroupId
  }

  // 개인 카테고리는 생성자만 삭제 가능
  return category.createdBy && category.createdBy.toString() === userId
}

/**
 * 카테고리 수정 가능 여부 확인
 */
export function canEditCategory(
  category: any,
  userId: string,
  userGroupId?: string | null
): boolean {
  // 기본 카테고리는 수정 불가
  if (isDefaultCategory(category)) {
    return false
  }

  // 그룹 카테고리는 같은 그룹 멤버만 수정 가능
  if (category.groupId) {
    return userGroupId && category.groupId.toString() === userGroupId
  }

  // 개인 카테고리는 생성자만 수정 가능
  return category.createdBy && category.createdBy.toString() === userId
}
