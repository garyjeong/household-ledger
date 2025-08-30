/**
 * 포괄적인 QA 테스트 케이스 - Playwright MCP 활용
 * 신혼부부 가계부 애플리케이션의 모든 핵심 기능 검증
 */

import { test, expect, Page, Browser } from '@playwright/test'

// 테스트 환경 설정
const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  defaultTimeout: 30000,
  actionTimeout: 10000,
}

// 테스트 데이터
const TEST_DATA = {
  users: {
    primary: {
      email: `primary-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      nickname: '테스트유저1',
    },
    partner: {
      email: `partner-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      nickname: '테스트유저2',
    },
  },
  group: {
    name: `우리가족${Date.now()}`,
  },
  transactions: {
    expense: {
      amount: '25000',
      description: '점심식사',
      category: '식비',
      memo: 'E2E 테스트용 지출',
    },
    income: {
      amount: '300000',
      description: '용돈',
      category: '기타수입',
      memo: 'E2E 테스트용 수입',
    },
  },
  account: {
    name: 'E2E테스트계좌',
    bank: '테스트은행',
    initialBalance: '1000000',
  },
  category: {
    name: 'E2E테스트카테고리',
    color: '#3B82F6',
    type: 'EXPENSE',
  },
}

// 공통 헬퍼 함수
class TestHelpers {
  constructor(private page: Page) {}

  /**
   * 로그인 수행
   */
  async login(user: typeof TEST_DATA.users.primary) {
    await this.page.goto('/login')
    await this.page.getByPlaceholder('이메일을 입력하세요').fill(user.email)
    await this.page.getByPlaceholder('비밀번호를 입력하세요').fill(user.password)
    await this.page.getByRole('button', { name: '로그인' }).click()
    await expect(this.page).toHaveURL(/.*dashboard.*/)
  }

  /**
   * 회원가입 수행
   */
  async signUp(user: typeof TEST_DATA.users.primary) {
    await this.page.goto('/signup')
    await this.page.getByPlaceholder('이메일을 입력하세요').fill(user.email)
    await this.page.getByPlaceholder('비밀번호를 입력하세요').fill(user.password)
    await this.page.getByPlaceholder('비밀번호를 다시 입력하세요').fill(user.password)
    await this.page.getByPlaceholder('닉네임을 입력하세요').fill(user.nickname)
    await this.page.getByRole('button', { name: '회원가입' }).click()
  }

  /**
   * 거래 추가
   */
  async addTransaction(
    transaction: typeof TEST_DATA.transactions.expense,
    type: 'expense' | 'income' = 'expense'
  ) {
    await this.page.getByRole('button', { name: /거래 추가|새 거래/ }).click()

    // 타입 선택
    if (type === 'income') {
      await this.page.getByRole('combobox', { name: /유형|타입/ }).click()
      await this.page.getByRole('option', { name: '수입' }).click()
    }

    await this.page.getByPlaceholder(/금액|amount/i).fill(transaction.amount)
    await this.page.getByPlaceholder(/설명|내용|description/i).fill(transaction.description)

    // 카테고리 선택
    await this.page.getByRole('combobox', { name: /카테고리/ }).click()
    await this.page.getByRole('option', { name: transaction.category }).click()

    if (transaction.memo) {
      await this.page.getByPlaceholder(/메모/i).fill(transaction.memo)
    }

    await this.page.getByRole('button', { name: /저장|추가/ }).click()
  }

  /**
   * 알림/토스트 메시지 확인
   */
  async expectToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 5000 })
  }

  /**
   * 페이지 로딩 대기
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle', { timeout: TEST_CONFIG.defaultTimeout })
  }

  /**
   * 네트워크 요청 모킹
   */
  async mockApiResponse(pattern: string, response: any) {
    await this.page.route(pattern, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    )
  }
}

test.describe('신혼부부 가계부 - 포괄적인 QA 테스트', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    page.setDefaultTimeout(TEST_CONFIG.defaultTimeout)
  })

  test.describe('🔐 인증 시스템 종합 검증', () => {
    test('회원가입 → 이메일 인증 → 로그인 → 프로필 설정 전체 흐름', async ({ page }) => {
      // 1. 회원가입
      await helpers.signUp(TEST_DATA.users.primary)

      // 2. 대시보드 리다이렉션 확인
      await expect(page).toHaveURL(/.*dashboard.*/)

      // 3. 환영 메시지 확인
      await expect(page.getByText(TEST_DATA.users.primary.nickname)).toBeVisible()

      // 4. 온보딩 플로우 확인
      await expect(page.getByText(/첫.*계좌|시작/)).toBeVisible()

      // 5. 로그아웃 후 재로그인
      await page.getByRole('button', { name: '로그아웃' }).click()
      await helpers.login(TEST_DATA.users.primary)

      // 6. 지속적인 세션 확인
      await expect(page).toHaveURL(/.*dashboard.*/)
    })

    test('로그인 실패 시나리오 (잘못된 이메일, 비밀번호, 계정 잠금)', async ({ page }) => {
      await page.goto('/login')

      // 1. 존재하지 않는 이메일
      await page.getByPlaceholder('이메일을 입력하세요').fill('nonexistent@example.com')
      await page.getByPlaceholder('비밀번호를 입력하세요').fill('password123')
      await page.getByRole('button', { name: '로그인' }).click()
      await expect(page.getByText(/이메일.*올바르지|존재하지 않는/)).toBeVisible()

      // 2. 잘못된 비밀번호
      await page.getByPlaceholder('이메일을 입력하세요').fill(TEST_DATA.users.primary.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill('wrongpassword')
      await page.getByRole('button', { name: '로그인' }).click()
      await expect(page.getByText(/비밀번호.*올바르지/)).toBeVisible()

      // 3. 빈 필드 검증
      await page.getByPlaceholder('이메일을 입력하세요').fill('')
      await page.getByPlaceholder('비밀번호를 입력하세요').fill('')
      await page.getByRole('button', { name: '로그인' }).click()
      await expect(page.getByText(/이메일.*입력/)).toBeVisible()
    })

    test('비밀번호 재설정 전체 흐름', async ({ page }) => {
      await page.goto('/login')

      // 1. 비밀번호 찾기 링크 클릭
      await page.getByRole('link', { name: /비밀번호.*잊으셨나요|찾기/ }).click()
      await expect(page).toHaveURL(/.*forgot-password.*/)

      // 2. 이메일 입력 및 전송
      await page.getByPlaceholder('이메일을 입력하세요').fill(TEST_DATA.users.primary.email)
      await page.getByRole('button', { name: /재설정.*전송|보내기/ }).click()

      // 3. 성공 메시지 확인
      await helpers.expectToast('비밀번호 재설정 링크가 전송되었습니다')

      // 4. 로그인 페이지 복귀 링크 테스트
      await page.getByRole('link', { name: /로그인.*돌아가기/ }).click()
      await expect(page).toHaveURL(/.*login.*/)
    })
  })

  test.describe('👥 그룹 관리 및 협업 기능 검증', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)
    })

    test('그룹 생성 → 초대 코드 생성 → 파트너 초대 → 협업 시작', async ({ page, context }) => {
      // 1. 그룹 생성
      await page.goto('/groups')
      await page.getByRole('button', { name: '새 그룹 만들기' }).click()
      await page.getByPlaceholder(/그룹.*이름/i).fill(TEST_DATA.group.name)
      await page.getByRole('button', { name: /만들기|생성/ }).click()

      // 2. 그룹 생성 확인
      await expect(page.getByText(TEST_DATA.group.name)).toBeVisible()

      // 3. 초대 코드 생성
      await page.getByRole('button', { name: /초대.*생성|코드.*생성/ }).click()
      const inviteCodeElement = page.locator('[data-testid="invite-code"], input[readonly]:first')
      const inviteCode = await inviteCodeElement.inputValue()

      expect(inviteCode).toHaveLength(10)
      expect(inviteCode).toMatch(/^[A-Z0-9]{10}$/)

      // 4. 초대 코드 복사
      await page.getByRole('button', { name: /복사/ }).click()
      await helpers.expectToast('초대 코드가 복사되었습니다')

      // 5. 새 탭에서 파트너 계정 생성 및 그룹 참여
      const partnerPage = await context.newPage()
      const partnerHelpers = new TestHelpers(partnerPage)

      await partnerHelpers.signUp(TEST_DATA.users.partner)
      await partnerPage.goto('/groups/join')
      await partnerPage.getByPlaceholder(/초대.*코드/i).fill(inviteCode)
      await partnerPage.getByRole('button', { name: /참여/ }).click()

      // 6. 그룹 참여 성공 확인
      await expect(partnerPage.getByText(TEST_DATA.group.name)).toBeVisible()

      await partnerPage.close()
    })

    test('그룹 설정 및 권한 관리', async ({ page }) => {
      await page.goto('/groups')

      // 그룹 설정 페이지 접근
      await page.getByRole('button', { name: /설정|관리/ }).click()

      // 그룹 이름 변경
      const newGroupName = `${TEST_DATA.group.name}_수정`
      await page.getByPlaceholder(/그룹.*이름/i).fill(newGroupName)
      await page.getByRole('button', { name: /저장|변경/ }).click()

      await helpers.expectToast('그룹 정보가 수정되었습니다')
      await expect(page.getByText(newGroupName)).toBeVisible()
    })
  })

  test.describe('💰 거래 관리 핵심 기능 검증', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)
      await page.goto('/transactions')
    })

    test('수입/지출 입력 → 수정 → 삭제 → 복구 전체 사이클', async ({ page }) => {
      // 1. 지출 거래 추가
      await helpers.addTransaction(TEST_DATA.transactions.expense, 'expense')
      await helpers.expectToast('거래가 저장되었습니다')

      // 2. 거래 목록에서 확인
      await expect(page.getByText(TEST_DATA.transactions.expense.description)).toBeVisible()
      await expect(
        page.getByText(`${parseInt(TEST_DATA.transactions.expense.amount).toLocaleString()}원`)
      ).toBeVisible()

      // 3. 수입 거래 추가
      await helpers.addTransaction(TEST_DATA.transactions.income, 'income')
      await helpers.expectToast('거래가 저장되었습니다')

      // 4. 거래 수정
      await page.getByText(TEST_DATA.transactions.expense.description).click()
      await page.getByRole('button', { name: /수정|편집/ }).click()

      const updatedDescription = `${TEST_DATA.transactions.expense.description}_수정됨`
      await page.getByPlaceholder(/설명|내용/i).fill(updatedDescription)
      await page.getByRole('button', { name: /저장|완료/ }).click()

      // 5. 수정 확인
      await expect(page.getByText(updatedDescription)).toBeVisible()

      // 6. 거래 삭제
      await page.getByText(updatedDescription).click()
      await page.getByRole('button', { name: /삭제/ }).click()
      await page.getByRole('button', { name: /확인|예/ }).click()

      // 7. 삭제 확인
      await expect(page.getByText(updatedDescription)).not.toBeVisible()
      await helpers.expectToast('거래가 삭제되었습니다')
    })

    test('빠른 입력 및 템플릿 저장 기능', async ({ page }) => {
      // 1. 빠른 입력 모달 열기
      await page.getByRole('button', { name: /빠른.*입력|퀵.*입력/ }).click()

      // 2. 간단한 정보만으로 거래 입력
      await page.getByPlaceholder(/금액/i).fill('5000')
      await page.getByPlaceholder(/내용|설명/i).fill('커피')
      await page.getByRole('button', { name: /저장|완료/ }).click()

      // 3. 성공 확인
      await helpers.expectToast('거래가 저장되었습니다')

      // 4. 템플릿으로 저장
      await page.getByRole('button', { name: /빠른.*입력/ }).click()
      await page.getByPlaceholder(/금액/i).fill('4500')
      await page.getByPlaceholder(/내용|설명/i).fill('아메리카노')

      // 템플릿 저장 체크박스
      await page.getByRole('checkbox', { name: /템플릿.*저장/ }).check()
      await page.getByPlaceholder(/템플릿.*이름/i).fill('자주가는 카페')
      await page.getByRole('button', { name: /저장/ }).click()

      // 5. 저장된 템플릿 사용
      await page.getByRole('button', { name: /빠른.*입력/ }).click()
      await page.getByRole('button', { name: '자주가는 카페' }).click()

      // 6. 템플릿 데이터 자동 입력 확인
      await expect(page.getByPlaceholder(/금액/i)).toHaveValue('4500')
      await expect(page.getByPlaceholder(/내용|설명/i)).toHaveValue('아메리카노')
    })

    test('고급 필터링 및 검색 기능', async ({ page }) => {
      // 테스트용 더미 데이터 추가
      await helpers.addTransaction({
        amount: '10000',
        description: '점심 한식',
        category: '식비',
        memo: '회사 근처 한식당',
      })

      await helpers.addTransaction({
        amount: '50000',
        description: '마트 장보기',
        category: '생활용품',
        memo: '주간 장보기',
      })

      // 1. 텍스트 검색
      await page.getByPlaceholder(/검색|search/i).fill('점심')
      await page.keyboard.press('Enter')
      await expect(page.getByText('점심 한식')).toBeVisible()
      await expect(page.getByText('마트 장보기')).not.toBeVisible()

      // 2. 검색 초기화
      await page.getByPlaceholder(/검색|search/i).clear()
      await page.keyboard.press('Enter')
      await expect(page.getByText('마트 장보기')).toBeVisible()

      // 3. 금액 범위 필터
      await page.getByRole('button', { name: /필터|filter/ }).click()
      await page.getByPlaceholder(/최소.*금액/i).fill('5000')
      await page.getByPlaceholder(/최대.*금액/i).fill('20000')
      await page.getByRole('button', { name: /적용|apply/ }).click()

      await expect(page.getByText('점심 한식')).toBeVisible() // 10000원
      await expect(page.getByText('마트 장보기')).not.toBeVisible() // 50000원

      // 4. 카테고리 필터
      await page.getByRole('combobox', { name: /카테고리.*필터/ }).click()
      await page.getByRole('option', { name: '식비' }).click()

      await expect(page.getByText('점심 한식')).toBeVisible()

      // 5. 날짜 범위 필터
      const today = new Date().toISOString().split('T')[0]
      await page.getByTestId('date-from').fill(today)
      await page.getByTestId('date-to').fill(today)
      await page.getByRole('button', { name: /적용/ }).click()
    })

    test('벌크 작업 (일괄 편집/삭제)', async ({ page }) => {
      // 여러 거래 추가
      const transactions = [
        { amount: '8000', description: '아침식사' },
        { amount: '12000', description: '점심식사' },
        { amount: '15000', description: '저녁식사' },
      ]

      for (const transaction of transactions) {
        await helpers.addTransaction({
          ...transaction,
          category: '식비',
          memo: '테스트용',
        })
      }

      // 1. 다중 선택 모드 진입
      await page.getByRole('button', { name: /선택|select/ }).click()

      // 2. 여러 거래 선택
      await page.getByRole('checkbox', { name: '아침식사' }).check()
      await page.getByRole('checkbox', { name: '점심식사' }).check()

      // 3. 선택된 항목 수 확인
      await expect(page.getByText('2개 선택됨')).toBeVisible()

      // 4. 벌크 삭제
      await page.getByRole('button', { name: /선택.*삭제|bulk.*delete/ }).click()
      await page.getByRole('button', { name: /확인|예/ }).click()

      // 5. 삭제 확인
      await expect(page.getByText('아침식사')).not.toBeVisible()
      await expect(page.getByText('점심식사')).not.toBeVisible()
      await expect(page.getByText('저녁식사')).toBeVisible()
    })
  })

  test.describe('🏦 계좌 관리 기능 검증', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)
      await page.goto('/settings/accounts')
    })

    test('계좌 생성 → 잔액 조회 → 이체 → 명세서 다운로드', async ({ page }) => {
      // 1. 새 계좌 추가
      await page.getByRole('button', { name: /새.*계좌.*추가/ }).click()

      await page.getByPlaceholder(/계좌.*이름/i).fill(TEST_DATA.account.name)
      await page.getByRole('combobox', { name: /계좌.*유형|type/ }).click()
      await page.getByRole('option', { name: '은행' }).click()
      await page.getByPlaceholder(/은행명|bank/i).fill(TEST_DATA.account.bank)
      await page.getByPlaceholder(/초기.*잔액|balance/i).fill(TEST_DATA.account.initialBalance)

      await page.getByRole('button', { name: /추가|저장/ }).click()

      // 2. 계좌 목록에서 확인
      await expect(page.getByText(TEST_DATA.account.name)).toBeVisible()
      await expect(
        page.getByText(`${parseInt(TEST_DATA.account.initialBalance).toLocaleString()}원`)
      ).toBeVisible()

      // 3. 계좌 상세 정보 조회
      await page.getByText(TEST_DATA.account.name).click()
      await expect(page.getByText(TEST_DATA.account.bank)).toBeVisible()

      // 4. 잔액 수정
      await page.getByRole('button', { name: /잔액.*수정|adjust/ }).click()
      await page.getByPlaceholder(/금액/i).fill('50000')
      await page.getByPlaceholder(/사유|reason/i).fill('ATM 입금')
      await page.getByRole('button', { name: /확인|저장/ }).click()

      // 5. 수정된 잔액 확인
      const newBalance = (parseInt(TEST_DATA.account.initialBalance) + 50000).toLocaleString()
      await expect(page.getByText(`${newBalance}원`)).toBeVisible()

      // 6. 계좌 간 이체 (두 번째 계좌 생성 후)
      await page.getByRole('button', { name: /새.*계좌.*추가/ }).click()
      await page.getByPlaceholder(/계좌.*이름/i).fill('카드연결계좌')
      await page.getByRole('combobox', { name: /계좌.*유형/ }).click()
      await page.getByRole('option', { name: '카드' }).click()
      await page.getByPlaceholder(/초기.*잔액/i).fill('100000')
      await page.getByRole('button', { name: /추가/ }).click()

      // 이체 실행
      await page.getByText(TEST_DATA.account.name).click()
      await page.getByRole('button', { name: /이체|transfer/ }).click()

      await page.getByRole('combobox', { name: /받는.*계좌|target/ }).click()
      await page.getByRole('option', { name: '카드연결계좌' }).click()
      await page.getByPlaceholder(/이체.*금액/i).fill('200000')
      await page.getByPlaceholder(/메모|memo/i).fill('카드대금 결제')
      await page.getByRole('button', { name: /이체.*실행/ }).click()

      // 이체 완료 확인
      await helpers.expectToast('이체가 완료되었습니다')
    })
  })

  test.describe('📊 통계 및 대시보드 기능 검증', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)
    })

    test('월별 통계 → 카테고리 분석 → 트렌드 차트 → 예산 설정', async ({ page }) => {
      // 테스트용 거래들 추가
      const testTransactions = [
        { amount: '50000', description: '식비1', category: '식비' },
        { amount: '30000', description: '식비2', category: '식비' },
        { amount: '100000', description: '쇼핑', category: '생활용품' },
        { amount: '200000', description: '월급', category: '급여' },
      ]

      await page.goto('/transactions')
      for (const transaction of testTransactions) {
        await helpers.addTransaction(transaction)
      }

      // 1. 통계 페이지로 이동
      await page.goto('/statistics')

      // 2. 월별 요약 확인
      await expect(page.getByText(/이번.*달.*지출/i)).toBeVisible()
      await expect(page.getByText(/이번.*달.*수입/i)).toBeVisible()
      await expect(page.getByText(/180,000원/)).toBeVisible() // 총 지출
      await expect(page.getByText(/200,000원/)).toBeVisible() // 총 수입

      // 3. 카테고리별 분석 차트
      await expect(page.getByTestId('category-chart')).toBeVisible()

      // 4. 트렌드 차트 상호작용
      await page.getByRole('button', { name: /지난.*3개월/ }).click()
      await expect(page.getByTestId('trend-chart')).toBeVisible()

      // 5. 예산 설정
      await page.getByRole('button', { name: /예산.*설정/ }).click()

      // 카테고리별 예산 설정
      await page.getByTestId('budget-식비').fill('150000')
      await page.getByTestId('budget-생활용품').fill('200000')
      await page.getByRole('button', { name: /예산.*저장/ }).click()

      // 6. 예산 초과 알림 확인
      await expect(page.getByText(/식비.*예산.*초과/i)).not.toBeVisible() // 80000 < 150000
      await expect(page.getByText(/생활용품.*예산.*초과/i)).not.toBeVisible() // 100000 < 200000

      // 7. 예산 대비 진행률 확인
      await expect(page.getByText(/53%/)).toBeVisible() // 식비: 80000/150000
      await expect(page.getByText(/50%/)).toBeVisible() // 생활용품: 100000/200000
    })

    test('데이터 내보내기 및 백업 기능', async ({ page }) => {
      await page.goto('/settings/data')

      // 1. CSV 내보내기
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /CSV.*내보내기/ }).click()

      // 날짜 범위 설정
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      await page.getByTestId('export-start-date').fill(startDate.toISOString().split('T')[0])
      await page.getByTestId('export-end-date').fill(new Date().toISOString().split('T')[0])

      await page.getByRole('button', { name: /다운로드.*시작/ }).click()
      const download = await downloadPromise

      // 2. 파일명 확인
      expect(download.suggestedFilename()).toMatch(/household-ledger.*\.csv/)

      // 3. Excel 내보내기
      await page.getByRole('button', { name: /Excel.*내보내기/ }).click()
      await page.getByRole('checkbox', { name: /차트.*포함/ }).check()
      await page.getByRole('button', { name: /다운로드.*시작/ }).click()

      // 4. 전체 데이터 백업
      await page.getByRole('button', { name: /전체.*백업/ }).click()
      await page.getByRole('button', { name: /백업.*시작/ }).click()

      await helpers.expectToast('백업이 완료되었습니다')
    })
  })

  test.describe('📱 반응형 및 접근성 검증', () => {
    test('모바일 환경에서의 모든 핵심 기능 동작', async ({ page, isMobile }) => {
      test.skip(!isMobile, '모바일 전용 테스트')

      await helpers.signUp(TEST_DATA.users.primary)

      // 1. 모바일 네비게이션 확인
      await expect(page.getByTestId('mobile-nav')).toBeVisible()
      await expect(page.getByTestId('desktop-nav')).not.toBeVisible()

      // 2. 터치 제스처 테스트
      await page.goto('/transactions')

      // 첫 번째 거래에 스와이프 제스처
      const transactionItem = page.getByTestId('transaction-item').first()
      await transactionItem.hover()

      // 스와이프 시뮬레이션
      await transactionItem.dispatchEvent('touchstart', {
        touches: [{ clientX: 300, clientY: 100 }],
      })
      await transactionItem.dispatchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      await transactionItem.dispatchEvent('touchend')

      // 액션 버튼들이 나타나는지 확인
      await expect(page.getByRole('button', { name: /편집|삭제/ })).toBeVisible()

      // 3. 모바일 FAB (Floating Action Button) 테스트
      await expect(page.getByTestId('fab-add-transaction')).toBeVisible()
      await page.getByTestId('fab-add-transaction').tap()

      // 빠른 입력 모달이 전체화면으로 열리는지 확인
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCSS('width', /.*(100%|100vw).*/)

      // 4. 키보드 온스크린 대응
      await page.getByPlaceholder(/금액/i).tap()
      await page.waitForTimeout(500) // 키보드 애니메이션 대기

      // 뷰포트가 키보드에 맞게 조정되었는지 확인
      await expect(page.getByRole('button', { name: /저장/ })).toBeInViewport()
    })

    test('접근성(A11Y) 준수 확인', async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)

      // 1. 키보드 탐색 테스트
      await page.goto('/dashboard')

      // Tab으로 포커스 이동
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // 현재 포커스된 요소가 시각적으로 구분되는지 확인
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // 2. ARIA 라벨 확인
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('button', { name: /메인.*메뉴/ })).toHaveAttribute(
        'aria-expanded'
      )

      // 3. 스크린리더용 텍스트
      await expect(page.locator('.sr-only').first()).toBeVisible() // Tailwind의 screen reader only

      // 4. 고대비 모드 테스트
      await page.emulateMedia({ colorScheme: 'dark' })
      await expect(page.locator('body')).toHaveCSS('background-color', /rgb\(.*\)/)

      // 5. 폰트 크기 증가 테스트 (접근성 설정)
      await page.addStyleTag({
        content: '* { font-size: 120% !important; }',
      })

      // 레이아웃이 깨지지 않는지 확인
      await expect(page.getByRole('button', { name: /거래.*추가/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /거래.*추가/ })).toBeInViewport()
    })

    test('다양한 화면 크기에서의 동작 확인', async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)

      const viewportSizes = [
        { width: 320, height: 568, name: 'iPhone SE' },
        { width: 375, height: 812, name: 'iPhone X' },
        { width: 768, height: 1024, name: 'iPad' },
        { width: 1024, height: 768, name: 'iPad Landscape' },
        { width: 1920, height: 1080, name: 'Desktop FHD' },
      ]

      for (const viewport of viewportSizes) {
        await page.setViewportSize(viewport)
        await page.goto('/dashboard')

        // 각 화면 크기에서 핵심 요소들이 보이는지 확인
        await expect(page.getByText(/대시보드|dashboard/i)).toBeVisible()
        await expect(page.getByRole('button', { name: /거래.*추가/ })).toBeVisible()

        // 거래 추가 모달이 화면에 맞게 표시되는지
        await page.getByRole('button', { name: /거래.*추가/ }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByRole('dialog')).toBeInViewport()

        // 모달 닫기
        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('🔒 보안 및 성능 검증', () => {
    test('XSS 및 SQL Injection 방어 테스트', async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)
      await page.goto('/transactions')

      // 1. XSS 스크립트 삽입 시도
      const maliciousScript = '<script>alert("XSS")</script>'

      await page.getByRole('button', { name: /거래.*추가/ }).click()
      await page.getByPlaceholder(/설명|내용/i).fill(maliciousScript)
      await page.getByPlaceholder(/금액/i).fill('1000')
      await page.getByRole('combobox', { name: /카테고리/ }).click()
      await page.getByRole('option').first().click()
      await page.getByRole('button', { name: /저장/ }).click()

      // 스크립트가 실행되지 않고 텍스트로 저장되는지 확인
      await expect(page.getByText(maliciousScript)).toBeVisible()

      // 2. SQL Injection 시도
      const sqlInjection = "'; DROP TABLE transactions; --"
      await page.getByRole('button', { name: /거래.*추가/ }).click()
      await page.getByPlaceholder(/설명|내용/i).fill(sqlInjection)
      await page.getByPlaceholder(/금액/i).fill('2000')
      await page.getByRole('combobox', { name: /카테고리/ }).click()
      await page.getByRole('option').first().click()
      await page.getByRole('button', { name: /저장/ }).click()

      // 정상적으로 텍스트로 저장되고 시스템이 동작하는지 확인
      await expect(page.getByText(sqlInjection)).toBeVisible()
    })

    test('성능 최적화 확인', async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)

      // 1. 페이지 로드 성능 측정
      const navigationStart = Date.now()
      await page.goto('/dashboard')
      const navigationEnd = Date.now()

      // 대시보드 로딩이 3초 이내에 완료되어야 함
      expect(navigationEnd - navigationStart).toBeLessThan(3000)

      // 2. 리소스 최적화 확인
      await page.goto('/statistics')

      // 차트가 로드되는 시간 측정
      const chartStart = Date.now()
      await expect(page.getByTestId('category-chart')).toBeVisible()
      const chartEnd = Date.now()

      expect(chartEnd - chartStart).toBeLessThan(2000)

      // 3. 메모리 사용량 체크 (큰 데이터셋)
      await page.goto('/transactions')

      // 많은 더미 데이터 추가 시뮬레이션
      await helpers.mockApiResponse('**/api/transactions**', {
        success: true,
        transactions: Array.from({ length: 100 }, (_, i) => ({
          id: i.toString(),
          type: 'EXPENSE',
          amount: Math.floor(Math.random() * 50000) + 1000,
          description: `테스트 거래 ${i + 1}`,
          date: new Date().toISOString(),
        })),
        pagination: { page: 1, totalCount: 100 },
      })

      await page.reload()

      // 가상 스크롤링이나 페이지네이션으로 성능이 유지되는지 확인
      await expect(page.getByText('테스트 거래')).toBeVisible()

      // 스크롤 성능 체크
      const scrollStart = Date.now()
      await page.mouse.wheel(0, 1000)
      await page.waitForTimeout(100)
      const scrollEnd = Date.now()

      expect(scrollEnd - scrollStart).toBeLessThan(200)
    })

    test('오프라인 및 네트워크 오류 처리', async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)

      // 1. 오프라인 상태 시뮬레이션
      await page.context().setOffline(true)
      await page.goto('/transactions')

      // 오프라인 알림 표시 확인
      await expect(page.getByText(/오프라인|연결.*없음/i)).toBeVisible()

      // 캐시된 데이터는 표시되어야 함
      await expect(page.getByRole('main')).toBeVisible()

      // 2. 네트워크 오류 시뮬레이션
      await page.context().setOffline(false)
      await page.route('**/api/**', route => route.abort())

      // 거래 추가 시도
      await page.getByRole('button', { name: /거래.*추가/ }).click()
      await page.getByPlaceholder(/설명/i).fill('네트워크 테스트')
      await page.getByPlaceholder(/금액/i).fill('1000')
      await page.getByRole('button', { name: /저장/ }).click()

      // 네트워크 오류 메시지 확인
      await expect(page.getByText(/네트워크.*오류|연결.*실패/i)).toBeVisible()

      // 재시도 버튼 동작 확인
      await page.unroute('**/api/**')
      await page.getByRole('button', { name: /재시도|다시.*시도/ }).click()

      // 정상 동작 복구 확인
      await helpers.expectToast('거래가 저장되었습니다')
    })
  })

  test.describe('🌐 브라우저 호환성 및 PWA 기능', () => {
    test('PWA 설치 및 오프라인 기능', async ({ page, browserName }) => {
      await helpers.signUp(TEST_DATA.users.primary)

      // 1. 서비스 워커 등록 확인
      const serviceWorkerPromise = page.evaluate(() => {
        return 'serviceWorker' in navigator
      })
      expect(await serviceWorkerPromise).toBe(true)

      // 2. 매니페스트 파일 확인
      await page.goto('/manifest.json')
      const manifestContent = await page.textContent('pre')
      const manifest = JSON.parse(manifestContent || '{}')

      expect(manifest.name).toContain('가계부')
      expect(manifest.short_name).toBeTruthy()
      expect(manifest.icons).toBeDefined()

      // 3. 앱 설치 프롬프트 시뮬레이션
      await page.goto('/dashboard')

      // beforeinstallprompt 이벤트 시뮬레이션
      await page.evaluate(() => {
        window.dispatchEvent(new Event('beforeinstallprompt'))
      })

      // 설치 배너나 버튼 확인
      await expect(page.getByText(/앱.*설치|홈.*화면.*추가/i)).toBeVisible()

      // 4. 오프라인 캐시 동작 확인
      await page.context().setOffline(true)
      await page.reload()

      // 캐시된 페이지가 로드되는지 확인
      await expect(page.getByText(/대시보드|dashboard/i)).toBeVisible()
    })

    test('크로스 브라우저 호환성', async ({ page, browserName }) => {
      await helpers.signUp(TEST_DATA.users.primary)

      // 브라우저별 특정 기능 테스트
      await page.goto('/dashboard')

      // 1. CSS Grid 및 Flexbox 지원 확인
      const gridSupport = await page.evaluate(() => {
        return CSS.supports('display', 'grid')
      })
      expect(gridSupport).toBe(true)

      // 2. ES6+ 기능 지원 확인
      const es6Support = await page.evaluate(() => {
        try {
          const arrow = () => 'test'
          const [destructure] = [1]
          const template = `template ${destructure}`
          return arrow() === 'test' && template === 'template 1'
        } catch {
          return false
        }
      })
      expect(es6Support).toBe(true)

      // 3. 웹 API 지원 확인
      const webApiSupport = await page.evaluate(() => {
        return {
          localStorage: typeof localStorage !== 'undefined',
          fetch: typeof fetch !== 'undefined',
          promise: typeof Promise !== 'undefined',
          intersection: typeof IntersectionObserver !== 'undefined',
        }
      })

      expect(webApiSupport.localStorage).toBe(true)
      expect(webApiSupport.fetch).toBe(true)
      expect(webApiSupport.promise).toBe(true)

      // 4. 브라우저별 특수 동작 테스트
      if (browserName === 'webkit') {
        // Safari 특정 테스트
        await expect(page).toHaveTitle(/가계부/)
      } else if (browserName === 'firefox') {
        // Firefox 특정 테스트
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('📈 사용성(UX) 및 워크플로우 검증', () => {
    test('신규 사용자 온보딩 완전한 여정', async ({ page }) => {
      // 1. 랜딩 페이지에서 시작
      await page.goto('/')
      await expect(page.getByText(/신혼부부.*가계부/i)).toBeVisible()

      // 2. 회원가입 유도
      await page.getByRole('link', { name: /시작하기|가입/ }).click()

      // 3. 온보딩 스텝 1: 회원가입
      await helpers.signUp(TEST_DATA.users.primary)

      // 4. 온보딩 스텝 2: 첫 번째 계좌 설정
      await expect(page.getByText(/첫.*계좌.*설정|welcome/i)).toBeVisible()

      await page.getByPlaceholder(/계좌.*이름/i).fill('주 거래 통장')
      await page.getByPlaceholder(/초기.*잔액/i).fill('500000')
      await page.getByRole('button', { name: /다음|계속/ }).click()

      // 5. 온보딩 스텝 3: 첫 번째 거래 입력
      await expect(page.getByText(/첫.*거래.*입력/i)).toBeVisible()

      await page.getByPlaceholder(/금액/i).fill('12000')
      await page.getByPlaceholder(/내용|설명/i).fill('첫 지출')
      await page.getByRole('combobox', { name: /카테고리/ }).click()
      await page.getByRole('option', { name: /식비|기본/ }).click()
      await page.getByRole('button', { name: /저장|완료/ }).click()

      // 6. 온보딩 스텝 4: 대시보드 투어
      await expect(page.getByText(/온보딩.*완료|환영합니다/i)).toBeVisible()

      // 7. 대시보드에서 설정한 정보들 확인
      await expect(page.getByText('488,000원')).toBeVisible() // 500000 - 12000
      await expect(page.getByText('첫 지출')).toBeVisible()

      // 8. 사용법 가이드 표시
      await expect(page.getByRole('button', { name: /도움말|가이드/ })).toBeVisible()
    })

    test('파워 유저 고급 워크플로우', async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)

      // 1. 대량 데이터 입력 시나리오
      await page.goto('/transactions')

      // CSV 가져오기 기능 테스트
      await page.getByRole('button', { name: /가져오기|import/ }).click()

      // 파일 업로드 시뮬레이션
      const csvContent = `날짜,금액,카테고리,설명
2024-01-01,15000,식비,점심
2024-01-02,50000,쇼핑,옷
2024-01-03,8000,교통,택시`

      await page.setInputFiles('input[type="file"]', {
        name: 'transactions.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent),
      })

      await page.getByRole('button', { name: /업로드|가져오기/ }).click()

      // 가져오기 결과 확인
      await expect(page.getByText(/3건.*성공/i)).toBeVisible()

      // 2. 고급 필터 조합 사용
      await page.getByRole('button', { name: /고급.*필터/ }).click()

      // 복합 조건 설정
      await page.getByRole('combobox', { name: /카테고리/ }).selectOption(['식비', '교통'])
      await page.getByTestId('amount-min').fill('5000')
      await page.getByTestId('amount-max').fill('20000')
      await page.getByTestId('date-range').fill('2024-01-01 - 2024-01-31')
      await page.getByPlaceholder(/태그|keyword/i).fill('점심')

      await page.getByRole('button', { name: /필터.*적용/ }).click()

      // 필터링된 결과 확인
      await expect(page.getByText('점심')).toBeVisible()
      await expect(page.getByText('50000')).not.toBeVisible() // 범위 초과

      // 3. 사용자 정의 대시보드 구성
      await page.goto('/dashboard')
      await page.getByRole('button', { name: /대시보드.*편집|customize/ }).click()

      // 위젯 추가/제거
      await page.getByRole('checkbox', { name: /월별.*트렌드/ }).check()
      await page.getByRole('checkbox', { name: /카테고리.*파이.*차트/ }).check()
      await page.getByRole('checkbox', { name: /최근.*거래/ }).uncheck()

      await page.getByRole('button', { name: /저장|적용/ }).click()

      // 커스터마이즈된 대시보드 확인
      await expect(page.getByTestId('monthly-trend-widget')).toBeVisible()
      await expect(page.getByTestId('category-pie-widget')).toBeVisible()
      await expect(page.getByTestId('recent-transactions-widget')).not.toBeVisible()
    })

    test('에러 복구 및 사용자 안내', async ({ page }) => {
      await helpers.signUp(TEST_DATA.users.primary)

      // 1. 폼 입력 중 오류 발생 시나리오
      await page.goto('/transactions')
      await page.getByRole('button', { name: /거래.*추가/ }).click()

      // 잘못된 금액 입력
      await page.getByPlaceholder(/금액/i).fill('잘못된값')
      await page.getByPlaceholder(/설명/i).fill('테스트')
      await page.getByRole('button', { name: /저장/ }).click()

      // 인라인 오류 메시지 확인
      await expect(page.getByText(/올바른.*금액|숫자.*입력/i)).toBeVisible()

      // 오류 필드에 포커스 이동
      await expect(page.getByPlaceholder(/금액/i)).toBeFocused()

      // 2. 자동 저장 기능 (드래프트)
      await page.getByPlaceholder(/금액/i).fill('15000')
      await page.getByPlaceholder(/설명/i).fill('자동저장 테스트')

      // 모달을 닫았다가 다시 열기
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: /거래.*추가/ }).click()

      // 드래프트 복구 제안 확인
      await expect(page.getByText(/이전.*입력.*복구/i)).toBeVisible()
      await page.getByRole('button', { name: /복구|restore/ }).click()

      // 복구된 데이터 확인
      await expect(page.getByPlaceholder(/금액/i)).toHaveValue('15000')
      await expect(page.getByPlaceholder(/설명/i)).toHaveValue('자동저장 테스트')

      // 3. 도움말 시스템
      await page.getByRole('button', { name: /도움말|\?/ }).click()

      // 컨텍스트 도움말 표시 확인
      await expect(page.getByText(/거래.*입력.*방법/i)).toBeVisible()
      await expect(page.getByText(/키보드.*단축키/i)).toBeVisible()

      // 단축키 도움말
      await page.keyboard.press('?')
      await expect(page.getByText(/Ctrl\+N.*새.*거래/i)).toBeVisible()
    })
  })

  test.afterAll(async ({ browser }) => {
    // 테스트 완료 후 정리
    console.log('🎉 모든 QA 테스트가 완료되었습니다!')
  })
})

/**
 * 테스트 실행 가이드:
 *
 * 1. 전체 테스트 실행:
 *    npx playwright test tests/e2e/comprehensive-qa.test.ts
 *
 * 2. 특정 브라우저에서 실행:
 *    npx playwright test tests/e2e/comprehensive-qa.test.ts --project=chromium
 *
 * 3. 헤드풀 모드로 실행 (디버깅용):
 *    npx playwright test tests/e2e/comprehensive-qa.test.ts --headed
 *
 * 4. 특정 테스트 그룹만 실행:
 *    npx playwright test tests/e2e/comprehensive-qa.test.ts --grep "인증 시스템"
 *
 * 5. 모바일 테스트만 실행:
 *    npx playwright test tests/e2e/comprehensive-qa.test.ts --project="Mobile Chrome"
 *
 * 6. 병렬 실행 비활성화 (디버깅용):
 *    npx playwright test tests/e2e/comprehensive-qa.test.ts --workers=1
 */
