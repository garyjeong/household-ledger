/**
 * Playwright 테스트용 헬퍼 함수들
 */

import { Page, expect, Locator, Browser, BrowserContext } from '@playwright/test'
import { TEST_USERS, TEST_TRANSACTIONS, MOCK_API_RESPONSES } from './test-data'

/**
 * 공통 테스트 헬퍼 클래스
 */
export class PlaywrightHelpers {
  constructor(private page: Page) {}

  /**
   * 페이지 로딩 완료 대기
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle', { timeout: 30000 })
    await this.page.waitForLoadState('domcontentloaded')
  }

  /**
   * 특정 선택자가 로드될 때까지 대기
   */
  async waitForSelector(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout })
  }

  /**
   * 로그인 수행
   */
  async login(user = TEST_USERS.primary) {
    await this.page.goto('/login')
    await this.page.getByPlaceholder('이메일을 입력하세요').fill(user.email)
    await this.page.getByPlaceholder('비밀번호를 입력하세요').fill(user.password)
    await this.page.getByRole('button', { name: '로그인' }).click()

    // 대시보드로 리다이렉션 대기
    await expect(this.page).toHaveURL(/.*dashboard.*/)
  }

  /**
   * 회원가입 수행
   */
  async signUp(user = TEST_USERS.primary) {
    await this.page.goto('/signup')
    await this.page.getByPlaceholder('이메일을 입력하세요').fill(user.email)
    await this.page.getByPlaceholder('비밀번호를 입력하세요').fill(user.password)
    await this.page.getByPlaceholder('비밀번호를 다시 입력하세요').fill(user.password)
    await this.page.getByPlaceholder('닉네임을 입력하세요').fill(user.nickname)
    await this.page.getByRole('button', { name: '회원가입' }).click()
  }

  /**
   * 로그아웃 수행
   */
  async logout() {
    await this.page.getByRole('button', { name: /로그아웃|Logout/ }).click()
    await expect(this.page).toHaveURL(/.*login.*/)
  }

  /**
   * 거래 추가
   */
  async addTransaction(
    transaction = TEST_TRANSACTIONS.expense,
    options: {
      useQuickAdd?: boolean
      selectCategory?: boolean
      addTags?: string[]
    } = {}
  ) {
    const { useQuickAdd = false, selectCategory = true, addTags = [] } = options

    // 거래 추가 모달 열기
    const addButton = useQuickAdd
      ? this.page.getByRole('button', { name: /빠른.*입력|Quick.*Add/ })
      : this.page.getByRole('button', { name: /거래.*추가|Add.*Transaction/ })

    await addButton.click()

    // 거래 유형 선택 (수입인 경우)
    if (transaction.type === 'INCOME') {
      const typeSelect = this.page.getByRole('combobox', { name: /유형|타입|Type/ })
      if (await typeSelect.isVisible()) {
        await typeSelect.click()
        await this.page.getByRole('option', { name: '수입' }).click()
      }
    }

    // 기본 정보 입력
    await this.page.getByPlaceholder(/금액|amount/i).fill(transaction.amount)
    await this.page.getByPlaceholder(/설명|내용|description/i).fill(transaction.description)

    // 카테고리 선택
    if (selectCategory) {
      const categorySelect = this.page.getByRole('combobox', { name: /카테고리|Category/ })
      await categorySelect.click()
      await this.page.getByRole('option', { name: transaction.category }).click()
    }

    // 메모 입력 (선택사항)
    if (transaction.memo) {
      const memoInput = this.page.getByPlaceholder(/메모|memo/i)
      if (await memoInput.isVisible()) {
        await memoInput.fill(transaction.memo)
      }
    }

    // 태그 추가 (선택사항)
    for (const tag of addTags) {
      const tagInput = this.page.getByPlaceholder(/태그|tag/i)
      if (await tagInput.isVisible()) {
        await tagInput.fill(tag)
        await this.page.keyboard.press('Enter')
      }
    }

    // 저장
    await this.page.getByRole('button', { name: /저장|추가|Save|Add/ }).click()
  }

  /**
   * 토스트/알림 메시지 확인
   */
  async expectToast(message: string, timeout = 5000) {
    await expect(
      this.page
        .getByText(message)
        .or(this.page.locator(`[data-testid="toast"]:has-text("${message}")`))
    ).toBeVisible({ timeout })
  }

  /**
   * 에러 메시지 확인
   */
  async expectError(message: string) {
    await expect(
      this.page
        .getByText(message)
        .or(this.page.locator('.error, [data-testid="error"]').filter({ hasText: message }))
    ).toBeVisible()
  }

  /**
   * 로딩 상태 대기
   */
  async waitForLoadingToFinish() {
    // 스피너나 로딩 인디케이터 사라질 때까지 대기
    await this.page
      .waitForSelector('.loading, .spinner, [data-testid="loading"]', {
        state: 'hidden',
        timeout: 10000,
      })
      .catch(() => {
        // 로딩 요소가 없는 경우 무시
      })
  }

  /**
   * API 응답 모킹
   */
  async mockApiResponse(
    pattern: string,
    response: any,
    options: { status?: number; delay?: number } = {}
  ) {
    const { status = 200, delay = 0 } = options

    await this.page.route(pattern, async route => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    })
  }

  /**
   * 네트워크 오류 시뮬레이션
   */
  async simulateNetworkError(pattern = '**/api/**') {
    await this.page.route(pattern, route => route.abort())
  }

  /**
   * 오프라인 상태 시뮬레이션
   */
  async goOffline() {
    await this.page.context().setOffline(true)
  }

  /**
   * 온라인 상태 복구
   */
  async goOnline() {
    await this.page.context().setOffline(false)
  }

  /**
   * 뷰포트 크기 설정
   */
  async setViewport(width: number, height: number) {
    await this.page.setViewportSize({ width, height })
  }

  /**
   * 모바일 뷰포트 설정
   */
  async setMobileViewport() {
    await this.setViewport(375, 667) // iPhone SE
  }

  /**
   * 태블릿 뷰포트 설정
   */
  async setTabletViewport() {
    await this.setViewport(768, 1024) // iPad
  }

  /**
   * 스크린샷 촬영
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true })
  }

  /**
   * 특정 요소 스크린샷
   */
  async takeElementScreenshot(selector: string, name: string) {
    await this.page.locator(selector).screenshot({ path: `screenshots/${name}.png` })
  }

  /**
   * 폼 필드 일괄 입력
   */
  async fillForm(fields: Record<string, string>) {
    for (const [field, value] of Object.entries(fields)) {
      const input = this.page.getByLabel(field).or(this.page.getByPlaceholder(field))
      await input.fill(value)
    }
  }

  /**
   * 키보드 단축키 실행
   */
  async pressShortcut(shortcut: string) {
    const isMac = process.platform === 'darwin'
    const modifiedShortcut = isMac ? shortcut.replace('Ctrl', 'Meta') : shortcut
    await this.page.keyboard.press(modifiedShortcut)
  }

  /**
   * 테이블/목록에서 특정 행 선택
   */
  async selectTableRow(identifier: string, column?: string) {
    const selector = column ? `tr:has(td:text("${identifier}"))` : `tr:text("${identifier}")`

    await this.page.locator(selector).click()
  }

  /**
   * 드래그 앤 드롭 수행
   */
  async dragAndDrop(sourceSelector: string, targetSelector: string) {
    await this.page.dragAndDrop(sourceSelector, targetSelector)
  }

  /**
   * 무한 스크롤 테스트
   */
  async scrollToLoadMore(containerSelector = 'body', itemSelector = '[data-testid="item"]') {
    const initialCount = await this.page.locator(itemSelector).count()

    await this.page.locator(containerSelector).hover()
    await this.page.mouse.wheel(0, 1000)
    await this.page.waitForTimeout(1000)

    const newCount = await this.page.locator(itemSelector).count()
    expect(newCount).toBeGreaterThan(initialCount)
  }

  /**
   * 터치 제스처 시뮬레이션 (스와이프)
   */
  async swipe(element: Locator, direction: 'left' | 'right' | 'up' | 'down', distance = 200) {
    const box = await element.boundingBox()
    if (!box) return

    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    let endX = startX
    let endY = startY

    switch (direction) {
      case 'left':
        endX = startX - distance
        break
      case 'right':
        endX = startX + distance
        break
      case 'up':
        endY = startY - distance
        break
      case 'down':
        endY = startY + distance
        break
    }

    await this.page.touchscreen.tap(startX, startY)
    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(endX, endY)
    await this.page.mouse.up()
  }

  /**
   * 성능 메트릭 측정
   */
  async measurePerformance(): Promise<{
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
  }> {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint:
          paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      }
    })

    return metrics
  }

  /**
   * 접근성 검사
   */
  async checkAccessibility() {
    // 키보드 탐색 테스트
    await this.page.keyboard.press('Tab')
    const focusedElement = this.page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // ARIA 라벨 확인
    const mainElement = this.page.getByRole('main')
    await expect(mainElement).toBeVisible()

    return true
  }

  /**
   * 브라우저 콘솔 에러 확인
   */
  async getConsoleErrors(): Promise<string[]> {
    return new Promise(resolve => {
      const errors: string[] = []

      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      // 3초 후 에러 목록 반환
      setTimeout(() => resolve(errors), 3000)
    })
  }

  /**
   * 로컬스토리지 조작
   */
  async setLocalStorage(key: string, value: any) {
    await this.page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key,
      value,
    })
  }

  async getLocalStorage(key: string) {
    return await this.page.evaluate(key => {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    }, key)
  }

  /**
   * 쿠키 조작
   */
  async setCookie(name: string, value: string, options?: { domain?: string; path?: string }) {
    await this.page.context().addCookies([
      {
        name,
        value,
        domain: options?.domain || 'localhost',
        path: options?.path || '/',
      },
    ])
  }

  /**
   * 현재 URL 파라미터 확인
   */
  async getUrlParams(): Promise<Record<string, string>> {
    return await this.page.evaluate(() => {
      const params = new URLSearchParams(window.location.search)
      const result: Record<string, string> = {}
      for (const [key, value] of params) {
        result[key] = value
      }
      return result
    })
  }

  /**
   * 다중 브라우저 컨텍스트 생성 (동시 사용자 시뮬레이션)
   */
  static async createMultipleContexts(
    browser: Browser,
    count: number
  ): Promise<{ context: BrowserContext; page: Page; helpers: PlaywrightHelpers }[]> {
    const contexts = []

    for (let i = 0; i < count; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      const helpers = new PlaywrightHelpers(page)

      contexts.push({ context, page, helpers })
    }

    return contexts
  }

  /**
   * 테스트 정리 (cleanup)
   */
  async cleanup() {
    // 모든 라우트 해제
    await this.page.unrouteAll()

    // 로컬 스토리지 및 세션 스토리지 정리
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  }
}

/**
 * 공통 기대값 검증 함수들
 */
export class ExpectHelpers {
  static async expectUrlContains(page: Page, text: string) {
    await expect(page).toHaveURL(new RegExp(text))
  }

  static async expectElementVisible(page: Page, selector: string) {
    await expect(page.locator(selector)).toBeVisible()
  }

  static async expectElementHidden(page: Page, selector: string) {
    await expect(page.locator(selector)).not.toBeVisible()
  }

  static async expectFormValidation(page: Page, fieldName: string, errorMessage: string) {
    await expect(page.getByText(errorMessage)).toBeVisible()
    await expect(page.getByLabel(fieldName).or(page.getByPlaceholder(fieldName))).toBeFocused()
  }

  static async expectApiCalled(page: Page, pattern: string): Promise<boolean> {
    return new Promise(resolve => {
      let called = false

      page.route(pattern, route => {
        called = true
        route.continue()
      })

      setTimeout(() => resolve(called), 5000)
    })
  }
}
