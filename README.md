# 🏠 우리가족 가계부 (Household Ledger)

신혼부부가 각자 입력해도 자동으로 하나의 가계부로 묶여 지출을 투명하게 공유할 수 있는 **수동 입력 위주의 초간단 가계부**입니다.

## ✨ 주요 특징

### 💑 신혼부부 특화 기능

- **가족코드 연동**: 10자리 코드로 간편한 그룹 연결
- **실시간 동기화**: 두 사람이 각자 입력해도 실시간 통합
- **투명한 지출 공유**: 서로의 소비 패턴 투명하게 확인
- **개인 프라이버시**: 월급 통장 공개 없이 지출만 공유

### 📊 스마트 가계부 기능

- **다중 통화 지원**: 실시간 환율 적용 (exchangerate.host API)
- **카테고리 관리**: 기본 카테고리 + 사용자 정의 추가
- **월별 통계**: 시각적 그래프로 소비 패턴 분석
- **예산 설정**: 카테고리별 예산 설정 및 초과 알림
- **반복 지출**: 월세, 구독료 등 자동 등록

### ⚡ 성능 최적화

- **Web Vitals 모니터링**: 실시간 성능 지표 측정 및 최적화
- **데이터 캐싱**: SWR 기반 스마트 캐싱으로 빠른 로딩
- **이미지 최적화**: WebP/AVIF 지원, 반응형 이미지
- **React 최적화**: memo, useMemo를 통한 렌더링 최적화

## 🛠️ 기술 스택

### Frontend

- **Next.js 15** - React 프레임워크, Turbopack 지원
- **React 19** - 최신 UI 라이브러리
- **TypeScript** - 타입 안전성
- **TailwindCSS** - 유틸리티 우선 CSS
- **Radix UI** - 접근성 우수한 UI 컴포넌트

### Backend & Database

- **Supabase** - BaaS (Backend as a Service)
- **PostgreSQL** - 관계형 데이터베이스
- **Prisma** - 타입 안전한 ORM
- **NextAuth.js** - 인증 시스템

### DevOps & Monitoring

- **Vercel** - 자동 배포 및 호스팅
- **GitHub Actions** - CI/CD 파이프라인
- **Sentry** - 에러 모니터링 및 성능 추적
- **Lighthouse CI** - 자동 성능 감사

### Testing & Quality

- **Jest** - 단위 테스트
- **Playwright** - E2E 테스트
- **ESLint + Prettier** - 코드 품질 관리
- **Husky + lint-staged** - 자동 코드 검증

### Performance & Optimization

- **SWR** - 데이터 페칭 및 캐싱
- **Web Vitals** - 성능 모니터링
- **Image Optimization** - 차세대 이미지 형식
- **Bundle Analysis** - 번들 크기 최적화

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm (권장 패키지 매니저)
- PostgreSQL (또는 Supabase 계정)

### 설치 및 실행

1. **저장소 클론**

   ```bash
   git clone https://github.com/your-username/household-ledger.git
   cd household-ledger
   ```

2. **의존성 설치**

   ```bash
   pnpm install
   ```

3. **환경 변수 설정**

   ```bash
   cp .env.example .env.local
   # .env.local 파일을 편집하여 필요한 환경 변수 설정
   ```

4. **데이터베이스 설정**

   ```bash
   # Prisma 마이그레이션 실행
   pnpm db:migrate

   # 시드 데이터 삽입 (선택사항)
   pnpm db:seed
   ```

5. **개발 서버 실행**

   ```bash
   pnpm dev
   ```

6. **브라우저에서 확인**
   ```
   http://localhost:3001
   ```

## 📱 주요 화면

### 🏠 메인 대시보드

- 월별 수입/지출 요약
- 잔액 및 예산 현황
- 최근 거래 내역

### 💰 거래 입력

- 간편한 수입/지출 입력
- 카테고리 및 메모 추가
- 다중 통화 지원

### 📊 통계 분석

- 월별/카테고리별 차트
- 소비 패턴 분석
- 예산 대비 실적

### 👥 그룹 관리

- 가족코드 생성/입력
- 구성원 관리
- 권한 설정

## 🧪 테스트 실행

### 단위 테스트

```bash
# 전체 테스트 실행
pnpm test

# 테스트 커버리지 확인
pnpm test:coverage

# 테스트 감시 모드
pnpm test:watch
```

### E2E 테스트

```bash
# Playwright E2E 테스트
pnpm e2e

# 헤드리스 모드로 실행
pnpm e2e:headless

# 테스트 리포트 확인
pnpm e2e:report
```

### 성능 테스트

```bash
# Lighthouse CI 실행
lhci autorun

# 로컬 성능 감사
pnpm build && pnpm start
```

## 🔍 코드 품질 관리

### 린팅 및 포맷팅

```bash
# ESLint 실행
pnpm lint

# ESLint 자동 수정
pnpm lint:fix

# Prettier 포맷팅
pnpm format

# TypeScript 타입 체크
pnpm type-check
```

### 보안 검사

```bash
# 의존성 보안 감사
pnpm security:audit

# 종합 보안 체크
pnpm security:check

# 의존성 업데이트
pnpm security:update
```

## 📊 성능 모니터링

### Web Vitals 모니터링

- **LCP (Largest Contentful Paint)**: ≤ 2.5초
- **INP (Interaction to Next Paint)**: ≤ 200ms
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **FCP (First Contentful Paint)**: ≤ 1.8초
- **TTFB (Time to First Byte)**: ≤ 800ms

### 성능 대시보드 (개발 환경)

- 실시간 성능 지표 확인
- 성능 개선 권장사항
- 히스토리 추적 및 분석

### 자동 성능 감사

- CI/CD 파이프라인 통합
- 4개 핵심 페이지 모니터링
- 성능 회귀 자동 감지

## 🏗️ 프로젝트 구조

```
household-ledger/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 관련 페이지
│   │   ├── api/               # API 라우트
│   │   └── globals.css        # 전역 스타일
│   ├── components/            # React 컴포넌트
│   │   ├── ui/                # 기본 UI 컴포넌트
│   │   ├── balance/           # 잔액 관련 컴포넌트
│   │   ├── couple-ledger/     # 가계부 컴포넌트
│   │   ├── error/             # 에러 처리 컴포넌트
│   │   └── performance/       # 성능 모니터링 컴포넌트
│   ├── contexts/              # React Context
│   ├── hooks/                 # 커스텀 훅
│   ├── lib/                   # 유틸리티 및 설정
│   ├── services/              # 비즈니스 로직
│   └── types/                 # TypeScript 타입 정의
├── tests/                     # 테스트 파일
│   ├── components/            # 컴포넌트 테스트
│   ├── lib/                   # 라이브러리 테스트
│   └── e2e/                   # E2E 테스트
├── prisma/                    # 데이터베이스 스키마
├── .github/                   # GitHub 설정 및 워크플로우
├── public/                    # 정적 파일
└── docs/                      # 프로젝트 문서
```

## 🤝 기여하기

### 개발 워크플로우

1. **이슈 생성**: 새로운 기능이나 버그 리포트
2. **브랜치 생성**: `feature/기능명` 또는 `bugfix/버그명`
3. **개발 진행**: TDD 방식으로 테스트 우선 개발
4. **PR 생성**: 코드 리뷰 및 자동 테스트 실행
5. **머지**: 모든 검증 통과 후 main 브랜치에 병합

### 브랜치 전략

```
main                    # 프로덕션 브랜치
├── develop            # 개발 브랜치
├── feature/*          # 새로운 기능
├── bugfix/*           # 버그 수정
├── hotfix/*           # 긴급 수정
└── release/*          # 릴리즈 준비
```

### 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경
perf: 성능 개선
ci: CI/CD 설정 변경
```

### 코드 리뷰 체크리스트

- [ ] 기능성: 요구사항 충족 여부
- [ ] 코드 품질: 가독성, 유지보수성
- [ ] 보안: 보안 취약점 점검
- [ ] 성능: 성능 영향 분석
- [ ] 테스트: 적절한 테스트 커버리지
- [ ] 문서: 코드 및 API 문서화

## 📚 문서 및 가이드

### 개발 가이드

- [개발 워크플로우](DEVELOPMENT_WORKFLOW.md)
- [코드 리뷰 체크리스트](CODE_REVIEW_CHECKLIST.md)
- [스타일 가이드](STYLE_GUIDE.md)
- [성능 최적화 가이드](PERFORMANCE_OPTIMIZATION.md)

### 보안 및 운영

- [보안 가이드](SECURITY.md)
- [Sentry 설정 가이드](SENTRY_SETUP.md)
- [GitHub 저장소 설정](.github/REPOSITORY_SETUP.md)

### API 문서

- [API 엔드포인트 문서](docs/api.md)
- [데이터베이스 스키마](docs/database.md)
- [인증 시스템](docs/authentication.md)

## 📈 로드맵

### Phase 1: MVP (완료)

- ✅ 회원가입/로그인 시스템
- ✅ 가족코드 그룹 연동
- ✅ 수입/지출 입력 및 관리
- ✅ 카테고리 관리
- ✅ 다중 통화 지원

### Phase 2: 분석 기능 (완료)

- ✅ 월별/카테고리별 통계
- ✅ 예산 설정 및 알림
- ✅ 반복 지출 자동 등록
- ✅ 성능 모니터링 시스템

### Phase 3: 고도화 (진행 중)

- 🔄 PWA 지원
- 🔄 오프라인 모드
- 🔄 다국어 지원
- 🔄 고급 통계 및 인사이트

### Phase 4: 확장 (계획)

- 📅 모바일 앱 (React Native)
- 📅 AI 기반 지출 패턴 분석
- 📅 금융 상품 추천
- 📅 커뮤니티 기능

## 🚨 문제 해결

### 자주 발생하는 문제

#### 1. 개발 서버 시작 실패

```bash
# Next.js 캐시 클리어
rm -rf .next

# 의존성 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Turbopack 없이 시작
pnpm dev:no-turbo
```

#### 2. 데이터베이스 연결 문제

```bash
# Prisma 클라이언트 재생성
pnpm db:generate

# 데이터베이스 재설정
pnpm db:reset
```

#### 3. 타입 에러

```bash
# TypeScript 타입 체크
pnpm type-check

# Prisma 타입 재생성
pnpm db:generate
```

#### 4. 성능 문제

```bash
# 번들 분석
pnpm analyze

# 성능 감사
lhci autorun
```

### 지원 및 문의

- **이슈 리포트**: [GitHub Issues](https://github.com/your-username/household-ledger/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/your-username/household-ledger/discussions)
- **보안 문제**: security@household-ledger.com

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:

- [Next.js](https://nextjs.org/) - React 프레임워크
- [Supabase](https://supabase.com/) - 오픈소스 Firebase 대안
- [Prisma](https://www.prisma.io/) - 차세대 ORM
- [TailwindCSS](https://tailwindcss.com/) - 유틸리티 우선 CSS
- [Radix UI](https://www.radix-ui.com/) - 접근성 우수한 UI 컴포넌트
- [SWR](https://swr.vercel.app/) - 데이터 페칭 라이브러리
- [Jest](https://jestjs.io/) - JavaScript 테스팅 프레임워크
- [Playwright](https://playwright.dev/) - E2E 테스팅 도구

---

**만든 이**: Development Team  
**버전**: 1.0.0  
**마지막 업데이트**: 2024년 12월

_"신혼부부의 투명하고 스마트한 가계 관리를 위해 💑"_
