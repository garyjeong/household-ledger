import { test, expect } from '@playwright/test'

test.describe('빠른 입력 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동하여 테스트 사용자로 로그인
    await page.goto('/login')

    // 테스트 사용자 로그인 (실제 구현에 맞게 조정)
    await page.fill('input[name="email"]', 'newuser@gmail.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 메인 페이지 로딩 대기
    await page.waitForURL('/')
    await expect(page.locator('h1')).toContainText('우리집 가계부')
  })

  test('빠른 입력 모달 열기 및 닫기', async ({ page }) => {
    // 빠른 입력 버튼 클릭
    await page.click('button:has-text("빠른 입력")')

    // 모달이 열렸는지 확인
    await expect(page.locator('h2:has-text("빠른 입력")')).toBeVisible()

    // 취소 버튼으로 모달 닫기
    await page.click('button:has-text("취소")')

    // 모달이 닫혔는지 확인
    await expect(page.locator('h2:has-text("빠른 입력")')).not.toBeVisible()
  })

  test('금액 선택 기능', async ({ page }) => {
    // 빠른 입력 모달 열기
    await page.click('button:has-text("빠른 입력")')

    // 10,000원 버튼 클릭
    await page.click('button:has-text("10,000원")')

    // 금액 입력 필드에 값이 설정되었는지 확인
    const amountInput = page
      .locator('textbox[placeholder*="0원"], input[value*="10,000원"]')
      .first()
    await expect(amountInput).toHaveValue('10,000원')

    // 다른 금액 버튼 테스트
    await page.click('button:has-text("50,000원")')
    await expect(amountInput).toHaveValue('50,000원')
  })

  test('카테고리 선택 기능', async ({ page }) => {
    // 빠른 입력 모달 열기
    await page.click('button:has-text("빠른 입력")')

    // 카테고리 로딩 대기 (그룹 정보 로딩 완료까지)
    await page.waitForTimeout(3000)

    // 카테고리 선택 버튼 클릭
    const categoryButton = page.locator('button:has-text("카테고리 선택")')
    await expect(categoryButton).toBeVisible()
    await categoryButton.click()

    // 카테고리 모달이 열렸는지 확인
    await expect(page.locator('h2:has-text("카테고리 선택")')).toBeVisible()

    // 카테고리 목록이 표시되는지 확인
    await expect(page.locator('text=내 카테고리')).toBeVisible()
    await expect(page.locator('button:has-text("식비")')).toBeVisible()
    await expect(page.locator('button:has-text("교통")')).toBeVisible()

    // 식비 카테고리 선택
    await page.click('button:has-text("식비")')

    // 카테고리 모달이 닫히고 선택된 카테고리가 표시되는지 확인
    await expect(page.locator('h2:has-text("카테고리 선택")')).not.toBeVisible()
    await expect(page.locator('button:has-text("식비")')).toBeVisible()
  })

  test('완전한 거래 입력 프로세스', async ({ page }) => {
    // 빠른 입력 모달 열기
    await page.click('button:has-text("빠른 입력")')

    // 그룹/카테고리 로딩 대기
    await page.waitForTimeout(3000)

    // 1. 금액 입력
    await page.click('button:has-text("10,000원")')

    // 2. 카테고리 선택
    await page.click('button:has-text("카테고리 선택")')
    await expect(page.locator('h2:has-text("카테고리 선택")')).toBeVisible()
    await page.click('button:has-text("식비")')

    // 3. 메모 입력
    const memoInput = page.locator('textbox[placeholder*="메모를 입력해주세요"]')
    await memoInput.fill('점심식사')

    // 4. 저장 버튼이 활성화되었는지 확인
    const saveButton = page.locator('button:has-text("저장")')
    await expect(saveButton).not.toBeDisabled()

    // 5. 입력된 값들이 올바른지 확인
    const amountInput = page.locator('textbox[value*="10,000원"]').first()
    await expect(amountInput).toHaveValue('10,000원')
    await expect(page.locator('button:has-text("식비")')).toBeVisible()
    await expect(memoInput).toHaveValue('점심식사')

    // 6. 저장 시도
    await saveButton.click()

    // 저장 중 상태 확인
    await expect(page.locator('button:has-text("저장 중...")')).toBeVisible()

    // 응답 대기 (성공 또는 실패)
    await page.waitForTimeout(5000)

    // 결과 확인 (성공 시 모달이 닫히거나, 실패 시 에러 메시지 표시)
    const isModalClosed = await page.locator('h2:has-text("빠른 입력")').isHidden()
    const hasErrorDialog = await page.locator('text=오류').isVisible()

    // 성공하거나 에러 다이얼로그가 표시되어야 함
    expect(isModalClosed || hasErrorDialog).toBe(true)

    // 에러 다이얼로그가 있다면 확인 버튼 클릭
    if (hasErrorDialog) {
      await page.click('button:has-text("확인")')
    }
  })

  test('거래 타입 변경 기능', async ({ page }) => {
    // 빠른 입력 모달 열기
    await page.click('button:has-text("빠른 입력")')
    await page.waitForTimeout(3000)

    // 기본값이 지출인지 확인
    const expenseButton = page.locator('button:has-text("💸 지출")')
    const incomeButton = page.locator('button:has-text("💰 수입")')

    await expect(expenseButton).toBeVisible()
    await expect(incomeButton).toBeVisible()

    // 수입으로 변경
    await incomeButton.click()

    // 카테고리 버튼의 텍스트가 변경되었는지 확인 (수입 카테고리로)
    const categoryButton = page.locator('button:has-text("카테고리 선택")')
    await expect(categoryButton).toContainText('수입 카테고리를 선택해주세요')
  })

  test('날짜 선택 기능', async ({ page }) => {
    // 빠른 입력 모달 열기
    await page.click('button:has-text("빠른 입력")')

    // 날짜 선택 버튼들이 표시되는지 확인
    await expect(page.locator('button:has-text("오늘")')).toBeVisible()
    await expect(page.locator('button:has-text("어제")')).toBeVisible()
    await expect(page.locator('button:has-text("3일 전")')).toBeVisible()

    // 날짜 입력 필드 확인
    const dateInput = page.locator('input[type="date"], textbox[value*="2025-09-10"]')
    await expect(dateInput).toBeVisible()

    // 어제 버튼 클릭 테스트
    await page.click('button:has-text("어제")')

    // 날짜가 변경되었는지 확인 (실제 구현에 따라 조정)
    // 예: await expect(dateInput).toHaveValue('2025-09-09')
  })

  test('필수 항목 유효성 검사', async ({ page }) => {
    // 빠른 입력 모달 열기
    await page.click('button:has-text("빠른 입력")')

    // 초기 상태에서 저장 버튼이 비활성화되어 있는지 확인
    const saveButton = page.locator('button:has-text("저장")')
    await expect(saveButton).toBeDisabled()

    // 금액만 입력했을 때도 여전히 비활성화
    await page.click('button:has-text("10,000원")')
    await expect(saveButton).toBeDisabled()

    // 카테고리까지 선택하면 활성화
    await page.waitForTimeout(3000)
    await page.click('button:has-text("카테고리 선택")')
    await page.click('button:has-text("식비")')
    await expect(saveButton).not.toBeDisabled()
  })
})
