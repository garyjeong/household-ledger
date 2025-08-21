# Household Ledger - 프로젝트 목표 및 개발 계획

## 프로젝트 개요

### 목적
개인 및 그룹(기본 2인, 다인 확장 가능) 가계부 웹 애플리케이션 구축
- KRW 기준 수입/지출/이체 관리
- 그룹 내 거래 분할 및 정산 기능
- 예산 관리 및 분석 대시보드
- CSV 가져오기/내보내기

### 핵심 특징
- 단일 리포지토리 구조 (프론트엔드 + 백엔드 일체형)
- MySQL 기반 데이터 저장
- 보라색(brand-600) 메인 컬러, 마젠타 그라디언트 디자인
- 화이트 카드, 12-16px 라운드 모서리
- 라벤더 칩/배지, 파스텔 톤 차트

## 기술 스택

### 프론트엔드
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React hooks + Context API
- **Charts**: Recharts 또는 Chart.js
- **Form Handling**: React Hook Form + Zod

### 백엔드
- **Runtime**: Node.js
- **Framework**: Next.js API Routes + Server Actions
- **Database**: MySQL 8.0+
- **ORM**: Prisma
- **Authentication**: JWT (Access + Refresh Token)
- **Password Hashing**: bcrypt
- **File Upload**: Multer + 로컬/S3 스토리지

### 개발 도구
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Type Checking**: TypeScript strict mode
- **Database Migration**: Prisma Migrate

## 핵심 기능

### 1. 사용자 인증 및 계정 관리
- 이메일/비밀번호 기반 회원가입/로그인
- JWT 토큰 기반 인증 (Access + Refresh)
- 프로필 관리 (닉네임, 아바타)
- 비밀번호 재설정

### 2. 그룹 관리
- 그룹 생성 (기본 2인, 다인 확장)
- 초대 링크/코드를 통한 멤버 초대
- 역할 관리 (OWNER, ADMIN, MEMBER)
- 그룹 전환 기능 (헤더 스위처)

### 3. 계좌 및 카테고리 관리
- 개인/그룹 단위 계좌 관리 (현금, 카드, 은행 등)
- 실시간 잔액 추적
- 기본 카테고리 템플릿 (식비, 교통, 주거, 공과금, 의료, 교육, 취미, 기타)
- 사용자/그룹 커스텀 카테고리
- 태그 시스템

### 4. 거래 관리
- 수입/지출/이체 기록
- 거래 정보: 날짜, 금액, 계좌, 카테고리, 메모, 가맹점, 태그
- 파일 첨부 (영수증 등)
- 그룹 거래 시 분할 기능 (비율/정액)
- 필터링 및 검색 (날짜범위, 금액범위, 카테고리, 태그, 정산상태)

### 5. 분할 및 정산
- 그룹 거래의 분할 비율/정액 설정
- 정산 기간 설정 및 미리보기
- 사용자별 정산 금액 자동 계산
- 정산 스냅샷 생성 및 완료 처리
- 정산 내역 추적

### 6. 예산 관리
- 월간 예산 설정 (전체/카테고리별)
- 실시간 예산 진행률 표시
- 예산 초과 경고 및 알림
- 예산 대비 실제 지출 분석

### 7. 반복 거래
- 월세, 구독료 등 반복 거래 자동 생성
- 반복 규칙 설정 (월간/주간)
- 건너뛰기/일시정지 기능

### 8. 분석 및 리포트
- 월별 수입/지출 합계
- 카테고리별 도넛 차트
- 일/주/월 추이 라인 차트
- 상위 가맹점 분석
- 사용자별 지출 패턴

### 9. 데이터 가져오기/내보내기
- CSV 파일 업로드 및 컬럼 매핑
- 데이터 프리뷰 및 검증
- CSV/JSON 형태로 데이터 내보내기
- 백업 및 복원 기능

## 데이터베이스 구조

### 주요 테이블
- `users`: 사용자 정보
- `groups`: 그룹 정보
- `group_members`: 그룹 멤버십
- `accounts`: 계좌 정보
- `categories`: 카테고리
- `tags`: 태그
- `transactions`: 거래 내역
- `transaction_participants`: 거래 참여자 (분할 정보)
- `attachments`: 첨부 파일
- `budgets`: 예산
- `budget_categories`: 카테고리별 예산
- `recurring_rules`: 반복 규칙
- `settlements`: 정산
- `settlement_items`: 정산 항목

### 주요 인덱스
- `transactions(group_id, date)`
- `transactions(owner_user_id, date)`
- `settlements(group_id, status)`
- `categories(owner_type, owner_id)`
- `accounts(owner_type, owner_id)`

## UI/UX 설계

### 색상 시스템
```typescript
// Tailwind 확장 색상
brand: { 
  50: "#F3E9FF", 
  100: "#E9D9FF", 
  400: "#9E60FF", 
  600: "#6F3DF5", 
  700: "#5A2FE0" 
},
accent: { magenta: "#D957FF" },
chip: { lavender: "#EDE7FF" },
text: { 900: "#1D2230", 700: "#373C48" },
stroke: { 200: "#E8EAF0" },
surface: { card: "#FFFFFF", page: "#FAFAFB" }
```

### 주요 페이지
- `/login`, `/signup`, `/forgot-password` - 인증
- `/dashboard` - 대시보드 (월간 요약, 예산 진행, 최근 거래)
- `/transactions` - 거래 목록 및 관리
- `/budgets` - 예산 관리
- `/analytics` - 분석 및 리포트
- `/groups` - 그룹 관리
- `/groups/:id` - 그룹 대시보드
- `/groups/:id/settlements` - 정산 관리
- `/settings` - 설정 (프로필, 카테고리, 계좌, 태그, 데이터 관리)

### 컴포넌트 가이드
- **NavBar**: 좌측 로고, 중앙 탭, 우측 그룹 스위처 + 프로필
- **Primary Button**: brand-600 배경, hover 시 8% 어둡게, 12-14px 라운드
- **Card**: 화이트 배경, 1px stroke-200 테두리, 12-16px 라운드, 가벼운 그림자
- **Chip**: 라벤더 배경 + brand 텍스트, pill 형태
- **Charts**: 파스텔 톤, 범례 칩, 최소화된 축/그리드

## API 설계

### 인증 API
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/me` - 현재 사용자 정보

### 그룹 API
- `GET /api/groups` - 내 그룹 목록
- `POST /api/groups` - 그룹 생성
- `POST /api/groups/:id/invite` - 초대 링크 생성
- `POST /api/groups/join` - 그룹 참여

### 거래 API
- `GET /api/transactions` - 거래 목록 (필터링, 페이지네이션)
- `POST /api/transactions` - 거래 생성
- `PATCH /api/transactions/:id` - 거래 수정
- `DELETE /api/transactions/:id` - 거래 삭제

### 예산 API
- `GET /api/budgets` - 예산 목록
- `POST /api/budgets` - 예산 생성
- `PATCH /api/budgets/:id` - 예산 수정

### 정산 API
- `GET /api/settlements` - 정산 목록
- `POST /api/settlements` - 정산 생성
- `GET /api/settlements/:id` - 정산 상세
- `POST /api/settlements/:id/close` - 정산 완료

### 가져오기/내보내기 API
- `POST /api/import/csv` - CSV 가져오기
- `GET /api/export/csv` - CSV 내보내기
- `GET /api/export/json` - JSON 내보내기

## 개발 마일스톤

### M0. 프로젝트 부트스트랩
- Next.js + TypeScript + Tailwind + Prisma 초기 설정
- 색상 토큰 적용, ESLint/Prettier 설정
- .env.example 파일 생성

### M1. 인증 및 기본 도메인
- Prisma 스키마 작성 및 마이그레이션
- JWT 인증 시스템 구현
- 기본 레이아웃 및 네비게이션
- 시드 데이터 (사용자 2명, 그룹 1개, 거래 10건)

### M2. 거래 MVP
- 거래 CRUD API 구현
- 거래 목록 및 필터링 UI
- 거래 작성 폼
- 파일 첨부 기능

### M3. 그룹 및 정산
- 그룹 관리 기능
- 정산 계산 로직 구현
- 정산 미리보기 및 생성 UI
- 정산 완료 처리

### M4. 예산, 반복, 분석
- 예산 관리 기능
- 반복 거래 자동 생성
- 분석 대시보드 (차트 포함)

### M5. 가져오기/내보내기 및 설정
- CSV 가져오기 파이프라인
- 데이터 내보내기 기능
- 설정 페이지 구현

### M6. 품질 보증 및 배포
- 단위/통합 테스트 작성
- 접근성 개선
- 보안 점검
- 배포 준비

## 보안 고려사항

### 인증 보안
- 비밀번호 bcrypt 해싱
- JWT 토큰 만료 시간 설정
- Refresh Token 로테이션
- CSRF 보호

### 데이터 보안
- 소유권 및 그룹 멤버십 검증
- SQL 인젝션 방지 (Prisma ORM)
- 파일 업로드 타입 및 크기 제한
- 입력 데이터 검증 (Zod)

### API 보안
- Rate Limiting
- CORS 설정
- 민감한 정보 로깅 방지

## 성능 최적화

### 데이터베이스
- 적절한 인덱스 설계
- Cursor 기반 페이지네이션
- 쿼리 최적화

### 프론트엔드
- 코드 스플리팅
- 이미지 최적화
- 캐싱 전략
- 무한 스크롤

## 테스트 전략

### 단위 테스트
- 정산 계산 로직
- 분할 합계 검증
- 예산 초과 판정
- 유틸리티 함수

### 통합 테스트
- API 엔드포인트
- 인증 플로우
- 거래 → 정산 E2E 플로우

### 품질 목표
- 단위 테스트 커버리지 ≥ 80% (도메인 로직)
- E2E 성공률 ≥ 95%
- 핵심 쿼리 p95 < 50ms

## 배포 및 운영

### 환경 구성
- 개발/스테이징/프로덕션 환경 분리
- 환경별 데이터베이스 분리
- 환경 변수 관리

### 모니터링
- 애플리케이션 로그
- 에러 추적 (Sentry)
- 성능 모니터링
- 데이터베이스 모니터링

## 향후 확장 계획

### 단기 (3개월)
- 모바일 반응형 최적화
- PWA 기능 추가
- 다국어 지원 준비

### 중기 (6개월)
- 다중 통화 지원
- 고급 분석 기능
- API 공개 및 써드파티 연동

### 장기 (1년)
- 모바일 앱 개발
- 머신러닝 기반 지출 예측
- 금융 기관 연동 (오픈뱅킹)

## 팀 구성 및 역할

### 개발팀
- **풀스택 개발자**: 전체 시스템 구현
- **UI/UX 디자이너**: 디자인 시스템 및 사용자 경험
- **QA 엔지니어**: 테스트 전략 및 품질 보증

### 스킬 요구사항
- React/Next.js 숙련도
- TypeScript 경험
- 데이터베이스 설계 능력
- API 설계 및 구현 경험
- UI/UX 디자인 감각
