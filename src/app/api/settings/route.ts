import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

    // 사용자 설정 조회
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: BigInt(user.userId),
      },
    })

    if (!userSettings) {
      // 설정이 없는 경우 기본값 반환
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      })
    }

    // JSON 파싱하여 설정 반환
    let settings: AppSettings
    try {
      settings = JSON.parse(userSettings.settings as string)
    } catch (error) {
      console.error('설정 파싱 오류:', error)
      settings = DEFAULT_SETTINGS
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

    // 기존 설정 조회
    const existingSettings = await prisma.userSettings.findUnique({
      where: {
        userId: BigInt(user.userId),
      },
    })

    let currentSettings: AppSettings
    if (existingSettings) {
      try {
        currentSettings = JSON.parse(existingSettings.settings as string)
      } catch (error) {
        console.error('기존 설정 파싱 오류:', error)
        currentSettings = DEFAULT_SETTINGS
      }
    } else {
      currentSettings = DEFAULT_SETTINGS
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

    // 데이터베이스에 저장
    await prisma.userSettings.upsert({
      where: {
        userId: BigInt(user.userId),
      },
      update: {
        settings: JSON.stringify(newSettings),
        updatedAt: new Date(),
      },
      create: {
        userId: BigInt(user.userId),
        settings: JSON.stringify(newSettings),
        createdAt: new Date(),
        updatedAt: new Date(),
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

    // 설정을 기본값으로 초기화
    await prisma.userSettings.upsert({
      where: {
        userId: BigInt(user.userId),
      },
      update: {
        settings: JSON.stringify(DEFAULT_SETTINGS),
        updatedAt: new Date(),
      },
      create: {
        userId: BigInt(user.userId),
        settings: JSON.stringify(DEFAULT_SETTINGS),
        createdAt: new Date(),
        updatedAt: new Date(),
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
