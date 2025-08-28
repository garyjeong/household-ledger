import { test, expect } from '@playwright/test'

test.describe('그룹 관리 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login')
  })

  test('그룹 생성 및 초대 코드 생성 플로우', async ({ page }) => {
    // 로그인
    await page.fill('[data-testid=email-input]', 'test@example.com')
    await page.fill('[data-testid=password-input]', 'password123')
    await page.click('[data-testid=login-button]')

    // 그룹 페이지로 이동
    await page.goto('/groups')
    await expect(page).toHaveURL('/groups')

    // 새 그룹 만들기 버튼 클릭
    await page.click('button:has-text("새 그룹 만들기")')

    // 그룹 생성 모달에서 그룹 이름 입력
    await page.fill('input[placeholder*="우리 가족"]', '테스트 가족')
    await page.click('button:has-text("만들기")')

    // 그룹이 생성되었는지 확인
    await expect(page.locator('text=테스트 가족')).toBeVisible()

    // 초대 링크 생성 버튼 클릭
    await page.click('[data-testid=invite-button]')

    // 초대 코드가 생성되었는지 확인
    await expect(page.locator('text=초대 코드')).toBeVisible()

    // 초대 코드가 10자리인지 확인
    const inviteCodeInput = page.locator('input[readonly]:first')
    const inviteCode = await inviteCodeInput.inputValue()
    expect(inviteCode).toHaveLength(10)
    expect(inviteCode).toMatch(/^[A-Z0-9]{10}$/)

    // 24시간 만료 안내 텍스트 확인
    await expect(page.locator('text=24시간 후에 만료됩니다')).toBeVisible()

    // 복사 버튼 테스트
    await page.click('button:has([data-testid=copy-icon])')
    await expect(page.locator('[data-testid=check-icon]')).toBeVisible()
  })

  test('그룹 참여 플로우', async ({ page }) => {
    // 로그인
    await page.fill('[data-testid=email-input]', 'test2@example.com')
    await page.fill('[data-testid=password-input]', 'password123')
    await page.click('[data-testid=login-button]')

    // 그룹 페이지로 이동
    await page.goto('/groups')

    // 그룹 참여 버튼 클릭
    await page.click('button:has-text("그룹 참여")')

    // 초대 코드 입력
    await page.fill('input[placeholder*="초대 코드를 입력하세요"]', 'ABC1234567')
    await page.click('button:has-text("참여하기")')

    // 에러 메시지 확인 (유효하지 않은 코드)
    await expect(page.locator('text=유효하지 않거나 만료된')).toBeVisible()
  })

  test('그룹 목록 실시간 업데이트', async ({ page }) => {
    // 로그인
    await page.fill('[data-testid=email-input]', 'test@example.com')
    await page.fill('[data-testid=password-input]', 'password123')
    await page.click('[data-testid=login-button]')

    // 그룹 페이지로 이동
    await page.goto('/groups')

    // 초기 그룹 수 확인
    const initialGroupCount = await page.locator('[data-testid=group-card]').count()

    // 새 그룹 생성
    await page.click('button:has-text("새 그룹 만들기")')
    await page.fill('input[placeholder*="우리 가족"]', '실시간 테스트 그룹')
    await page.click('button:has-text("만들기")')

    // 그룹이 자동으로 추가되었는지 확인
    await expect(page.locator(`[data-testid=group-card]`)).toHaveCount(initialGroupCount + 1)
    await expect(page.locator('text=실시간 테스트 그룹')).toBeVisible()
  })

  test('만료된 초대 코드 처리', async ({ page }) => {
    // 로그인
    await page.fill('[data-testid=email-input]', 'test@example.com')
    await page.fill('[data-testid=password-input]', 'password123')
    await page.click('[data-testid=login-button]')

    // 그룹 참여 시도
    await page.goto('/groups')
    await page.click('button:has-text("그룹 참여")')

    // 만료된 코드로 가정하고 테스트
    await page.fill('input[placeholder*="초대 코드를 입력하세요"]', 'EXPIRED123')
    await page.click('button:has-text("참여하기")')

    // 만료된 코드 에러 메시지 확인
    await expect(page.locator('text=유효하지 않거나 만료된 초대 코드입니다')).toBeVisible()
  })

  test('그룹 페이지 반응형 디자인', async ({ page, isMobile }) => {
    // 로그인
    await page.fill('[data-testid=email-input]', 'test@example.com')
    await page.fill('[data-testid=password-input]', 'password123')
    await page.click('[data-testid=login-button]')

    await page.goto('/groups')

    if (isMobile) {
      // 모바일에서 로그아웃 버튼이 헤더에 있는지 확인
      await expect(page.locator('.sm\\:hidden [data-testid=logout-button]')).toBeVisible()
    } else {
      // 데스크탑에서 로그아웃 버튼이 우측에 있는지 확인
      await expect(page.locator('.hidden.sm\\:flex [data-testid=logout-button]')).toBeVisible()
    }

    // 그룹 카드들이 반응형으로 배치되는지 확인
    await expect(page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3')).toBeVisible()
  })
})
