# 📝 CHANGELOG - 프로젝트 변경 이력

신혼부부를 위한 현대적 가계부 웹 애플리케이션의 주요 변경사항을 기록합니다.

---

## [2025.01.08] - 5개 핵심 페이지 완성 및 네비게이션 간소화

### 🎉 주요 변경사항

#### ✨ 신규 기능 추가

**1. 네비게이션 시스템 간소화**

- 기존 10개+ 메뉴에서 5개 핵심 메뉴로 간소화
- 데스크탑: 좌측 사이드바 (메인/설정 2개 섹션)
- 모바일: 하단 네비게이션 (5개 메뉴 균등 배치)
- 빠른 입력 버튼을 모바일에서 플로팅 우하단으로 이동

**2. 월요약 대시보드 페이지 (`/`)**

- 수입/지출 요약 카드 (전월 대비 증감률 표시)
- 카테고리별 지출 TOP 5 분석
- 예산 대비 실제 지출 현황
- 지출 분할 현황 (개인/공동/배우자)

**3. 거래내역 페이지 (`/transactions`)**

- 완전한 필터링 시스템 (검색, 카테고리, 기간, 타입, 담당자)
- 정렬 기능 (날짜, 금액, 카테고리별)
- 반응형 거래 목록 (카드 기반 표시)
- 거래 편집/삭제 인터페이스
- 빈 상태 처리 및 사용자 안내

**4. 월별 통계 페이지 (`/statistics`)**

- 수입/지출/잔액/저축률 요약 카드
- 카테고리별 지출 분석 (TOP 5, 진행률 바, 트렌드)
- 지출 분할 현황 시각화
- 6개월 트렌드 분석 (미니 차트 포함)
- 기간별 비교 옵션

**5. 내 정보 페이지 (`/profile`)**

- 프로필 편집 기능 (이름, 전화번호)
- 부부 그룹 정보 관리 (그룹 코드 표시/복사)
- 알림 설정 (이메일, 푸시, 예산, 주간 리포트)
- 사용 통계 (사용 기간, 거래 건수, 카테고리 수)
- 빠른 액션 버튼들

**6. 카테고리 관리 페이지 (`/categories`)**

- 카테고리 CRUD 시스템 (생성, 편집, 삭제)
- 16개 기본 색상 팔레트 + 커스텀 색상
- 아이콘 및 색상 관리
- 카테고리별 사용 통계 (사용량, 트렌드, 최근 사용일)
- 타입별 필터링 (수입/지출) 및 검색

#### 🔧 기술적 개선

**CSS 시스템 안정화**

- TailwindCSS v4 베타에서 v3.4 안정 버전으로 다운그레이드
- `border-border-primary` 등 커스텀 클래스 문제 해결
- PostCSS 설정을 v3 호환으로 업데이트
- 빌드 캐시 정리 (`.next`, `node_modules/.cache`)

**반응형 디자인 최적화**

- 커스텀 반응형 클래스를 표준 TailwindCSS로 변경
- `hidden md:block`, `block md:hidden` 등 표준 브레이크포인트 사용
- 모바일/데스크탑 각각 최적화된 레이아웃
- 터치 친화적 인터페이스 (44px+ 터치 타겟)

**컴포넌트 아키텍처**

- `ResponsiveLayout` 컴포넌트로 일관된 레이아웃 제공
- 모든 페이지에서 `QuickAddModal` 접근 가능
- 재사용 가능한 UI 컴포넌트 활용 (Card, Button, Input, Badge)

#### 📊 데이터 및 UX

**모킹 데이터 시스템**

- 실제 사용 환경과 동일한 수준의 더미 데이터 구현
- 카테고리별 색상 코딩 및 아이콘 시스템
- 현실적인 금액, 날짜, 통계 데이터
- 트렌드 분석 (상승/하락/안정) 표시

**사용자 경험 개선**

- 직관적인 아이콘 및 색상 시스템
- 로딩 상태 및 빈 상태 처리
- 에러 처리 및 사용자 피드백
- 접근성 고려한 색상 대비

### 🗂️ 파일 변경사항

#### 신규 파일 추가

```
src/app/transactions/page.tsx    # 거래내역 페이지
src/app/statistics/page.tsx      # 월별 통계 페이지
src/app/profile/page.tsx         # 내 정보 페이지
src/app/categories/page.tsx      # 카테고리 관리 페이지
```

#### 수정된 파일

```
src/components/couple-ledger/DesktopSidebar.tsx     # 네비게이션 간소화
src/components/couple-ledger/MobileNavigation.tsx   # 5개 메뉴 + 플로팅 버튼
src/components/ui/dialog.tsx                        # CSS 클래스 수정
src/components/ui/textarea.tsx                      # CSS 클래스 수정
src/components/couple-ledger/CoupleSplitToggle.tsx  # CSS 클래스 수정
src/components/couple-ledger/QuickAddModal.tsx      # CSS 클래스 수정
src/components/couple-ledger/CategoryPicker.tsx     # CSS 클래스 수정
src/app/globals.css                                 # border 속성 명시적 정의
tailwind.config.ts                                 # v3 호환성
postcss.config.mjs                                 # v3 PostCSS 설정
```

### 🔄 Breaking Changes

**네비게이션 구조 변경**

- 기존 복잡한 메뉴 구조에서 5개 핵심 메뉴로 단순화
- 일부 기존 라우트 경로 변경 가능성
- 모바일 빠른 입력 버튼 위치 변경 (중앙 → 우하단 플로팅)

**CSS 클래스 변경**

- 커스텀 CSS 클래스를 표준 TailwindCSS 클래스로 대체
- `border-border-primary` → `border-gray-200`
- `bg-surface-primary` → `bg-white`
- `text-text-primary` → `text-gray-900`

### 🎯 다음 계획

**Phase 7: API 연결 및 실제 데이터**

- 모킹 데이터를 실제 Supabase API 연결로 변경
- 거래 CRUD API 연동
- 통계 데이터 실시간 계산
- 카테고리 관리 API 연동

**Phase 8: 분할 및 정산 시스템**

- 그룹 거래 분할 계산 로직
- 정산 스냅샷 생성 시스템
- 정산 UI 및 관리 페이지

---

## [2024.12.22] - 통합 인증 플로우 및 UI/UX 현대화

### 주요 변경사항

- 슬레이트 색상 팔레트 적용
- 이메일 우선 통합 인증 시스템
- 한국어 웹폰트 적용
- 사용자 친화적 이메일 입력 방식

---

## [2024.08.24] - MVP 가계부 시스템 완성

### 주요 변경사항

- Zustand 스토어 기반 상태 관리
- 4개 핵심 가계부 컴포넌트 구현
- Transaction API 완전 구현
- 실시간 거래 동기화

---

## [2024.08.20] - 계좌 및 카테고리 관리 시스템

### 주요 변경사항

- Account, Category 모델 CRUD API
- 그룹/개인 소유권 검증
- 카테고리 색상 시스템

---

## [2024.08.15] - 그룹 관리 시스템

### 주요 변경사항

- 그룹 생성 및 초대 시스템
- 권한 기반 멤버 관리
- 그룹 전환 UI

---

## [2024.08.10] - 인증 시스템 및 데이터베이스

### 주요 변경사항

- JWT 기반 인증 시스템
- Prisma + MySQL 스키마
- 회원가입/로그인 UI

---

## [2024.08.05] - 프로젝트 초기 설정

### 주요 변경사항

- Next.js 15 + TypeScript 설정
- TailwindCSS + Radix UI 디자인 시스템
- 기본 프로젝트 구조

---

**📝 변경 이력 기록 규칙**

- 날짜별 역순 정렬 (최신이 상단)
- 주요 변경사항을 기능별로 분류
- 파일 변경사항 명시
- Breaking Changes 별도 표시
- 다음 계획 포함
