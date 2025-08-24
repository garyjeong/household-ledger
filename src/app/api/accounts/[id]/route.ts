import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractTokenFromHeader, verifyAccountOwnership } from '@/lib/auth'
import { updateAccountSchema, formatAccountForResponse } from '@/lib/schemas/account'

/**
 * PATCH /api/accounts/[id]
 * 계좌 정보 수정
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accountId = id

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 계좌 존재 확인
    const existingAccount = await prisma.account.findUnique({
      where: { id: BigInt(accountId) },
    })

    if (!existingAccount) {
      return NextResponse.json(
        { error: '계좌를 찾을 수 없습니다', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 소유권 검증
    const ownershipResult = await verifyAccountOwnership(
      user.userId,
      existingAccount.ownerType,
      existingAccount.ownerId.toString()
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        { error: ownershipResult.error || '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = updateAccountSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // 중복 이름 검사 (이름을 변경하는 경우)
    if (updateData.name && updateData.name !== existingAccount.name) {
      const duplicateAccount = await prisma.account.findFirst({
        where: {
          ownerType: existingAccount.ownerType,
          ownerId: existingAccount.ownerId,
          name: updateData.name,
          id: { not: BigInt(accountId) }, // 현재 계좌 제외
        },
      })

      if (duplicateAccount) {
        return NextResponse.json(
          { error: '이미 존재하는 계좌명입니다', code: 'DUPLICATE_NAME' },
          { status: 409 }
        )
      }
    }

    // BigInt 변환이 필요한 필드 처리
    const prismaUpdateData: Record<string, unknown> = { ...updateData }
    if (updateData.balance !== undefined) {
      prismaUpdateData.balance = BigInt(updateData.balance)
    }

    // 계좌 정보 업데이트
    const updatedAccount = await prisma.account.update({
      where: { id: BigInt(accountId) },
      data: prismaUpdateData,
    })

    return NextResponse.json({
      message: '계좌 정보가 성공적으로 수정되었습니다',
      account: formatAccountForResponse(updatedAccount),
    })
  } catch (error) {
    console.error('계좌 수정 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/accounts/[id]
 * 계좌 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const accountId = id

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 계좌 존재 확인
    const existingAccount = await prisma.account.findUnique({
      where: { id: BigInt(accountId) },
    })

    if (!existingAccount) {
      return NextResponse.json(
        { error: '계좌를 찾을 수 없습니다', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 소유권 검증
    const ownershipResult = await verifyAccountOwnership(
      user.userId,
      existingAccount.ownerType,
      existingAccount.ownerId.toString()
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        { error: ownershipResult.error || '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    // 연관된 거래가 있는지 확인 (선택사항 - 현재는 구현하지 않음)
    // TODO: 추후 Transaction 모델이 구현되면 연관 거래 확인 로직 추가

    // 계좌 삭제
    await prisma.account.delete({
      where: { id: BigInt(accountId) },
    })

    return NextResponse.json({
      message: '계좌가 성공적으로 삭제되었습니다',
    })
  } catch (error) {
    console.error('계좌 삭제 중 오류:', error)

    // Prisma 에러 처리
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        {
          error: '연관된 거래가 있어 계좌를 삭제할 수 없습니다',
          code: 'FOREIGN_KEY_CONSTRAINT',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/accounts/[id]
 * 특정 계좌 정보 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accountId = id

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 계좌 존재 확인
    const account = await prisma.account.findUnique({
      where: { id: BigInt(accountId) },
    })

    if (!account) {
      return NextResponse.json(
        { error: '계좌를 찾을 수 없습니다', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // 소유권 검증
    const ownershipResult = await verifyAccountOwnership(
      user.userId,
      account.ownerType,
      account.ownerId.toString()
    )

    if (!ownershipResult.isValid) {
      return NextResponse.json(
        { error: ownershipResult.error || '접근 권한이 없습니다', code: 'ACCESS_DENIED' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      account: formatAccountForResponse(account),
    })
  } catch (error) {
    console.error('계좌 조회 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
