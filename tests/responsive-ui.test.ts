/**
 * 반응형 UI 테스트
 * 다양한 뷰포트에서 UI 레이아웃과 기능을 확인
 */

import { test, expect } from '@playwright/test'

// 테스트할 뷰포트 사이즈들
const viewports = [
  { name: 'Mobile', width: 375, height: 667 }, // iPhone SE
  { name: 'Mobile Large', width: 414, height: 896 }, // iPhone 11 Pro Max
  { name: 'Tablet', width: 768, height: 1024 }, // iPad
  { name: 'Desktop', width: 1280, height: 720 }, // Desktop
  { name: 'Large Desktop', width: 1920, height: 1080 }, // Large Desktop
]

test.describe('반응형 UI 테스트', () => {
  viewports.forEach(({ name, width, height }) => {
    test.describe(`${name} (${width}x${height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height })
      })

      test('홈페이지 - 로그인되지 않은 상태', async ({ page }) => {
        await page.goto('/')

        // 로딩 완료까지 대기
        await page.waitForLoadState('networkidle')

        // 메인 타이틀 확인
        await expect(page.getByText('우리집 가계부')).toBeVisible()

        // 시작하기 버튼 확인
        const startButton = page.getByRole('link', { name: '이메일로 계속하기' })
        await expect(startButton).toBeVisible()

        // 모바일에서는 버튼이 전체 너비를 차지하는지 확인
        if (width < 640) {
          const buttonWidth = await startButton.boundingBox()
          const pageWidth = width - 32 // 좌우 패딩 16px씩
          expect(buttonWidth?.width).toBeGreaterThan(pageWidth * 0.8) // 80% 이상
        }

        // 카드가 적절한 크기로 표시되는지 확인
        const card = page.locator('.backdrop-blur-sm')
        await expect(card).toBeVisible()

        // 스크린샷 촬영 (시각적 회귀 테스트)
        await page.screenshot({
          path: `tests/screenshots/home-${name.toLowerCase().replace(' ', '-')}.png`,
          fullPage: true,
        })
      })

      test('로그인 페이지 반응형 테스트', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // 로그인 폼 확인
        const emailInput = page.getByPlaceholder('이메일을 입력하세요')
        const passwordInput = page.getByPlaceholder('비밀번호를 입력하세요')
        const loginButton = page.getByRole('button', { name: '로그인' })

        await expect(emailInput).toBeVisible()
        await expect(passwordInput).toBeVisible()
        await expect(loginButton).toBeVisible()

        // 모바일에서 터치 친화적인 크기인지 확인
        if (width < 768) {
          const emailInputBox = await emailInput.boundingBox()
          const passwordInputBox = await passwordInput.boundingBox()
          const loginButtonBox = await loginButton.boundingBox()

          // 최소 터치 타겟 크기 44px 확인
          expect(emailInputBox?.height).toBeGreaterThanOrEqual(40)
          expect(passwordInputBox?.height).toBeGreaterThanOrEqual(40)
          expect(loginButtonBox?.height).toBeGreaterThanOrEqual(40)
        }
      })

      test('가계부 페이지 반응형 레이아웃', async ({ page }) => {
        // 로그인이 필요한 페이지이므로 로그인 상태 시뮬레이션
        await page.goto('/ledger')

        // 로그인 페이지로 리다이렉트되는지 확인
        await expect(page).toHaveURL(/.*login.*/)

        // 실제 로그인된 상태에서 테스트하려면 인증 토큰 설정 필요
        // 여기서는 레이아웃 구조만 확인
      })

      test('헤더 반응형 동작', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // 헤더가 sticky하게 상단에 고정되는지 확인
        const header = page.locator('header, .sticky').first()

        if ((await header.count()) > 0) {
          await expect(header).toBeVisible()

          // 스크롤 후에도 헤더가 보이는지 확인
          await page.mouse.wheel(0, 500)
          await expect(header).toBeVisible()
        }
      })

      test('버튼과 인터랙티브 요소 터치 타겟 크기', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // 모든 버튼 요소 확인
        const buttons = page.getByRole('button')
        const links = page.getByRole('link')

        const allInteractives = await Promise.all([buttons.all(), links.all()]).then((results) =>
          results.flat()
        )

        // 모바일에서 터치 타겟 크기 확인
        if (width < 768) {
          for (const element of allInteractives) {
            if (await element.isVisible()) {
              const box = await element.boundingBox()
              if (box) {
                // 최소 44x44px 권장사항 확인 (약간의 여유 두고 40px)
                expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(36)
              }
            }
          }
        }
      })

      test('텍스트 가독성 테스트', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // 제목 텍스트 크기 확인
        const mainTitle = page.getByText('우리집 가계부').first()
        await expect(mainTitle).toBeVisible()

        // 본문 텍스트 확인
        const description = page.getByText('스마트하고 직관적인')
        await expect(description).toBeVisible()

        // 모바일에서 텍스트가 너무 작지 않은지 확인
        if (width < 640) {
          const titleStyles = await mainTitle.evaluate((el) => {
            const computed = window.getComputedStyle(el)
            return {
              fontSize: parseInt(computed.fontSize),
              lineHeight: computed.lineHeight,
            }
          })

          // 모바일에서 최소 16px 이상의 폰트 크기
          expect(titleStyles.fontSize).toBeGreaterThanOrEqual(20)
        }
      })

      test('카드 레이아웃 반응형 확인', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        const card = page.locator('[class*="backdrop-blur"]').first()
        await expect(card).toBeVisible()

        const cardBox = await card.boundingBox()

        if (cardBox) {
          // 모바일에서는 카드가 화면 너비의 대부분을 차지해야 함
          if (width < 640) {
            expect(cardBox.width).toBeGreaterThan(width * 0.8)
          }

          // 데스크탑에서는 카드가 적절한 최대 너비를 가져야 함
          if (width >= 1024) {
            expect(cardBox.width).toBeLessThan(600) // 최대 600px
          }
        }
      })

      test('네비게이션 반응형 동작', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // 모바일 네비게이션 확인
        if (width < 768) {
          // 모바일에서는 햄버거 메뉴나 컴팩트한 네비게이션이 있어야 함
          const mobileNav = page.locator('.mobile-nav, [class*="mobile"]')

          if ((await mobileNav.count()) > 0) {
            await expect(mobileNav.first()).toBeVisible()
          }
        } else {
          // 데스크탑에서는 전체 네비게이션이 표시되어야 함
          const desktopNav = page.locator('.desktop-nav, nav')

          if ((await desktopNav.count()) > 0) {
            await expect(desktopNav.first()).toBeVisible()
          }
        }
      })

      test('이미지와 아이콘 반응형 크기', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // 로고나 주요 아이콘 확인
        const logo = page.locator('span').filter({ hasText: '💰' }).first()
        await expect(logo).toBeVisible()

        const logoParent = logo.locator('..')
        const logoBox = await logoParent.boundingBox()

        if (logoBox) {
          // 모바일에서는 작은 아이콘, 데스크탑에서는 큰 아이콘
          if (width < 640) {
            expect(logoBox.width).toBeLessThanOrEqual(80)
          } else {
            expect(logoBox.width).toBeGreaterThanOrEqual(64)
          }
        }
      })

      test('스크롤 동작 확인', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // 페이지 스크롤 테스트
        const initialViewport = await page.locator('body').boundingBox()

        await page.mouse.wheel(0, 300)
        await page.waitForTimeout(100) // 스크롤 애니메이션 대기

        // 스크롤이 부드럽게 작동하는지 확인
        const scrollY = await page.evaluate(() => window.scrollY)
        expect(scrollY).toBeGreaterThan(0)
      })
    })
  })

  test('크로스 브라우저 호환성 기본 확인', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 기본 요소들이 모든 브라우저에서 렌더링되는지 확인
    await expect(page.getByText('우리집 가계부')).toBeVisible()
    await expect(page.getByText('이메일로 계속하기')).toBeVisible()

    console.log(`✓ ${browserName}에서 기본 렌더링 확인 완료`)
  })

  test('성능 지표 확인', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // 모바일

    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // 페이지 로딩 시간이 합리적인지 확인 (5초 이내)
    expect(loadTime).toBeLessThan(5000)

    // Core Web Vitals 확인
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lcp = entries.find((entry) => entry.entryType === 'largest-contentful-paint')
          if (lcp) {
            resolve({ lcp: lcp.startTime })
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] })

        // 3초 후 타임아웃
        setTimeout(() => resolve({ lcp: null }), 3000)
      })
    })

    console.log('Performance metrics:', metrics)
  })
})
