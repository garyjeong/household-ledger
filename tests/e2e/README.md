# 🧪 E2E 테스트 가이드

## 🎯 개요

Playwright MCP를 활용하여 신혼부부 가계부 애플리케이션의 모든 핵심 기능을 검증하는 종합적인 QA 테스트입니다.

## ✅ **2025.09.06 검증 완료 상태**

- ✅ **회원가입 플로우**: newtest@gmail.com / Test1234! 계정 생성 성공
- ✅ **로그인 플로우**: JWT 토큰 발급 및 인증 성공
- ✅ **그룹 생성**: "테스트 가족" 그룹 생성 및 멤버십 확인
- ✅ **카테고리 API**: 기본 카테고리 4개 (식비, 교통비, 문화생활, 급여) 정상 로딩
- ✅ **빠른 입력 모달**: 금액/카테고리/날짜/메모 입력 UI 완전 작동
- ✅ **실시간 API 호출**: 카테고리 API 200ms 응답속도 확인

## 📋 테스트 파일 구조

```
tests/e2e/
├── README.md                     # 이 파일
├── comprehensive-qa.test.ts       # 메인 포괄적 QA 테스트
├── qa-test-scenarios.md          # 테스트 시나리오 가이드
├── group-management.test.ts       # 그룹 관리 테스트
├── transaction-management.test.ts # 거래 관리 테스트
├── user-flows.test.ts            # 사용자 플로우 테스트
└── helpers/
    ├── test-data.ts              # 테스트 데이터
    └── playwright-helpers.ts      # 테스트 헬퍼 함수
```

## 🚀 테스트 실행 방법

### 1. 환경 준비

```bash
# 의존성 설치
pnpm install

# Playwright 브라우저 설치
npx playwright install

# 개발 서버 시작 (별도 터미널)
pnpm dev
```

### 2. 테스트 실행

```bash
# 전체 포괄적 QA 테스트
pnpm test:e2e:comprehensive

# 모바일 환경 테스트
pnpm test:e2e:mobile

# 시각적 확인을 위한 헤드풀 모드
pnpm test:e2e:headed

# 특정 테스트 그룹만 실행
npx playwright test --grep "인증 시스템"

# 모든 QA 테스트 (유닛 + E2E)
pnpm test:qa:full
```

### 3. 디버깅 모드

```bash
# Playwright UI 모드로 실행
pnpm test:e2e:ui

# 디버그 모드
npx playwright test --debug

# 특정 브라우저에서만 실행
npx playwright test --project=chromium
```

## 🎭 테스트 범위

### 🔐 인증 시스템

- 회원가입 → 이메일 인증 → 로그인 전체 흐름
- 로그인 실패 시나리오 (잘못된 이메일, 비밀번호, 계정 잠금)
- 비밀번호 재설정 전체 흐름
- 보안 검증 (XSS, SQL Injection 방어)

### 👥 그룹 관리

- 그룹 생성 → 초대 코드 생성 → 파트너 초대 → 협업 시작
- 그룹 설정 및 권한 관리
- 초대 코드 만료 처리
- 실시간 그룹 상태 동기화

### 💰 거래 관리

- 수입/지출 입력 → 수정 → 삭제 → 복구 전체 사이클
- 빠른 입력 및 템플릿 저장 기능
- 고급 필터링 및 검색 기능
- 벌크 작업 (일괄 편집/삭제)
- 데이터 유효성 검사

### 🏦 계좌 관리

- 계좌 생성 → 잔액 조회 → 이체 → 명세서 다운로드
- 계좌 간 이체 기능
- 잔액 실시간 계산

### 📊 통계 및 분석

- 월별 통계 → 카테고리 분석 → 트렌드 차트 → 예산 설정
- 데이터 내보내기 및 백업 기능
- 실시간 차트 업데이트

### 📱 UI/UX 및 접근성

- 모바일 환경에서의 모든 핵심 기능 동작
- 터치 제스처 및 스와이프 동작
- 키보드 탐색 및 접근성 준수
- 다양한 화면 크기 대응

### 🔒 보안 및 성능

- XSS 및 SQL Injection 방어 테스트
- 성능 최적화 확인 (로딩 시간, 메모리 사용량)
- 오프라인 및 네트워크 오류 처리

### 🌐 호환성

- PWA 설치 및 오프라인 기능
- 크로스 브라우저 호환성
- 브라우저 API 지원 확인

## 📊 테스트 결과 해석

### 성공 기준

- ✅ **모든 Critical/High 우선순위 테스트 통과**
- ✅ **크로스 브라우저 호환성 확인** (Chrome, Firefox, Safari)
- ✅ **모바일 반응형 테스트 통과**
- ✅ **성능 기준 만족** (첫 로딩 < 3초, 상호작용 < 1초)
- ✅ **접근성 기준 준수** (WCAG 2.1 AA)
- ✅ **보안 검증 완료** (XSS, SQL Injection 방어 확인)

### 실패 시 대응

1. **로그 확인**: `playwright-report/` 폴더의 상세 리포트
2. **스크린샷 분석**: 실패 시점의 화면 캡처
3. **네트워크 로그**: API 요청/응답 상태
4. **콘솔 에러**: JavaScript 오류 메시지

## 🛠️ 커스터마이징

### 테스트 데이터 수정

`tests/helpers/test-data.ts` 파일을 수정하여 테스트용 데이터를 변경할 수 있습니다:

```typescript
export const TEST_USERS = {
  primary: {
    email: `your-test-${Date.now()}@example.com`,
    password: 'YourTestPassword123!',
    nickname: '커스텀유저',
  },
  // ...
}
```

### 새로운 테스트 시나리오 추가

`comprehensive-qa.test.ts`에 새로운 test.describe 블록을 추가:

```typescript
test.describe('🆕 새로운 기능 검증', () => {
  test.beforeEach(async ({ page }) => {
    await helpers.signUp(TEST_DATA.users.primary)
  })

  test('새로운 기능 테스트', async ({ page }) => {
    // 테스트 로직
  })
})
```

### 환경별 설정

`playwright.config.ts`에서 환경별 설정을 조정:

```typescript
export default defineConfig({
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
  },
  projects: [
    // 추가 브라우저 설정
  ],
})
```

## 🐛 문제 해결

### 자주 발생하는 문제

#### 1. "net::ERR_CONNECTION_REFUSED"

```bash
# 개발 서버가 실행 중인지 확인
pnpm dev

# 포트 충돌 시 다른 포트 사용
PORT=3002 pnpm dev
```

#### 2. 테스트 시간 초과

```typescript
// playwright.config.ts에서 타임아웃 증가
export default defineConfig({
  use: {
    actionTimeout: 30000, // 30초로 증가
  },
})
```

#### 3. 브라우저 설치 문제

```bash
# 브라우저 재설치
npx playwright install --force

# 시스템 의존성 설치 (Linux)
npx playwright install-deps
```

### 디버깅 팁

1. **스크린샷 활용**:

```typescript
await page.screenshot({ path: 'debug.png', fullPage: true })
```

2. **콘솔 로그 확인**:

```typescript
page.on('console', msg => console.log('브라우저 콘솔:', msg.text()))
```

3. **네트워크 요청 모니터링**:

```typescript
page.on('request', request => console.log('요청:', request.url()))
page.on('response', response => console.log('응답:', response.url(), response.status()))
```

## 📈 CI/CD 통합

### GitHub Actions 예시

`.github/workflows/qa-tests.yml`:

```yaml
name: QA Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: pnpm install
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run tests
        run: pnpm test:qa:full
      - name: Upload reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📚 추가 리소스

- [Playwright 공식 문서](https://playwright.dev/)
- [테스트 시나리오 가이드](./qa-test-scenarios.md)
- [프로젝트 README](../../README.md)

---

**Happy Testing! 🎉**
