# Household Ledger - 개발 TODO 리스트

> **PROMPT-GUIDE.md 기준 풀스택 개발 가이드라인 적용**
>
> 모델 → API → 컴포넌트 → 페이지 순서 진행, TypeScript strict mode, 보안 우선 설계

## 🎯 현재 진행 상황

### ✅ 완료된 Phase들

#### Phase 1: 프로젝트 기반 설정 ✅

- ✅ Next.js 15+ (App Router) + TypeScript strict mode
- ✅ Tailwind CSS v4 + Radix UI 디자인 시스템
- ✅ ESLint + Prettier + pnpm 설정
- ✅ 브랜드 색상 토큰 정의 및 적용
- ✅ 기본 UI 컴포넌트 (Button, Card, Input, Badge, Progress, Dialog, Select)

#### Phase 2: 데이터베이스 & 인증 시스템 ✅

- ✅ Prisma + MySQL 8.4 Docker 환경 구축
- ✅ 15개 테이블 완전 스키마 설계
- ✅ JWT 기반 인증 (Access + Refresh Token)
- ✅ bcrypt 비밀번호 해싱
- ✅ 회원가입/로그인 API (`/api/auth/*`)
- ✅ 인증 Context API + 보호된 라우트
- ✅ 로그인/회원가입 UI (React Hook Form + Zod)

#### Phase 3: 그룹 관리 시스템 ✅

- ✅ 그룹 CRUD API (`/api/groups/*`)
- ✅ 그룹 생성, 초대 코드, 멤버 관리
- ✅ 그룹 전환 UI (GroupSwitcher)
- ✅ 그룹 Context API

#### Phase 4: 테스트 환경 ✅

- ✅ Jest + Testing Library 설정
- ✅ 50+ 단위 테스트 (라이브러리 함수)
- ✅ API 테스트 구조 (일부 TypeScript 이슈 있음)

---

## ✅ 최근 완료된 Phase

### Phase 5: 계좌 및 카테고리 관리 시스템 ✅ 완료

**목적**: 거래 시스템의 기반 인프라 구축  
**범위**: Account, Category 모델 기반 CRUD API + UI 구현  
**보안**: 그룹/개인 소유권 검증, Zod 입력 검증  
**UI/UX**: 계좌 목록, 추가/편집 폼, 카테고리 관리

#### M5-1: Account 모델 API 구현 ✅

- ✅ `GET /api/accounts` - 사용자/그룹별 계좌 목록 (검색/필터링)
- ✅ `POST /api/accounts` - 계좌 생성 (개인/그룹)
- ✅ `PATCH /api/accounts/:id` - 계좌 수정
- ✅ `DELETE /api/accounts/:id` - 계좌 삭제
- ✅ `GET /api/accounts/:id` - 특정 계좌 조회
- ✅ 소유권 검증 미들웨어 구현
- ✅ Zod 스키마 정의 (createAccount, updateAccount)

#### M5-2: Category 모델 API 구현 ✅

- ✅ `GET /api/categories` - 카테고리 목록 (기본 + 커스텀, 자동 시드)
- ✅ `POST /api/categories` - 커스텀 카테고리 생성
- ✅ `PATCH /api/categories/:id` - 카테고리 수정 (커스텀만)
- ✅ `DELETE /api/categories/:id` - 카테고리 삭제 (커스텀만)
- ✅ `GET /api/categories/:id` - 특정 카테고리 조회
- ✅ 기본 카테고리 15개 자동 시드 (식비, 교통, 주거, 공과금, 급여, 투자 등)

#### M5-3: Account 관리 UI 구현 ✅

- ✅ AccountForm 컴포넌트 (생성/편집, React Hook Form + Zod)
- ✅ AccountList 컴포넌트 (카드 형태, 액션 메뉴)
- ✅ AccountDialog 컴포넌트 (모달)
- ✅ 계좌 타입별 아이콘 및 색상 시스템
- ✅ 실시간 금액 포맷팅 (천 단위 콤마)
- ✅ 잔액 색상 표시 (양수: 초록, 음수: 빨강)

#### M5-4: Category 관리 UI 구현 ✅

- ✅ CategoryForm 컴포넌트 (생성/편집, 거래 타입, 색상 선택)
- ✅ CategoryList 컴포넌트 (기본/커스텀 분리 표시)
- ✅ CategoryDialog 컴포넌트 (모달)
- ✅ ColorPicker 컴포넌트 (브랜드 팔레트 + HTML5 색상 선택기)
- ✅ 기본 카테고리 수정/삭제 방지
- ✅ 색상 미리보기 및 실시간 반영

#### M5-5: 통합 설정 페이지 ✅

- ✅ `/settings/accounts` 페이지 구현 (통계, 검색, 필터링)
- ✅ `/settings/categories` 페이지 구현 (통계, 검색, 필터링)
- ✅ 설정 네비게이션 레이아웃 (반응형 사이드바)
- ✅ 모바일 햄버거 메뉴
- ✅ 반응형 레이아웃 최적화

---

## 📋 다음 우선순위 Phase들

### Phase 6: 거래 CRUD 시스템 🎯 다음 목표

**목적**: 가계부의 핵심 기능인 거래 관리 구현  
**의존성**: ✅ Phase 5 (계좌/카테고리) 완료

#### M6-1: Transaction API 구현

- [ ] `GET /api/transactions` - 거래 목록 (필터링, 페이지네이션)
- [ ] `POST /api/transactions` - 거래 생성 (수입/지출/이체)
- [ ] `PATCH /api/transactions/:id` - 거래 수정
- [ ] `DELETE /api/transactions/:id` - 거래 삭제
- [ ] 거래 검색 및 필터링 로직
- [ ] 날짜 범위, 금액 범위, 카테고리 필터

#### M6-2: Transaction UI 구현

- [ ] TransactionForm 컴포넌트 (생성/편집)
- [ ] TransactionList 컴포넌트 (목록 표시)
- [ ] 거래 필터링 UI (날짜, 금액, 카테고리)
- [ ] 거래 타입별 색상 및 아이콘
- [ ] 무한 스크롤 또는 페이지네이션

#### M6-3: Transaction 페이지

- [ ] `/transactions` 메인 페이지
- [ ] `/transactions/new` 거래 추가 페이지
- [ ] `/transactions/:id/edit` 거래 편집 페이지
- [ ] 모바일 반응형 최적화

### Phase 7: 분할 및 정산 시스템 ⏳

**목적**: 그룹 거래의 분할 계산 및 정산 자동화

#### M7-1: TransactionParticipant 로직

- [ ] 그룹 거래 시 참여자 분할 비율/정액 설정
- [ ] 분할 계산 알고리즘 구현
- [ ] 분할 검증 로직 (합계 = 거래 금액)

#### M7-2: Settlement 시스템

- [ ] 정산 기간별 계산 로직
- [ ] 사용자별 정산 금액 계산
- [ ] 정산 스냅샷 생성
- [ ] 정산 완료 처리

#### M7-3: Settlement UI

- [ ] 정산 미리보기 컴포넌트
- [ ] 정산 생성 및 관리 페이지
- [ ] 정산 상태별 표시
- [ ] 정산 완료 처리 UI

### Phase 8: 예산 관리 시스템 ⏳

**목적**: 월별 예산 설정 및 진행률 추적

#### M8-1: Budget API

- [ ] 월별 예산 CRUD
- [ ] 카테고리별 예산 설정
- [ ] 실제 지출 대비 예산 계산
- [ ] 예산 초과 알림 로직

#### M8-2: Budget UI

- [ ] 예산 설정 폼
- [ ] 예산 진행률 표시 (Progress 컴포넌트)
- [ ] 예산 초과 경고 UI
- [ ] 월별 예산 비교 차트

### Phase 9: 분석 및 대시보드 ⏳

**목적**: 지출 패턴 분석 및 시각화

#### M9-1: Analytics API

- [ ] 월별 수입/지출 합계
- [ ] 카테고리별 지출 분석
- [ ] 시계열 데이터 집계
- [ ] 상위 가맹점 분석

#### M9-2: Dashboard UI

- [ ] 월간 요약 카드
- [ ] 카테고리별 도넛 차트 (Recharts)
- [ ] 일/주/월 추이 라인 차트
- [ ] 최근 거래 목록

#### M9-3: Analytics 페이지

- [ ] `/analytics` 상세 분석 페이지
- [ ] 기간별 필터링
- [ ] 그룹/개인 분석 전환
- [ ] 데이터 내보내기 기능

### Phase 10: 추가 기능 ⏳

#### M10-1: 파일 첨부 시스템

- [ ] 영수증 이미지 업로드
- [ ] 파일 타입 및 크기 검증
- [ ] 이미지 최적화 및 썸네일
- [ ] 첨부파일 관리 UI

#### M10-2: 반복 거래

- [ ] 반복 규칙 설정 (월간/주간)
- [ ] 자동 거래 생성 스케줄러
- [ ] 반복 거래 관리 UI
- [ ] 건너뛰기/일시정지 기능

#### M10-3: 데이터 관리

- [ ] CSV 가져오기 파이프라인
- [ ] 데이터 검증 및 매핑
- [ ] CSV/JSON 내보내기
- [ ] 백업 및 복원 기능

---

## 🛡️ 품질 보증 및 최적화

### 보안 강화

- [ ] API Rate Limiting 구현
- [ ] CORS 정책 최적화
- [ ] XSS/CSRF 추가 방어
- [ ] 민감 정보 로깅 방지
- [ ] 소유권 검증 강화

### 성능 최적화

- [ ] 데이터베이스 쿼리 최적화
- [ ] 인덱스 성능 분석
- [ ] 컴포넌트 메모이제이션
- [ ] 번들 크기 최적화
- [ ] 이미지 최적화

### 테스트 강화

- [ ] API 테스트 TypeScript 이슈 해결
- [ ] E2E 테스트 추가 (Playwright)
- [ ] 컴포넌트 테스트 확장
- [ ] 통합 테스트 커버리지 향상

### 접근성 및 UX

- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 검증
- [ ] 모바일 최적화
- [ ] 로딩 상태 및 에러 처리

---

## 📊 각 Phase별 예상 소요 시간

- **Phase 5** (계좌/카테고리): 3-4일
- **Phase 6** (거래 CRUD): 5-7일  
- **Phase 7** (분할/정산): 4-5일
- **Phase 8** (예산 관리): 3-4일
- **Phase 9** (분석/대시보드): 4-6일
- **Phase 10** (추가 기능): 5-7일

**총 예상 개발 기간**: 24-33일 (약 5-7주)

---

## 🔄 PROMPT-GUIDE.md 적용 원칙

### 풀스택 개발 워크플로우

1. **모델 확인** → Prisma 스키마 검토 및 최적화
2. **API 구현** → Next.js API Routes, Zod 검증, 보안 검증
3. **컴포넌트 개발** → Radix UI 기반, 재사용성 우선
4. **페이지 통합** → App Router, Server Actions 활용
5. **테스트 작성** → Jest + Testing Library

### 보안 우선 원칙

- 모든 API 입력 Zod 스키마 검증
- 소유권 및 그룹 멤버십 검증
- XSS/CSRF 방지 패턴 적용
- JWT 토큰 만료 및 갱신 관리

### 성능 최적화 원칙

- 컴포넌트 메모이제이션 적용
- 데이터베이스 쿼리 최적화
- 번들 크기 모니터링
- 이미지 및 에셋 최적화

---

> **💡 다음 단계**: Phase 5 (계좌 및 카테고리 관리) 진행  
> **우선순위**: Account API → Category API → Account UI → Category UI → 설정 페이지 통합
