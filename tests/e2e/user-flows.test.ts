/**
 * 주요 사용자 흐름 E2E 테스트
 * 회원가입, 로그인, 그룹 연결, 지출 관리 등 핵심 사용자 시나리오 테스트
 */

import { test, expect } from '@playwright/test'

// 테스트용 사용자 데이터
const testUsers = {
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    nickname: '테스트유저',
  },
  existingUser: {
    email: 'smat91@naver.com',
    password: 'Wjdwhdans91!',
    nickname: '개뤼',
  },
}

// 테스트용 거래 데이터
const testTransaction = {
  description: '테스트 거래',
  amount: '50000',
  category: '식비',
  memo: 'E2E 테스트용 거래',
}

test.describe('주요 사용자 흐름 E2E 테스트', () => {
  test.describe('인증 시스템 흐름', () => {
    test('회원가입 → 로그인 → 로그아웃 전체 흐름', async ({ page }) => {
      // 1. 홈페이지 접속
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // 2. 회원가입 페이지로 이동
      await page.getByRole('link', { name: '이메일로 계속하기' }).click()
      await expect(page).toHaveURL(/.*signup.*/)

      // 3. 회원가입 폼 작성
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.newUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(testUsers.newUser.password)
      await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill(testUsers.newUser.password)
      await page.getByPlaceholder('닉네임을 입력하세요').fill(testUsers.newUser.nickname)

      // 4. 회원가입 버튼 클릭
      await page.getByRole('button', { name: '회원가입' }).click()

      // 5. 회원가입 성공 후 대시보드로 이동 확인
      await expect(page).toHaveURL(/.*dashboard.*/)
      await expect(page.getByText(testUsers.newUser.nickname)).toBeVisible()

      // 6. 로그아웃
      await page.getByRole('button', { name: '로그아웃' }).click()
      await expect(page).toHaveURL(/.*login.*/)

      // 7. 다시 로그인
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.newUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(testUsers.newUser.password)
      await page.getByRole('button', { name: '로그인' }).click()

      // 8. 로그인 성공 확인
      await expect(page).toHaveURL(/.*dashboard.*/)
      await expect(page.getByText(testUsers.newUser.nickname)).toBeVisible()
    })

    test('로그인 실패 케이스 테스트', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // 잘못된 비밀번호로 로그인 시도
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.existingUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill('wrongpassword')
      await page.getByRole('button', { name: '로그인' }).click()

      // 에러 메시지 확인
      await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible()

      // 로그인 페이지에 계속 있는지 확인
      await expect(page).toHaveURL(/.*login.*/)
    })

    test('비밀번호 찾기 흐름', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // 비밀번호 찾기 링크 클릭
      await page.getByRole('link', { name: '비밀번호를 잊으셨나요?' }).click()
      await expect(page).toHaveURL(/.*forgot-password.*/)

      // 이메일 입력
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.existingUser.email)
      await page.getByRole('button', { name: '재설정 링크 전송' }).click()

      // 성공 메시지 확인
      await expect(page.getByText('비밀번호 재설정 링크가 전송되었습니다')).toBeVisible()
    })
  })

  test.describe('그룹 관리 흐름', () => {
    test.beforeEach(async ({ page }) => {
      // 기존 사용자로 로그인
      await page.goto('/login')
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.existingUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(testUsers.existingUser.password)
      await page.getByRole('button', { name: '로그인' }).click()
      await expect(page).toHaveURL(/.*dashboard.*/)
    })

    test('그룹 생성 → 초대 코드 생성 → 초대 흐름', async ({ page }) => {
      // 1. 그룹 페이지로 이동
      await page.getByRole('link', { name: '그룹' }).click()
      await expect(page).toHaveURL(/.*groups.*/)

      // 2. 새 그룹 생성
      await page.getByRole('button', { name: '새 그룹 만들기' }).click()

      const groupName = `테스트그룹_${Date.now()}`
      await page.getByPlaceholder('그룹 이름을 입력하세요').fill(groupName)
      await page.getByRole('button', { name: '그룹 생성' }).click()

      // 3. 그룹 생성 성공 확인
      await expect(page.getByText(groupName)).toBeVisible()

      // 4. 초대 코드 생성
      await page.getByRole('button', { name: '초대 코드 생성' }).click()

      // 5. 초대 코드 표시 확인
      const inviteCode = await page.getByTestId('invite-code').textContent()
      expect(inviteCode).toHaveLength(8)

      // 6. 초대 코드 복사
      await page.getByRole('button', { name: '코드 복사' }).click()
      await expect(page.getByText('초대 코드가 복사되었습니다')).toBeVisible()
    })

    test('그룹 참여 흐름', async ({ page }) => {
      // 1. 그룹 참여 페이지로 이동
      await page.goto('/groups/join')

      // 2. 초대 코드 입력 (실제 테스트에서는 유효한 코드 필요)
      await page.getByPlaceholder('초대 코드를 입력하세요').fill('TEST1234')
      await page.getByRole('button', { name: '그룹 참여' }).click()

      // 3. 결과 확인 (유효하지 않은 코드이므로 에러 메시지 예상)
      await expect(page.getByText('유효하지 않은 초대 코드입니다')).toBeVisible()
    })
  })

  test.describe('거래 관리 핵심 흐름', () => {
    test.beforeEach(async ({ page }) => {
      // 로그인
      await page.goto('/login')
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.existingUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(testUsers.existingUser.password)
      await page.getByRole('button', { name: '로그인' }).click()
      await expect(page).toHaveURL(/.*dashboard.*/)
    })

    test('거래 입력 → 수정 → 삭제 전체 흐름', async ({ page }) => {
      // 1. 거래 목록 페이지로 이동
      await page.getByRole('link', { name: '거래 내역' }).click()
      await expect(page).toHaveURL(/.*transactions.*/)

      // 2. 새 거래 추가
      await page.getByRole('button', { name: '새 거래 추가' }).click()

      // 3. 거래 정보 입력
      await page.getByPlaceholder('거래 설명을 입력하세요').fill(testTransaction.description)
      await page.getByPlaceholder('금액을 입력하세요').fill(testTransaction.amount)

      // 카테고리 선택
      await page.getByRole('combobox', { name: '카테고리' }).click()
      await page.getByRole('option', { name: testTransaction.category }).click()

      await page.getByPlaceholder('메모 (선택사항)').fill(testTransaction.memo)

      // 4. 거래 저장
      await page.getByRole('button', { name: '저장' }).click()

      // 5. 거래 목록에서 새 거래 확인
      await expect(page.getByText(testTransaction.description)).toBeVisible()
      await expect(
        page.getByText(`${parseInt(testTransaction.amount).toLocaleString()}원`)
      ).toBeVisible()

      // 6. 거래 수정
      await page.getByText(testTransaction.description).click()
      await page.getByRole('button', { name: '수정' }).click()

      const updatedDescription = `${testTransaction.description} (수정됨)`
      await page.getByPlaceholder('거래 설명을 입력하세요').fill(updatedDescription)
      await page.getByRole('button', { name: '저장' }).click()

      // 7. 수정된 거래 확인
      await expect(page.getByText(updatedDescription)).toBeVisible()

      // 8. 거래 삭제
      await page.getByText(updatedDescription).click()
      await page.getByRole('button', { name: '삭제' }).click()

      // 삭제 확인 다이얼로그
      await page.getByRole('button', { name: '확인' }).click()

      // 9. 거래가 삭제되었는지 확인
      await expect(page.getByText(updatedDescription)).not.toBeVisible()
    })

    test('빠른 거래 입력 흐름', async ({ page }) => {
      // 1. 대시보드에서 빠른 입력 사용
      await page.goto('/dashboard')

      // 2. 빠른 입력 모달 열기
      await page.getByRole('button', { name: '빠른 입력' }).click()

      // 3. 간단한 거래 정보 입력
      await page.getByPlaceholder('금액').fill('15000')
      await page.getByPlaceholder('내용').fill('점심식사')

      // 4. 저장
      await page.getByRole('button', { name: '저장' }).click()

      // 5. 성공 메시지 확인
      await expect(page.getByText('거래가 저장되었습니다')).toBeVisible()
    })

    test('거래 검색 및 필터링', async ({ page }) => {
      await page.goto('/transactions')

      // 1. 거래 검색
      await page.getByPlaceholder('거래 검색...').fill('점심')
      await page.keyboard.press('Enter')

      // 2. 검색 결과 확인
      const searchResults = page.getByTestId('transaction-list').getByText('점심')
      await expect(searchResults.first()).toBeVisible()

      // 3. 카테고리 필터 적용
      await page.getByRole('combobox', { name: '카테고리 필터' }).click()
      await page.getByRole('option', { name: '식비' }).click()

      // 4. 필터된 결과 확인
      const filteredResults = page.getByTestId('transaction-list')
      await expect(filteredResults).toBeVisible()

      // 5. 날짜 범위 필터
      await page.getByTestId('date-from').fill('2024-01-01')
      await page.getByTestId('date-to').fill('2024-12-31')
      await page.getByRole('button', { name: '적용' }).click()
    })
  })

  test.describe('계좌 관리 흐름', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.existingUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(testUsers.existingUser.password)
      await page.getByRole('button', { name: '로그인' }).click()
      await expect(page).toHaveURL(/.*dashboard.*/)
    })

    test('계좌 추가 → 수정 → 삭제 흐름', async ({ page }) => {
      // 1. 설정 > 계좌 관리로 이동
      await page.getByRole('link', { name: '설정' }).click()
      await page.getByRole('link', { name: '계좌 관리' }).click()

      // 2. 새 계좌 추가
      await page.getByRole('button', { name: '새 계좌 추가' }).click()

      const accountName = `테스트계좌_${Date.now()}`
      await page.getByPlaceholder('계좌 이름').fill(accountName)
      await page.getByRole('combobox', { name: '계좌 유형' }).click()
      await page.getByRole('option', { name: '은행' }).click()
      await page.getByPlaceholder('은행명').fill('테스트은행')
      await page.getByPlaceholder('초기 잔액').fill('1000000')

      await page.getByRole('button', { name: '계좌 추가' }).click()

      // 3. 계좌 목록에서 확인
      await expect(page.getByText(accountName)).toBeVisible()

      // 4. 계좌 수정
      await page.getByText(accountName).click()
      await page.getByRole('button', { name: '수정' }).click()

      const updatedAccountName = `${accountName}_수정`
      await page.getByPlaceholder('계좌 이름').fill(updatedAccountName)
      await page.getByRole('button', { name: '저장' }).click()

      // 5. 수정 확인
      await expect(page.getByText(updatedAccountName)).toBeVisible()

      // 6. 계좌 삭제 (거래가 없는 경우만)
      await page.getByText(updatedAccountName).click()
      await page.getByRole('button', { name: '삭제' }).click()
      await page.getByRole('button', { name: '확인' }).click()

      // 7. 삭제 확인
      await expect(page.getByText(updatedAccountName)).not.toBeVisible()
    })
  })

  test.describe('카테고리 관리 흐름', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.existingUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(testUsers.existingUser.password)
      await page.getByRole('button', { name: '로그인' }).click()
      await expect(page).toHaveURL(/.*dashboard.*/)
    })

    test('사용자 정의 카테고리 관리', async ({ page }) => {
      // 1. 카테고리 관리 페이지로 이동
      await page.getByRole('link', { name: '카테고리' }).click()
      await expect(page).toHaveURL(/.*categories.*/)

      // 2. 새 카테고리 추가
      await page.getByRole('button', { name: '새 카테고리' }).click()

      const categoryName = `테스트카테고리_${Date.now()}`
      await page.getByPlaceholder('카테고리 이름').fill(categoryName)
      await page.getByRole('combobox', { name: '카테고리 유형' }).click()
      await page.getByRole('option', { name: '지출' }).click()

      // 색상 선택
      await page.getByTestId('color-picker').click()
      await page.getByTestId('color-red').click()

      await page.getByRole('button', { name: '저장' }).click()

      // 3. 카테고리 목록에서 확인
      await expect(page.getByText(categoryName)).toBeVisible()

      // 4. 카테고리 수정
      await page.getByText(categoryName).click()
      await page.getByRole('button', { name: '수정' }).click()

      const updatedCategoryName = `${categoryName}_수정`
      await page.getByPlaceholder('카테고리 이름').fill(updatedCategoryName)
      await page.getByRole('button', { name: '저장' }).click()

      // 5. 수정 확인
      await expect(page.getByText(updatedCategoryName)).toBeVisible()
    })
  })

  test.describe('통합 시나리오', () => {
    test('신규 사용자 완전한 온보딩 흐름', async ({ page }) => {
      const newUser = {
        email: `integration-test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        nickname: '통합테스트유저',
      }

      // 1. 회원가입
      await page.goto('/signup')
      await page.getByPlaceholder('이메일을 입력하세요').fill(newUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(newUser.password)
      await page.getByPlaceholder('비밀번호를 다시 입력하세요').fill(newUser.password)
      await page.getByPlaceholder('닉네임을 입력하세요').fill(newUser.nickname)
      await page.getByRole('button', { name: '회원가입' }).click()

      // 2. 첫 계좌 설정
      await expect(page.getByText('첫 계좌를 설정해주세요')).toBeVisible()
      await page.getByPlaceholder('계좌 이름').fill('주거래은행')
      await page.getByPlaceholder('초기 잔액').fill('500000')
      await page.getByRole('button', { name: '계좌 설정 완료' }).click()

      // 3. 첫 거래 입력
      await expect(page.getByText('첫 번째 거래를 입력해보세요')).toBeVisible()
      await page.getByPlaceholder('거래 설명을 입력하세요').fill('첫 지출')
      await page.getByPlaceholder('금액을 입력하세요').fill('10000')
      await page.getByRole('button', { name: '거래 저장' }).click()

      // 4. 대시보드에서 잔액 확인
      await expect(page.getByText('490,000원')).toBeVisible() // 500000 - 10000

      // 5. 온보딩 완료 확인
      await expect(page.getByText('온보딩이 완료되었습니다!')).toBeVisible()
    })

    test('모바일 터치 인터랙션 확인', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

      await page.goto('/login')
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.existingUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(testUsers.existingUser.password)
      await page.getByRole('button', { name: '로그인' }).click()

      // 모바일에서 스와이프 제스처 테스트
      await page.goto('/transactions')

      // 거래 항목에서 스와이프 제스처로 삭제 버튼 노출
      const firstTransaction = page.getByTestId('transaction-item').first()
      await firstTransaction.hover()

      // 스와이프 시뮬레이션 (터치 이벤트)
      await firstTransaction.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 }],
      })
      await firstTransaction.dispatchEvent('touchmove', {
        touches: [{ clientX: 50, clientY: 100 }],
      })
      await firstTransaction.dispatchEvent('touchend')

      // 삭제 버튼이 나타나는지 확인
      await expect(page.getByRole('button', { name: '삭제' })).toBeVisible()
    })
  })

  test.describe('에러 시나리오 및 예외 처리', () => {
    test('네트워크 오류 시 처리', async ({ page }) => {
      // 네트워크 차단 시뮬레이션
      await page.route('**/api/**', route => route.abort())

      await page.goto('/login')
      await page.getByPlaceholder('이메일을 입력하세요').fill(testUsers.existingUser.email)
      await page.getByPlaceholder('비밀번호를 입력하세요').fill(testUsers.existingUser.password)
      await page.getByRole('button', { name: '로그인' }).click()

      // 네트워크 오류 메시지 확인
      await expect(page.getByText('네트워크 오류가 발생했습니다')).toBeVisible()
      await expect(page.getByRole('button', { name: '재시도' })).toBeVisible()
    })

    test('폼 유효성 검사', async ({ page }) => {
      await page.goto('/signup')

      // 빈 폼 제출
      await page.getByRole('button', { name: '회원가입' }).click()

      // 유효성 검사 메시지들 확인
      await expect(page.getByText('이메일을 입력해주세요')).toBeVisible()
      await expect(page.getByText('비밀번호를 입력해주세요')).toBeVisible()
      await expect(page.getByText('닉네임을 입력해주세요')).toBeVisible()

      // 잘못된 이메일 형식
      await page.getByPlaceholder('이메일을 입력하세요').fill('invalid-email')
      await page.getByRole('button', { name: '회원가입' }).click()
      await expect(page.getByText('올바른 이메일 형식을 입력해주세요')).toBeVisible()

      // 약한 비밀번호
      await page.getByPlaceholder('이메일을 입력하세요').fill('test@example.com')
      await page.getByPlaceholder('비밀번호를 입력하세요').fill('123')
      await page.getByRole('button', { name: '회원가입' }).click()
      await expect(page.getByText('비밀번호는 8자 이상이어야 합니다')).toBeVisible()
    })
  })
})
