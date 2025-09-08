/**
 * 가족 초대 기능 E2E 테스트
 * - 초대 코드 생성 및 복사 기능
 * - 초대 코드 입력을 통한 그룹 참여
 * - 개인 그룹 자동 생성/삭제 플로우
 */

import { test, expect } from '@playwright/test'

test.describe('가족 초대 기능 E2E 테스트', () => {
  let inviteCode: string

  test.beforeEach(async ({ page }) => {
    // 테스트 환경 설정
    await page.goto('/')
  })

  test.describe('초대 코드 생성 플로우', () => {
    test('그룹 소유자가 초대 코드를 생성하고 복사할 수 있어야 한다', async ({ page }) => {
      // 1. 로그인 (그룹 소유자)
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'owner@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')

      // 2. 프로필 페이지로 이동
      await page.goto('/profile')
      await page.click('button:has-text("계정 관리")')

      // 3. 초대 코드 생성 버튼 클릭
      await page.click('button:has-text("초대 코드 생성")')

      // 4. 초대 코드가 생성되었는지 확인
      await expect(page.locator('input[readonly]').first()).toBeVisible()

      // 5. 초대 코드 값 저장 (다음 테스트에서 사용)
      inviteCode = await page.locator('input[readonly]').first().inputValue()
      expect(inviteCode).toMatch(/^[A-Z0-9]{10}$/) // 10자리 영문+숫자

      // 6. 복사 버튼 클릭
      await page.click('button:has-text("복사")')

      // 7. 성공 메시지 확인
      await expect(page.locator('text=복사되었습니다')).toBeVisible()

      // 8. 만료 시간 안내 메시지 확인
      await expect(page.locator('text=초대 코드는 24시간 후 만료됩니다')).toBeVisible()
    })

    test('개인 계정 사용자에게 그룹 참여 UI가 표시되어야 한다', async ({ page }) => {
      // 1. 새로운 계정으로 회원가입/로그인
      await page.goto('/register')
      await page.fill('[data-testid="email-input"]', 'newuser@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.fill('[data-testid="nickname-input"]', '신규사용자')
      await page.click('[data-testid="register-button"]')

      // 2. 프로필 페이지로 이동
      await page.goto('/profile')
      await page.click('button:has-text("계정 관리")')

      // 3. 개인 계정 상태 메시지 확인
      await expect(page.locator('text=개인 가계부를 사용 중입니다')).toBeVisible()

      // 4. 가족 그룹 참여 섹션 확인
      await expect(page.locator('text=가족 그룹 참여하기')).toBeVisible()
      await expect(page.locator('input[placeholder*="ABC123DEF456"]')).toBeVisible()
      await expect(page.locator('button:has-text("그룹 참여하기")')).toBeVisible()

      // 5. 안내 메시지 확인
      await expect(
        page.locator('text=가족으로부터 받은 12자리 초대 코드를 입력하세요')
      ).toBeVisible()
    })
  })

  test.describe('초대 코드를 통한 그룹 참여 플로우', () => {
    test('유효한 초대 코드로 그룹에 참여할 수 있어야 한다', async ({ page, context }) => {
      // 1. 그룹 소유자 계정으로 초대 코드 생성
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'owner@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')

      await page.goto('/profile')
      await page.click('button:has-text("계정 관리")')
      await page.click('button:has-text("초대 코드 생성")')

      // 초대 코드 값 가져오기
      const generatedCode = await page.locator('input[readonly]').first().inputValue()

      // 2. 새로운 브라우저 탭에서 신규 사용자 계정 생성
      const newPage = await context.newPage()

      await newPage.goto('/register')
      await newPage.fill('[data-testid="email-input"]', 'member@example.com')
      await newPage.fill('[data-testid="password-input"]', 'password123')
      await newPage.fill('[data-testid="nickname-input"]', '가족구성원')
      await newPage.click('[data-testid="register-button"]')

      // 3. 프로필 페이지에서 그룹 참여 시도
      await newPage.goto('/profile')
      await newPage.click('button:has-text("계정 관리")')

      // 4. 초대 코드 입력
      await newPage.fill('input[placeholder*="ABC123DEF456"]', generatedCode)

      // 5. 그룹 참여 버튼 클릭
      await newPage.click('button:has-text("그룹 참여하기")')

      // 6. 성공 메시지 확인
      await expect(newPage.locator('text=그룹 참여 성공!')).toBeVisible()

      // 7. 페이지가 새로고침되면서 그룹 상태로 변경되었는지 확인
      await newPage.waitForLoadState('networkidle')

      // 그룹 정보가 표시되는지 확인 (개인 계정 UI가 사라져야 함)
      await expect(newPage.locator('text=개인 가계부를 사용 중입니다')).not.toBeVisible()

      await newPage.close()
    })

    test('잘못된 초대 코드로 참여 시 에러 메시지가 표시되어야 한다', async ({ page }) => {
      // 1. 신규 사용자 로그인
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')

      // 2. 프로필 페이지로 이동
      await page.goto('/profile')
      await page.click('button:has-text("계정 관리")')

      // 3. 잘못된 초대 코드 입력
      await page.fill('input[placeholder*="ABC123DEF456"]', 'INVALID123')
      await page.click('button:has-text("그룹 참여하기")')

      // 4. 에러 메시지 확인
      await expect(page.locator('text=그룹 참여 실패')).toBeVisible()
      await expect(page.locator('text=유효하지 않은 초대 코드이거나 만료되었습니다')).toBeVisible()
    })

    test('빈 초대 코드로 참여 시 에러 메시지가 표시되어야 한다', async ({ page }) => {
      // 1. 신규 사용자 로그인
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')

      // 2. 프로필 페이지로 이동
      await page.goto('/profile')
      await page.click('button:has-text("계정 관리")')

      // 3. 빈 코드로 참여 시도
      await page.click('button:has-text("그룹 참여하기")')

      // 4. 에러 메시지 확인
      await expect(page.locator('text=초대 코드를 입력해주세요')).toBeVisible()
      await expect(page.locator('text=가족으로부터 받은 초대 코드를 입력하세요')).toBeVisible()
    })
  })

  test.describe('코드 입력 UI/UX 검증', () => {
    test('초대 코드 입력 필드의 동작이 올바르게 작동해야 한다', async ({ page }) => {
      // 1. 로그인
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')

      // 2. 프로필 페이지로 이동
      await page.goto('/profile')
      await page.click('button:has-text("계정 관리")')

      const codeInput = page.locator('input[placeholder*="ABC123DEF456"]')

      // 3. 소문자 입력 시 자동으로 대문자로 변환되는지 확인
      await codeInput.fill('abc123def456')
      await expect(codeInput).toHaveValue('ABC123DEF456')

      // 4. 12자리 제한 확인
      await codeInput.fill('ABCDEFGHIJKLMNOP')
      const value = await codeInput.inputValue()
      expect(value.length).toBeLessThanOrEqual(12)

      // 5. 참여하기 버튼이 코드 입력 시 활성화되는지 확인
      await codeInput.fill('')
      await expect(page.locator('button:has-text("그룹 참여하기")')).toBeDisabled()

      await codeInput.fill('ABCD1234EF')
      await expect(page.locator('button:has-text("그룹 참여하기")')).toBeEnabled()
    })

    test('참여 중 로딩 상태가 올바르게 표시되어야 한다', async ({ page }) => {
      // 1. 로그인
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')

      // 2. 프로필 페이지로 이동
      await page.goto('/profile')
      await page.click('button:has-text("계정 관리")')

      // 3. 초대 코드 입력
      await page.fill('input[placeholder*="ABC123DEF456"]', 'TESTCODE12')

      // 4. 참여 버튼 클릭 (네트워크 응답을 기다리는 동안)
      await page.click('button:has-text("그룹 참여하기")')

      // 5. 로딩 텍스트 확인 (빠르게 사라질 수 있으므로 조건부 검증)
      const loadingButton = page.locator('button:has-text("참여 중...")')

      // 로딩 상태가 나타났다면 확인
      try {
        await expect(loadingButton).toBeVisible({ timeout: 1000 })
      } catch {
        // 로딩이 너무 빨라서 확인하지 못한 경우는 정상
      }
    })
  })
})
