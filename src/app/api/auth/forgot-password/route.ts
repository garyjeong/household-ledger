import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findUserByEmail } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

const forgotPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요.'),
})

// 임시 비밀번호 생성 함수
function generateTempPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'

  let password = ''

  // 각 카테고리에서 최소 1개씩 포함
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // 나머지 4자리 랜덤 생성
  const allChars = lowercase + uppercase + numbers + symbols
  for (let i = 0; i < 4; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // 문자열 섞기
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 요청 데이터 검증
    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: '올바른 이메일 주소를 입력해주세요.',
        },
        { status: 400 }
      )
    }

    const { email } = result.data

    // 사용자 존재 여부 확인
    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: '등록되지 않은 이메일 주소입니다.',
        },
        { status: 404 }
      )
    }

    // 임시 비밀번호 생성
    const tempPassword = generateTempPassword()

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(tempPassword)

    // 데이터베이스 업데이트
    const { prisma } = await import('@/lib/prisma')
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: '임시 비밀번호가 생성되었습니다.',
      tempPassword: tempPassword,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    )
  }
}
