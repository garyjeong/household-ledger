import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findUserByEmail } from '@/lib/auth'

const schema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const user = await findUserByEmail(parsed.data.email)
    return NextResponse.json({ exists: Boolean(user) }, { status: 200 })
  } catch (error) {
    console.error('check-email error:', error)
    return NextResponse.json({ error: '이메일 확인 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
