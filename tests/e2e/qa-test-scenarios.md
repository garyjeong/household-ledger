# 📋 QA 테스트 시나리오 가이드

## 🎯 테스트 목적

신혼부부 가계부 애플리케이션의 모든 핵심 기능이 실제 사용자 시나리오에서 올바르게 동작하는지 검증합니다.

## 🔧 테스트 환경 설정

### 1. 서버 실행

```bash
# 개발 서버 시작
pnpm dev

# 또는 프로덕션 빌드 테스트
pnpm build && pnpm start
```

### 2. 데이터베이스 준비

```bash
# 테스트용 DB 초기화
pnpm db:reset
pnpm db:seed
```

### 3. 테스트 실행

```bash
# 전체 포괄적 QA 테스트 실행
npx playwright test tests/e2e/comprehensive-qa.test.ts

# 특정 브라우저 테스트
npx playwright test tests/e2e/comprehensive-qa.test.ts --project=chromium

# 모바일 테스트
npx playwright test tests/e2e/comprehensive-qa.test.ts --project="Mobile Chrome"

# 헤드풀 모드 (시각적 확인)
npx playwright test tests/e2e/comprehensive-qa.test.ts --headed

# 특정 테스트 그룹
npx playwright test tests/e2e/comprehensive-qa.test.ts --grep "인증 시스템"
```

## 🎭 테스트 시나리오 분류

### 🔐 인증 시스템 (Authentication)

- **회원가입 플로우**: 이메일 검증, 비밀번호 규칙, 중복 검사
- **로그인/로그아웃**: 세션 관리, 자동 리다이렉션
- **비밀번호 재설정**: 이메일 전송, 링크 유효성
- **보안 검증**: XSS 방어, 세션 하이재킹 방지

### 👥 그룹 관리 (Group Management)

- **그룹 생성**: 이름 설정, 권한 할당
- **초대 시스템**: 코드 생성, 만료 처리, 참여 프로세스
- **멤버 관리**: 권한 변경, 강퇴, 탈퇴
- **실시간 동기화**: 그룹 상태 변경 알림

### 💰 거래 관리 (Transaction Management)

- **CRUD 작업**: 생성, 읽기, 수정, 삭제
- **카테고리 분류**: 커스텀 카테고리, 색상, 아이콘
- **검색/필터링**: 텍스트 검색, 날짜 범위, 금액 범위, 다중 조건
- **벌크 작업**: 일괄 편집, 일괄 삭제
- **데이터 유효성**: 금액 형식, 필수 필드, 길이 제한

### 🏦 계좌 관리 (Account Management)

> Deprecated: 현재 스키마에서는 계좌 테이블이 제거되어 기본 QA 범위에서 제외됩니다. 과거 시나리오와 호환이 필요한 경우에만 아카이브 테스트로 유지하세요.

### 📊 통계 및 분석 (Analytics)

- **월별 요약**: 수입/지출 집계, 전월 대비 증감
- **카테고리 분석**: 파이차트, 지출 패턴
- **트렌드 차트**: 시계열 데이터, 예측 분석
- **예산 관리**: 예산 설정, 초과 알림, 진행률

### 📱 UI/UX 및 접근성 (User Experience)

- **반응형 디자인**: 모바일, 태블릿, 데스크톱
- **터치 제스처**: 스와이프, 탭, 핀치
- **키보드 내비게이션**: Tab 순서, 단축키
- **접근성**: 스크린리더, 고대비, 폰트 크기

### 🌐 호환성 및 성능 (Compatibility)

- **브라우저 지원**: Chrome, Firefox, Safari, Edge
- **PWA 기능**: 설치(A2HS) 확인, 오프라인(선택: sw.js 캐시 전략 도입 시), 푸시(옵션)
- **성능 최적화**: 로딩 시간, 메모리 사용량
- **보안 검증**: XSS, SQL Injection, CSRF

## 📝 수동 테스트 체크리스트

### 필수 기능 확인

- [ ] 회원가입/로그인이 정상 작동
- [ ] 그룹 생성 및 초대 기능 동작
- [ ] 거래 입력/수정/삭제 가능
- [ ] 대시보드 통계 표시 정확
- [ ] 모바일 환경에서 사용 가능
- [ ] 오프라인 상태에서 기본 기능 유지

### 예외 상황 처리

- [ ] 네트워크 오류 시 적절한 메시지 표시
- [ ] 잘못된 입력값에 대한 검증 메시지
- [ ] 권한이 없는 기능 접근 시 차단
- [ ] 세션 만료 시 자동 로그아웃
- [ ] 데이터베이스 오류 시 fallback

### 사용성 검증

- [ ] 직관적인 사용자 인터페이스
- [ ] 일관성 있는 디자인 패턴
- [ ] 빠른 응답 시간 (< 3초)
- [ ] 명확한 피드백 메시지
- [ ] 실수 방지 및 복구 기능

## 🐛 버그 리포팅 템플릿

### 버그 발견 시 다음 정보 포함

```markdown
## 🐛 버그 제목

간단하고 명확한 버그 설명

## 📍 발생 환경

- 브라우저: Chrome 119
- 디바이스: MacBook Pro M1
- 화면 크기: 1440x900
- 사용자 유형: 로그인된 사용자

## 🔄 재현 단계

1. 대시보드 페이지로 이동
2. '새 거래 추가' 버튼 클릭
3. 금액에 '12,000' 입력
4. '저장' 버튼 클릭

## ❌ 예상 결과

거래가 저장되고 목록에 표시되어야 함

## ✅ 실제 결과

'유효하지 않은 금액' 오류 메시지 표시

## 📸 스크린샷/영상

[첨부 파일]

## 📝 추가 정보

- 에러 로그: [콘솔 오류 메시지]
- 네트워크: [API 응답 상태]
- 기타: [특이사항]

## 🏷️ 우선순위

- [ ] Critical (서비스 중단)
- [x] High (핵심 기능 영향)
- [ ] Medium (일부 기능 영향)
- [ ] Low (UI 개선)
```

## 🚀 테스트 자동화 전략

### CI/CD 파이프라인 통합

```yaml
# .github/workflows/qa-tests.yml
name: QA Tests
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: pnpm install
      - name: Install Playwright
        run: npx playwright install
      - name: Start application
        run: pnpm dev &
      - name: Run E2E tests
        run: npx playwright test tests/e2e/comprehensive-qa.test.ts
      - name: Upload test reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### 스케줄링된 회귀 테스트

```bash
# 매일 새벽 2시에 전체 테스트 실행
0 2 * * * cd /path/to/project && pnpm test:e2e:full >> /var/log/qa-tests.log 2>&1
```

## 📊 테스트 메트릭

### 추적해야 할 지표

- **테스트 커버리지**: 기능별 커버리지 %
- **테스트 실행 시간**: 평균 실행 시간
- **실패율**: 최근 30일 실패한 테스트 비율
- **버그 발견율**: 테스트를 통해 발견된 버그 수
- **사용자 만족도**: 실제 사용자 피드백

### 대시보드 구성

```typescript
interface QAMetrics {
  testCoverage: number // 85%
  avgExecutionTime: number // 45초
  failureRate: number // 2.5%
  bugsFound: number // 12개
  userSatisfaction: number // 4.2/5
}
```

## 🔄 지속적 개선

### 정기 검토 항목

1. **월간 테스트 리뷰**: 실패한 테스트 원인 분석
2. **분기별 시나리오 업데이트**: 새 기능 추가에 따른 테스트 확장
3. **반기별 성능 벤치마크**: 성능 저하 추적 및 개선
4. **연간 전체 테스트 전략 재검토**: 도구 및 방법론 업데이트

### 팀 교육 및 문서화

- **QA 프로세스 교육**: 새로운 팀 멤버를 위한 온보딩
- **테스트 작성 가이드**: Best Practice 및 안티패턴
- **도구 사용법 문서**: Playwright, 테스트 도구 활용법
- **트러블슈팅 가이드**: 자주 발생하는 문제 해결법

## 🎉 테스트 성공 기준

### 릴리즈 준비 완료 기준

- [ ] 모든 Critical/High 우선순위 테스트 통과
- [ ] 크로스 브라우저 호환성 확인 (Chrome, Firefox, Safari)
- [ ] 모바일 반응형 테스트 통과
- [ ] 성능 기준 만족 (첫 로딩 < 3초, 상호작용 < 1초)
- [ ] 접근성 기준 준수 (WCAG 2.1 AA)
- [ ] 보안 검증 완료 (XSS, SQL Injection 방어 확인)

이 가이드를 통해 체계적이고 포괄적인 QA 테스트를 수행하여 최고 품질의 가계부 애플리케이션을 제공할 수 있습니다! 🚀
