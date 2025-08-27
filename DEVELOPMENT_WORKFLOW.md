# 🔄 개발 워크플로우 & Git 전략

> 우리가족 가계부 프로젝트의 체계적인 개발 프로세스와 성능 최적화 전략

이 문서는 우리가족가계부 프로젝트의 Git 워크플로우, 브랜치 전략, 그리고 코드 리뷰 프로세스를 정의합니다.

## 목차

1. [Git Flow & 브랜치 전략](#git-flow--브랜치-전략)
2. [브랜치 명명 규칙](#브랜치-명명-규칙)
3. [코드 리뷰 프로세스](#코드-리뷰-프로세스)
4. [머지 정책](#머지-정책)
5. [성능 최적화 워크플로우](#성능-최적화-워크플로우)
6. [코드 품질 및 자동화](#코드-품질-및-자동화)
7. [릴리즈 프로세스](#릴리즈-프로세스)
8. [핫픽스 프로세스](#핫픽스-프로세스)
9. [커밋 메시지 규칙](#커밋-메시지-규칙)

## Git Flow & 브랜치 전략

우리 프로젝트는 **GitHub Flow** 기반의 단순화된 브랜치 전략을 사용합니다.

### 메인 브랜치

#### `main` 브랜치

- **용도**: 프로덕션 배포 브랜치
- **보호 수준**: 최고 (Direct push 금지)
- **배포**: 자동 배포 (Vercel)
- **머지 조건**:
  - PR 승인 필수 (최소 1명)
  - 모든 CI 체크 통과
  - 충돌 해결 완료

#### `develop` 브랜치 (선택사항)

- **용도**: 개발 통합 브랜치 (대규모 기능 개발 시)
- **보호 수준**: 중간
- **배포**: 스테이징 환경
- **사용 시기**: 여러 기능이 동시 개발될 때

### 기능 브랜치

모든 새로운 기능, 버그 수정, 개선사항은 별도 브랜치에서 개발합니다.

```
main
├── feature/user-authentication
├── feature/expense-tracking
├── bugfix/login-validation
└── hotfix/critical-security-fix
```

## 브랜치 명명 규칙

### 기본 형식

```
<type>/<description>
```

### 브랜치 타입

| 타입       | 용도                 | 예시                            |
| ---------- | -------------------- | ------------------------------- |
| `feature`  | 새로운 기능 개발     | `feature/monthly-statistics`    |
| `bugfix`   | 버그 수정            | `bugfix/balance-calculation`    |
| `hotfix`   | 긴급 수정 (프로덕션) | `hotfix/security-vulnerability` |
| `refactor` | 코드 리팩토링        | `refactor/component-structure`  |
| `docs`     | 문서 업데이트        | `docs/api-documentation`        |
| `test`     | 테스트 추가/수정     | `test/authentication-coverage`  |
| `chore`    | 빌드/도구 설정       | `chore/update-dependencies`     |

### 브랜치명 작성 규칙

1. **소문자 사용**: 모든 글자는 소문자
2. **하이픈 구분**: 단어는 하이픈(-)으로 구분
3. **간결하고 명확**: 브랜치의 목적이 명확히 드러나야 함
4. **이슈 번호 포함** (선택): `feature/123-user-profile`

### 좋은 브랜치명 예시

```bash
✅ feature/couple-expense-sharing
✅ bugfix/recurring-payment-calculation
✅ hotfix/login-security-patch
✅ refactor/database-schema-optimization
✅ docs/setup-guide-update
```

### 피해야 할 브랜치명

```bash
❌ Feature/User-Authentication (대문자 사용)
❌ fix_bug (언더스코어 사용)
❌ temp (목적이 불명확)
❌ john-working-branch (개인 이름 사용)
❌ feature (설명 부족)
```

## 코드 리뷰 프로세스

### 1. PR 생성 전 준비사항

```bash
# 최신 main 브랜치와 동기화
git checkout main
git pull origin main

# 기능 브랜치 생성
git checkout -b feature/your-feature-name

# 개발 완료 후 자체 검토
git add .
git commit -m "feat: add user authentication system"

# PR 생성 전 최종 확인
pnpm run lint        # 코드 스타일 검사
pnpm run type-check  # 타입 검사
pnpm run test        # 테스트 실행
pnpm run build       # 빌드 확인
```

### 2. PR 생성 가이드라인

#### PR 제목 규칙

```
<type>(<scope>): <description>

예시:
feat(auth): add social login functionality
fix(balance): resolve calculation error for negative amounts
docs(api): update authentication endpoints
```

#### PR 설명 필수 요소

1. **변경 사항 요약**: 무엇을 왜 변경했는지
2. **테스트 확인**: 어떤 테스트를 수행했는지
3. **스크린샷**: UI 변경 시 Before/After
4. **Breaking Changes**: 기존 기능에 영향을 주는 변경사항
5. **Deploy Notes**: 배포 시 주의사항

### 3. 리뷰어 할당 규칙

#### 자동 할당 (CODEOWNERS)

```bash
# .github/CODEOWNERS
* @lead-developer

# Frontend 코드
/src/app/ @frontend-team
/src/components/ @frontend-team

# Backend 코드
/src/app/api/ @backend-team
/src/lib/ @backend-team

# 데이터베이스
/prisma/ @backend-team

# CI/CD & 인프라
/.github/ @devops-team
```

#### 수동 할당 기준

- **복잡한 기능**: 2명 이상의 리뷰어
- **보안 관련**: 시니어 개발자 필수
- **데이터베이스 변경**: DBA 또는 백엔드 리더
- **성능 크리티컬**: 성능 전문가

### 4. 리뷰 체크리스트

#### 🔍 기능성 검토

- [ ] 기능이 요구사항에 맞게 구현되었는가?
- [ ] 엣지 케이스가 적절히 처리되었는가?
- [ ] 에러 처리가 사용자 친화적인가?
- [ ] 비즈니스 로직이 올바른가?

#### 🏗️ 코드 품질 검토

- [ ] 코드가 읽기 쉽고 이해하기 쉬운가?
- [ ] SOLID 원칙을 따르는가?
- [ ] DRY 원칙을 준수하는가? (불필요한 중복 없음)
- [ ] 함수/컴포넌트가 적절한 크기인가?
- [ ] 변수명과 함수명이 명확한가?

#### 🔒 보안 검토

- [ ] 사용자 입력 검증이 적절한가?
- [ ] 인증/권한 검사가 올바른가?
- [ ] 민감한 정보가 노출되지 않는가?
- [ ] SQL 인젝션, XSS 등 취약점이 없는가?

#### 🚀 성능 검토

- [ ] 불필요한 리렌더링이 없는가?
- [ ] API 호출이 최적화되었는가?
- [ ] 메모리 누수 가능성이 없는가?
- [ ] 데이터베이스 쿼리가 효율적인가?

#### 🧪 테스트 검토

- [ ] 적절한 테스트가 작성되었는가?
- [ ] 테스트 커버리지가 충분한가?
- [ ] 테스트가 의미 있고 안정적인가?
- [ ] E2E 테스트가 필요한 기능인가?

### 5. 리뷰 응답 가이드라인

#### 리뷰어의 피드백 유형

- **Must Fix**: 반드시 수정해야 할 문제
- **Should Fix**: 수정하는 것이 좋은 문제
- **Consider**: 고려해볼 만한 개선사항
- **Question**: 이해를 위한 질문
- **Praise**: 좋은 코드에 대한 칭찬

#### PR 작성자의 응답 원칙

1. **모든 피드백에 응답**: 승인/거부/질문 답변
2. **건설적인 토론**: 의견 차이시 논리적 설명
3. **신속한 대응**: 24시간 내 응답 목표
4. **학습 태도**: 피드백을 통한 성장 기회로 활용

## 머지 정책

### 머지 조건

1. ✅ **최소 1명의 승인** (복잡한 기능은 2명)
2. ✅ **모든 CI 체크 통과**
   - 코드 품질 검사 (ESLint, Prettier, TypeScript)
   - 단위 테스트 & 통합 테스트
   - 빌드 성공
   - E2E 테스트 (필요시)
3. ✅ **충돌 해결 완료**
4. ✅ **브랜치 최신화** (main과 동기화)
5. ✅ **모든 대화 해결**

### 머지 방법

- **Squash and Merge** (기본): 깔끔한 히스토리 유지
- **Merge Commit**: 기능 브랜치 히스토리 보존이 중요한 경우
- **Rebase and Merge**: 선형 히스토리가 중요한 경우

### 자동 머지 규칙

```yaml
# 다음 조건에서 자동 머지 고려
- 의존성 업데이트 (Dependabot)
- 문서 수정 (비기능적 변경)
- 테스트 추가 (기존 코드 변경 없음)
```

## 릴리즈 프로세스

### 릴리즈 사이클

- **Major Release**: 분기별 (3개월)
- **Minor Release**: 월별 (새 기능)
- **Patch Release**: 주별 (버그 수정)
- **Hotfix Release**: 필요시 즉시

### 릴리즈 브랜치 전략

#### 1. 정규 릴리즈

```bash
# 릴리즈 브랜치 생성
git checkout -b release/v1.2.0 develop

# 릴리즈 준비
- 버전 번호 업데이트
- CHANGELOG.md 업데이트
- 릴리즈 노트 작성
- 최종 테스트 수행

# main으로 머지
git checkout main
git merge release/v1.2.0
git tag v1.2.0

# develop에도 반영
git checkout develop
git merge release/v1.2.0
```

#### 2. 릴리즈 승인 프로세스

1. **QA 팀 승인**: 기능 테스트 완료
2. **스테이징 배포**: 프로덕션 환경과 동일한 조건에서 테스트
3. **성능 테스트**: 부하 테스트 및 성능 지표 확인
4. **보안 검토**: 보안 취약점 스캔
5. **프로덕션 배포**: 단계적 배포 (카나리/블루-그린)

### 버전 관리 (Semantic Versioning)

```
MAJOR.MINOR.PATCH

예시: 1.2.3
- MAJOR (1): 호환성을 깨는 변경
- MINOR (2): 하위 호환 새 기능
- PATCH (3): 하위 호환 버그 수정
```

## 핫픽스 프로세스

### 긴급 상황 정의

- **보안 취약점**: 즉시 수정 필요
- **서비스 중단**: 사용자 접근 불가
- **데이터 손실 위험**: 데이터 무결성 문제
- **결제 시스템 오류**: 금전적 영향

### 핫픽스 절차

```bash
# 1. main에서 핫픽스 브랜치 생성
git checkout main
git checkout -b hotfix/v1.2.1-security-fix

# 2. 최소한의 수정으로 문제 해결
# 3. 긴급 테스트 수행
pnpm run test:critical  # 핵심 기능 테스트
pnpm run test:security  # 보안 테스트

# 4. 긴급 리뷰 (최소 1명, 시니어 개발자)
# 5. 즉시 배포
git checkout main
git merge hotfix/v1.2.1-security-fix
git tag v1.2.1

# 6. develop에도 반영
git checkout develop
git merge hotfix/v1.2.1-security-fix
```

### 핫픽스 후 조치

1. **근본 원인 분석**: 왜 발생했는지 분석
2. **프로세스 개선**: 재발 방지 대책 수립
3. **모니터링 강화**: 유사 문제 조기 감지
4. **팀 공유**: 학습 사항 전파

## 커밋 메시지 규칙

### Conventional Commits 형식

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 커밋 타입

| 타입       | 설명             | 예시                                        |
| ---------- | ---------------- | ------------------------------------------- |
| `feat`     | 새로운 기능      | `feat(auth): add social login`              |
| `fix`      | 버그 수정        | `fix(balance): resolve calculation error`   |
| `docs`     | 문서 변경        | `docs(api): update authentication guide`    |
| `style`    | 코드 스타일 변경 | `style: fix indentation`                    |
| `refactor` | 리팩토링         | `refactor(utils): simplify date formatting` |
| `test`     | 테스트 추가/수정 | `test(auth): add login validation tests`    |
| `chore`    | 빌드/도구 변경   | `chore: update dependencies`                |
| `perf`     | 성능 개선        | `perf(api): optimize database queries`      |
| `ci`       | CI 설정 변경     | `ci: add test coverage check`               |

### 커밋 메시지 작성 가이드

#### 좋은 커밋 메시지

```bash
✅ feat(expense): add recurring payment feature
✅ fix(auth): resolve token expiration issue
✅ docs(readme): update installation instructions
✅ refactor(components): extract shared button component
✅ test(payment): add integration tests for payment flow
```

#### 피해야 할 커밋 메시지

```bash
❌ fixed bug
❌ update
❌ changes
❌ work in progress
❌ temp commit
```

### 커밋 단위 원칙

1. **하나의 논리적 변경**: 한 커밋에 하나의 목적
2. **컴파일 가능**: 각 커밋이 빌드 가능해야 함
3. **테스트 통과**: 각 커밋에서 테스트 성공
4. **원자적 변경**: 부분적 구현보다는 완성된 단위

## 브랜치 수명 주기 관리

### 브랜치 정리 규칙

```bash
# 머지 완료된 브랜치 자동 삭제
git branch -d feature/completed-feature

# 원격 브랜치도 삭제
git push origin --delete feature/completed-feature

# 오래된 브랜치 정리 (30일 이상)
git for-each-ref --format='%(refname:short) %(committerdate:relative)' refs/heads | grep -E ' (month|year)s? ago' | cut -d' ' -f1 | xargs -I {} git branch -D {}
```

### 주기적 정리 작업

1. **주간 정리**: 머지된 브랜치 삭제
2. **월간 정리**: 오래된 브랜치 검토 및 삭제
3. **분기별 정리**: 태그 정리 및 릴리즈 아카이브

## 팀 협업 베스트 프랙티스

### 1. 커뮤니케이션

- **PR에서 토론**: 코드 관련 논의는 PR 댓글로
- **이슈 연결**: PR과 이슈를 명확히 연결
- **컨텍스트 공유**: 왜 이런 방식으로 구현했는지 설명
- **학습 공유**: 새로운 기술이나 패턴 공유

### 2. 코드 품질 유지

- **리팩토링 우선**: 새 기능 전 기존 코드 정리
- **테스트 먼저**: TDD 방식 권장
- **문서 업데이트**: 코드 변경시 문서도 함께 업데이트
- **성능 고려**: 사용자 경험 최우선

### 3. 개발 효율성

- **작은 PR**: 500줄 이하 권장
- **빠른 피드백**: 24시간 내 리뷰 목표
- **병렬 개발**: 의존성 최소화
- **재사용 고려**: 공통 컴포넌트 우선 개발

---

## 부록

### A. IDE 설정

- **VSCode 확장**: ESLint, Prettier, GitLens
- **커밋 템플릿**: `.gitmessage` 파일 설정
- **Git 훅**: Husky를 통한 pre-commit 검사

### B. 문제 해결

- **머지 충돌**: 해결 방법 및 예방법
- **리베이스**: 히스토리 정리 방법
- **복구**: 잘못된 커밋 되돌리기

### C. 도구 및 자동화

- **GitHub CLI**: 명령줄에서 PR 관리
- **Git 알리아스**: 자주 사용하는 명령어 단축키
- **자동화 스크립트**: 브랜치 생성, 정리 스크립트

## 성능 최적화 워크플로우

우리 프로젝트는 사용자 경험 향상을 위해 체계적인 성능 최적화 프로세스를 운영합니다.

### Web Vitals 모니터링

#### 핵심 성능 지표 (Core Web Vitals)

- **LCP (Largest Contentful Paint)**: ≤ 2.5초
- **INP (Interaction to Next Paint)**: ≤ 200ms (FID 대체)
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **FCP (First Contentful Paint)**: ≤ 1.8초
- **TTFB (Time to First Byte)**: ≤ 800ms

#### 모니터링 도구

```bash
# 개발 환경 실시간 모니터링
pnpm dev
# 브라우저 콘솔에서 Web Vitals 확인

# 성능 대시보드 (개발 환경 전용)
# http://localhost:3001 하단에 자동 표시

# Lighthouse CI 자동 감사
lhci autorun
```

### 성능 최적화 단계

#### 1. 개발 단계 최적화

- **React 성능 최적화**: memo, useMemo, useCallback 적절한 사용
- **데이터 캐싱**: SWR 훅 활용한 스마트 캐싱
- **컴포넌트 최적화**: 불필요한 리렌더링 방지

#### 2. 빌드 단계 최적화

- **번들 크기 분석**: `pnpm analyze` 활용
- **이미지 최적화**: WebP/AVIF 형식, 반응형 이미지
- **코드 스플리팅**: 동적 import 활용

#### 3. 배포 전 성능 검증

```bash
# 프로덕션 빌드 테스트
pnpm build && pnpm start

# Lighthouse CI 자동 감사
lhci autorun

# 성능 임계값 확인
- Performance: ≥ 85점
- Accessibility: ≥ 95점
- Best Practices: ≥ 90점
```

## 코드 품질 및 자동화

### 자동화된 품질 관리

#### Pre-commit Hooks (Husky + lint-staged)

```bash
# 커밋 전 자동 실행
✅ ESLint 검사 및 자동 수정
✅ Prettier 포맷팅
✅ TypeScript 타입 체크
```

#### CI/CD 파이프라인 검사

- **코드 품질**: ESLint, TypeScript, Prettier
- **테스트**: Jest 단위테스트, Playwright E2E
- **보안**: 의존성 감사, Snyk 스캔
- **성능**: Lighthouse CI 자동 감사

### 성능 친화적 코딩 패턴

#### React 최적화

```typescript
// 메모이제이션 활용
const OptimizedComponent = memo(function Component({ data }) {
  const expensiveValue = useMemo(() =>
    computeExpensiveValue(data), [data]
  )
  return <div>{expensiveValue}</div>
})

// SWR 캐싱 패턴
const { data, error } = useSWR('/api/data', fetcher, {
  revalidateOnFocus: true,
  dedupingInterval: 2000,
})
```

---

## 🚀 성능 모니터링 및 최적화

### 📊 Web Vitals 실시간 모니터링

#### 🎯 측정 지표

- **LCP (Largest Contentful Paint)**: 목표 ≤2.5초
- **FID (First Input Delay)**: 목표 ≤100ms
- **CLS (Cumulative Layout Shift)**: 목표 ≤0.1
- **FCP (First Contentful Paint)**: 목표 ≤1.8초
- **TTFB (Time to First Byte)**: 목표 ≤800ms
- **INP (Interaction to Next Paint)**: 목표 ≤200ms

#### 🔧 구현 세부사항

```typescript
// Web Vitals 자동 측정 및 보고
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter'

// 전역 레이아웃에 통합
<WebVitalsReporter />
```

#### 📈 모니터링 대상

- **Sentry 통합**: 성능 메트릭 자동 전송
- **로컬 스토리지**: 개발 환경 디버깅용 데이터 저장
- **Google Analytics**: 사용자 성능 데이터 수집 (선택사항)

### ⚡ React 성능 최적화

#### 메모이제이션 적용

```typescript
// 컴포넌트 레벨 최적화
const BalanceWidget = memo(function BalanceWidget({ ... }) {
  // useMemo를 활용한 계산 최적화
  const formatCurrency = useMemo(() =>
    (amount: number) => new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: safeBalanceData.currency,
    }).format(amount),
    [safeBalanceData.currency]
  )

  // 조건부 렌더링 최적화
  const isPositive = useMemo(() =>
    balanceData?.totalBalance >= 0,
    [balanceData?.totalBalance]
  )
})
```

#### 적용된 컴포넌트

- ✅ `Button` - UI 컴포넌트 메모이제이션
- ✅ `BalanceWidget` - 잔액 위젯 최적화
- ✅ `OptimizedImage` - 이미지 컴포넌트 최적화

### 🗄️ 데이터 캐싱 전략 (SWR)

#### 캐싱 설정

```typescript
// SWR 전역 설정
export const swrConfig: SWRConfiguration = {
  dedupingInterval: 2000, // 2초 내 중복 요청 방지
  focusThrottleInterval: 5000, // 5초 내 포커스 재검증 방지
  revalidateOnFocus: true, // 포커스 시 자동 재검증
  errorRetryCount: 3, // 최대 3회 재시도
}
```

#### 구현된 훅

- ✅ `useBalance` - 잔액 데이터 캐싱
- ✅ `useTransactions` - 거래 내역 캐싱
- ✅ `useRecentTransactions` - 최근 거래 캐싱

#### 캐시 무효화 패턴

```typescript
// 거래 추가 시 관련 캐시 자동 무효화
const CACHE_INVALIDATION_PATTERNS = {
  TRANSACTION_CHANGE: (ownerType, ownerId) => [
    CACHE_KEYS.BALANCE(ownerType, ownerId),
    CACHE_KEYS.TRANSACTIONS(ownerType, ownerId),
  ],
}
```

### 📱 최적화 체크리스트

#### 개발 시 확인사항

- [ ] 컴포넌트 메모이제이션 적용 여부
- [ ] 불필요한 리렌더링 방지
- [ ] 데이터 캐싱 전략 적용
- [ ] 이미지 최적화 (next/image 사용)
- [ ] 번들 크기 확인 (`pnpm run analyze`)

#### 배포 전 성능 검증

- [ ] Lighthouse 성능 점수 90+ 확인
- [ ] Web Vitals 지표 목표치 달성
- [ ] 모바일 성능 테스트 완료
- [ ] 큰 번들 크기 컴포넌트 최적화

### 🔧 성능 도구 및 명령어

```bash
# 성능 분석
pnpm run build:analyze    # 번들 분석
pnpm run lighthouse      # Lighthouse 성능 테스트

# 성능 모니터링
pnpm run perf:monitor    # 로컬 성능 모니터링
pnpm run perf:report     # 성능 리포트 생성
```

---

이 문서는 팀의 성장과 프로젝트 진화에 따라 지속적으로 업데이트됩니다.
