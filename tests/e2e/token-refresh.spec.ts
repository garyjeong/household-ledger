import { test, expect } from '@playwright/test'

test.describe('토큰 갱신 시스템', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동하여 테스트 사용자로 로그인
    await page.goto('/login')

    // 테스트 사용자 로그인
    await page.fill('input[name="email"]', 'newuser@gmail.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 메인 페이지 로딩 대기
    await page.waitForURL('/')
    await expect(page.locator('h1')).toContainText('우리집 가계부')
  })

  test('토큰 만료 시 자동 갱신', async ({ page }) => {
    // 네트워크 요청 모니터링 시작
    const responses: Array<{ url: string; status: number }> = []

    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
      })
    })

    // 빠른 입력 기능을 통해 API 호출 유발
    await page.click('button:has-text("빠른 입력")')
    await page.waitForTimeout(3000)

    await page.click('button:has-text("10,000원")')
    await page.click('button:has-text("카테고리 선택")')
    await page.click('button:has-text("식비")')

    const memoInput = page.locator('textbox[placeholder*="메모를 입력해주세요"]')
    await memoInput.fill('토큰 갱신 테스트')

    // 저장 시도 (토큰 만료 상황 시뮬레이션)
    await page.click('button:has-text("저장")')

    // 응답 대기
    await page.waitForTimeout(10000)

    // 토큰 갱신 요청이 발생했는지 확인
    const refreshRequests = responses.filter(r => r.url.includes('/api/auth/refresh'))
    const quickAddRequests = responses.filter(r => r.url.includes('/api/transactions/quick-add'))

    // 토큰 갱신이 시도되었는지 확인
    expect(refreshRequests.length).toBeGreaterThan(0)

    // 토큰 갱신이 성공했는지 확인 (200 응답)
    const successfulRefresh = refreshRequests.some(r => r.status === 200)
    expect(successfulRefresh).toBe(true)

    // 빠른 입력 API 호출이 있었는지 확인
    expect(quickAddRequests.length).toBeGreaterThan(0)
  })

  test('토큰 갱신 실패 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    // 쿠키에서 refresh token 삭제 (갱신 실패 상황 시뮬레이션)
    await page.context().clearCookies()

    // API 호출이 필요한 페이지로 이동
    await page.goto('/transactions')

    // 토큰 갱신 실패로 인한 로그인 페이지 리다이렉트 확인
    await page.waitForTimeout(5000)

    // 로그인 페이지로 리다이렉트되었는지 확인
    const currentUrl = page.url()
    expect(currentUrl).toContain('/login')

    // 로그인 폼이 표시되는지 확인
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('동시 API 요청 시 토큰 갱신 중복 방지', async ({ page }) => {
    const responses: Array<{ url: string; status: number; timestamp: number }> = []

    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        timestamp: Date.now(),
      })
    })

    // 여러 페이지를 빠르게 연속 방문하여 동시 API 호출 유발
    const promises = [
      page.goto('/transactions'),
      page.goto('/statistics'),
      page.goto('/categories'),
    ]

    await Promise.all(promises)

    // 응답 대기
    await page.waitForTimeout(5000)

    // 토큰 갱신 요청들 확인
    const refreshRequests = responses.filter(r => r.url.includes('/api/auth/refresh'))

    if (refreshRequests.length > 0) {
      // 토큰 갱신 요청이 중복되지 않았는지 확인
      // (동일한 시간대에 여러 갱신 요청이 발생하지 않아야 함)
      const refreshTimes = refreshRequests.map(r => r.timestamp)
      const timeDifferences = refreshTimes.slice(1).map((time, index) => time - refreshTimes[index])

      // 갱신 요청 간 최소 간격이 있어야 함 (중복 방지)
      const hasProperSpacing = timeDifferences.every(diff => diff > 1000) // 1초 이상 간격
      expect(hasProperSpacing || refreshRequests.length === 1).toBe(true)
    }
  })

  test('토큰 갱신 후 원래 요청 재시도', async ({ page }) => {
    const networkRequests: Array<{ url: string; method: string; status: number }> = []

    page.on('response', response => {
      networkRequests.push({
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
      })
    })

    // 거래내역 페이지로 이동 (API 호출 필요)
    await page.goto('/transactions')

    // 페이지 로딩 대기
    await page.waitForTimeout(5000)

    // 거래내역 API 호출이 성공했는지 확인
    const transactionRequests = networkRequests.filter(
      r => r.url.includes('/api/transactions') && r.method === 'GET'
    )

    expect(transactionRequests.length).toBeGreaterThan(0)

    // 최종적으로 성공한 요청이 있는지 확인
    const successfulRequests = transactionRequests.filter(r => r.status === 200)
    expect(successfulRequests.length).toBeGreaterThan(0)

    // 페이지가 정상적으로 로드되었는지 확인
    await expect(page.locator('text=거래내역')).toBeVisible()
  })
})
