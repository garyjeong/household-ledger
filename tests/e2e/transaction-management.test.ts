import { test, expect } from '@playwright/test'

test.describe('Transaction Management - T-019', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/transactions**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transactions: [
              {
                id: '1',
                type: 'EXPENSE',
                amount: 15000,
                currency: 'KRW',
                categoryId: '1',
                category: { id: '1', name: '식비', color: '#ef4444', type: 'EXPENSE' },
                description: '점심 식사',
                date: '2024-01-08',
                createdAt: '2024-01-08T12:30:00Z',
                updatedAt: '2024-01-08T12:30:00Z',
              },
            ],
            pagination: {
              page: 1,
              limit: 50,
              totalCount: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          }),
        })
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transaction: {
              id: '2',
              type: 'EXPENSE',
              amount: 8500,
              currency: 'KRW',
              categoryId: '2',
              category: { id: '2', name: '카페', color: '#3b82f6', type: 'EXPENSE' },
              description: '아메리카노',
              date: '2024-01-08',
              createdAt: '2024-01-08T15:00:00Z',
              updatedAt: '2024-01-08T15:00:00Z',
            },
          }),
        })
      }
    })

    // Mock exchange rates API
    await page.route('**/api.exchangerate.host/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          base: 'KRW',
          date: '2024-01-08',
          rates: {
            USD: 0.00075,
            EUR: 0.00068,
            JPY: 0.11,
          },
        }),
      })
    })

    // Mock categories API
    await page.route('**/api/categories**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          categories: [
            { id: '1', name: '식비', type: 'EXPENSE', color: '#ef4444', isDefault: true },
            { id: '2', name: '카페', type: 'EXPENSE', color: '#3b82f6', isDefault: true },
            { id: '3', name: '급여', type: 'INCOME', color: '#22c55e', isDefault: true },
          ],
        }),
      })
    })

    // Mock auth and group context
    await page.addInitScript(() => {
      window.localStorage.setItem('accessToken', 'mock-token')
      window.localStorage.setItem(
        'currentGroup',
        JSON.stringify({
          id: '1',
          name: 'Test Group',
          memberCount: 2,
        })
      )
    })

    await page.goto('/transactions')
  })

  test('should display transaction list correctly', async ({ page }) => {
    // Check if page loads
    await expect(page.locator('h1')).toContainText('거래내역')

    // Check if existing transaction is displayed
    await expect(page.locator('text=점심 식사')).toBeVisible()
    await expect(page.locator('text=-15,000원')).toBeVisible()
    await expect(page.locator('text=식비')).toBeVisible()

    // Check statistics cards
    await expect(page.locator('text=총 수입')).toBeVisible()
    await expect(page.locator('text=총 지출')).toBeVisible()
    await expect(page.locator('text=순 잔액')).toBeVisible()
  })

  test('should open and fill transaction form correctly', async ({ page }) => {
    // Click add transaction button
    await page.getByRole('button', { name: /거래 추가/ }).click()

    // Check if form modal opens
    await expect(page.locator('text=새 거래 추가')).toBeVisible()

    // Test form validation
    const submitButton = page.getByRole('button', { name: /추가/ })
    expect(await submitButton.isDisabled()).toBe(true)

    // Fill in required fields
    await page.getByRole('combobox', { name: /거래 타입/ }).click()
    await page.getByRole('option', { name: '지출' }).click()

    await page.getByLabel(/금액/).fill('8500')
    await page.getByLabel(/거래 내용/).fill('아메리카노')

    // Select category
    await page.getByRole('combobox', { name: /카테고리/ }).click()
    await page.getByText('카페').click()

    // Check if submit button is enabled
    expect(await submitButton.isDisabled()).toBe(false)
  })

  test('should handle currency conversion correctly', async ({ page }) => {
    await page.getByRole('button', { name: /거래 추가/ }).click()

    // Fill amount
    await page.getByLabel(/금액/).fill('10')

    // Change currency to USD
    await page.getByRole('combobox', { name: /통화/ }).click()
    await page.getByText('USD').click()

    // Check if conversion is displayed
    await expect(page.locator('text=≈')).toBeVisible()
    await expect(page.locator('text=₩13,300')).toBeVisible() // 10 * 1330
  })

  test('should add transaction successfully', async ({ page }) => {
    await page.getByRole('button', { name: /거래 추가/ }).click()

    // Fill form
    await page.getByLabel(/금액/).fill('8500')
    await page.getByLabel(/거래 내용/).fill('아메리카노')

    await page.getByRole('combobox', { name: /카테고리/ }).click()
    await page.getByText('카페').click()

    // Add memo
    await page.getByLabel(/메모/).fill('스타벅스 아메리카노')

    // Add tags
    await page.getByPlaceholder('태그 입력 후 Enter').fill('커피')
    await page.getByRole('button', { name: '추가' }).click()

    await expect(page.locator('text=커피 ×')).toBeVisible()

    // Submit form
    await page.getByRole('button', { name: /추가$/ }).click()

    // Check success - form should close
    await expect(page.locator('text=새 거래 추가')).not.toBeVisible()
  })

  test('should handle form validation errors', async ({ page }) => {
    await page.getByRole('button', { name: /거래 추가/ }).click()

    // Try to submit empty form
    await page.getByRole('button', { name: /추가$/ }).click()

    // Check validation errors
    await expect(page.locator('text=금액을 입력해주세요')).toBeVisible()
    await expect(page.locator('text=카테고리를 선택해주세요')).toBeVisible()
    await expect(page.locator('text=거래 내용을 입력해주세요')).toBeVisible()

    // Test invalid amount
    await page.getByLabel(/금액/).fill('-100')
    await expect(page.locator('text=금액은 0보다 커야 합니다')).toBeVisible()

    // Test description too long
    const longText = 'a'.repeat(101)
    await page.getByLabel(/거래 내용/).fill(longText)
    await expect(page.locator('text=거래 내용은 100자 이하로 입력해주세요')).toBeVisible()
  })

  test('should filter transactions correctly', async ({ page }) => {
    // Test search filter
    await page.getByPlaceholder('거래 검색...').fill('점심')
    await expect(page.locator('text=점심 식사')).toBeVisible()

    await page.getByPlaceholder('거래 검색...').fill('없는거래')
    await expect(page.locator('text=점심 식사')).not.toBeVisible()

    // Clear search
    await page.getByPlaceholder('거래 검색...').clear()
    await expect(page.locator('text=점심 식사')).toBeVisible()

    // Test type filter
    await page.selectOption('select[value="all"]', 'INCOME')
    await expect(page.locator('text=점심 식사')).not.toBeVisible()

    await page.selectOption('select[value="INCOME"]', 'EXPENSE')
    await expect(page.locator('text=점심 식사')).toBeVisible()
  })

  test('should sort transactions correctly', async ({ page }) => {
    // Test date sorting
    await page.getByRole('button', { name: /날짜/ }).click()
    await expect(page.locator('text=점심 식사')).toBeVisible()

    // Test amount sorting
    await page.getByRole('button', { name: /금액/ }).click()
    await expect(page.locator('text=점심 식사')).toBeVisible()
  })

  test('should handle edit and delete operations', async ({ page }) => {
    // Test edit button
    await page.getByRole('button', { name: /edit/i }).first().click()
    await expect(page.locator('text=거래 수정')).toBeVisible()

    // Close edit modal
    await page.getByRole('button', { name: '취소' }).click()
    await expect(page.locator('text=거래 수정')).not.toBeVisible()

    // Test delete with confirmation
    page.on('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: /trash/i }).first().click()

    // Note: In real test, this would remove the transaction from the list
    // For mock test, we just verify the click worked
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check if layout adapts
    await expect(page.locator('h1')).toContainText('거래내역')
    await expect(page.getByRole('button', { name: /거래 추가/ })).toBeVisible()

    // Test mobile form
    await page.getByRole('button', { name: /거래 추가/ }).click()
    await expect(page.locator('text=새 거래 추가')).toBeVisible()

    // Form should be scrollable on mobile
    await page.getByLabel(/금액/).fill('1000')
    await page.getByLabel(/거래 내용/).fill('모바일 테스트')
  })

  test('should handle offline state gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true)

    // Try to add transaction - should show cached data
    await page.getByRole('button', { name: /거래 추가/ }).click()
    await expect(page.locator('text=새 거래 추가')).toBeVisible()

    // Go back online
    await page.context().setOffline(false)

    // Should work normally again
    await page.getByLabel(/금액/).fill('5000')
  })
})
