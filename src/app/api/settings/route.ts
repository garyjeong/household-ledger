import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { JsonValue } from '@prisma/client/runtime/library'
import { verifyCookieToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_SETTINGS, AppSettings } from '@/contexts/settings-context'

// 설정 업데이트 스키마
const updateSettingsSchema = z.object({
  currency: z.enum(['KRW', 'USD', 'EUR', 'JPY']).optional(),
  showWonSuffix: z.boolean().optional(),
  defaultLanding: z.enum(['dashboard', 'transactions', 'statistics']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['ko', 'en']).optional(),
  categoryDisplay: z
    .object({
      showIcons: z.boolean().optional(),
      iconStyle: z.enum(['default', 'modern', 'minimal']).optional(),
      colorStyle: z.enum(['vibrant', 'pastel', 'monochrome']).optional(),
      groupByType: z.boolean().optional(),
      sortBy: z.enum(['name', 'usage', 'amount', 'recent']).optional(),
    })
    .optional(),
  enableNotifications: z.boolean().optional(),
  notificationSound: z.boolean().optional(),
  budgetAlerts: z.boolean().optional(),
  compactMode: z.boolean().optional(),
  showTutorials: z.boolean().optional(),
  quickInputShortcuts: z.boolean().optional(),
  partnerName: z.string().optional(),
  splitDefault: z.number().min(0).max(100).optional(),
})

/**
 * GET /api/settings
 * 사용자 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = verifyCookieToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 사용자 설정 조회 (User.settings JSON 필드에서)
    const userData = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      select: { settings: true },
    })

    // 설정 처리
    let settings: AppSettings = DEFAULT_SETTINGS
    if (userData?.settings) {
      try {
        // JSON 파싱 (Prisma에서 자동으로 파싱되지만 타입 체크용)
        settings =
          typeof userData.settings === 'object'
            ? (userData.settings as unknown as AppSettings)
            : (JSON.parse(userData.settings as string) as AppSettings)
      } catch (error) {
        console.error('설정 파싱 오류:', error)
        settings = DEFAULT_SETTINGS
      }
    }

    // 기본값과 병합하여 누락된 설정 보완
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings }

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
    })
  } catch (error) {
    console.error('설정 조회 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * 사용자 설정 업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    // 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = verifyCookieToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validationResult = updateSettingsSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '잘못된 설정 데이터입니다',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const updates = validationResult.data

    // 기존 설정 조회 (User.settings JSON 필드에서)
    const userData = await prisma.user.findUnique({
      where: { id: BigInt(user.userId) },
      select: { settings: true },
    })

    let currentSettings: AppSettings = DEFAULT_SETTINGS
    if (userData?.settings) {
      try {
        currentSettings =
          typeof userData.settings === 'object'
            ? (userData.settings as unknown as AppSettings)
            : (JSON.parse(userData.settings as string) as AppSettings)
      } catch (error) {
        console.error('기존 설정 파싱 오류:', error)
        currentSettings = DEFAULT_SETTINGS
      }
    }

    // 설정 업데이트 (깊은 병합)
    const newSettings: AppSettings = {
      ...currentSettings,
      ...updates,
      categoryDisplay: {
        ...currentSettings.categoryDisplay,
        ...updates.categoryDisplay,
      },
    }

    // User.settings JSON 필드에 저장
    await prisma.user.update({
      where: { id: BigInt(user.userId) },
      data: {
        settings: newSettings as JsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      settings: newSettings,
      message: '설정이 성공적으로 저장되었습니다',
    })
  } catch (error) {
    console.error('설정 업데이트 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings
 * 사용자 설정 초기화
 */
export async function DELETE(request: NextRequest) {
  try {
    // 쿠키에서 액세스 토큰 가져오기
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const user = verifyCookieToken(accessToken)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // 설정을 기본값으로 초기화 (User.settings JSON 필드를 null로 설정)
    await prisma.user.update({
      where: { id: BigInt(user.userId) },
      data: {
        settings: null, // null로 설정하면 기본값 사용
      },
    })

    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
      message: '설정이 초기화되었습니다',
    })
  } catch (error) {
    console.error('설정 초기화 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
