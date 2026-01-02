# Household Ledger - Product Requirements Document (PRD)

**작성일**: 2025-01-25  
**버전**: 2.0  
**목적**: 신혼부부 가계부 서비스의 전체 기능 요구사항 정의서 (Rust 백엔드 + Flutter 모바일 앱)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 및 아키텍처](#2-기술-스택-및-아키텍처)
3. [데이터베이스 스키마](#3-데이터베이스-스키마)
4. [기능 요구사항](#4-기능-요구사항)
5. [API 명세서](#5-api-명세서)
6. [사용자 시나리오](#6-사용자-시나리오)
7. [비기능 요구사항](#7-비기능-요구사항)
8. [배포 및 운영](#8-배포-및-운영)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 정보

- **프로젝트명**: Household Ledger (신혼부부 가계부)
- **목적**: 신혼부부가 각자 입력해도 자동으로 하나의 가계부로 묶여 지출을 투명하게 공유할 수 있는 수동 입력 위주의 초간단 가계부 서비스
- **타겟 사용자**: 신혼부부, 커플
- **핵심 가치 제안**: 
  - 투명한 지출 공유 (월급 통장 공개 없이 지출만 공유)
  - 실시간 동기화 (두 사람이 각자 입력해도 실시간 통합)
  - 간편한 그룹 참여 (초대 코드로 가입과 동시에 그룹 연결)

### 1.2 프로젝트 구성

프로젝트는 2개의 독립적인 애플리케이션으로 구성됩니다 (Monorepo 구조):

```
┌─────────────────────────────────────────────────────┐
│  household-ledger-mobile (Flutter 앱)               │
│  - Flutter (최신 버전)                              │
│  - Dart 3.x                                         │
│  - Material Design 3                                │
│  - BLoC 패턴 상태 관리                              │
│  - WebSocket + SSE 클라이언트                       │
│  - Rust 백엔드 연동                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  household-ledger-api (Rust 백엔드)                  │
│  - Rust (최신 안정 버전)                            │
│  - Axum 또는 Actix-web                             │
│  - SQLx 또는 Diesel (ORM)                           │
│  - MySQL 8.4                                        │
│  - Clean Architecture + Repository Pattern         │
│  - WebSocket + Server-Sent Events 지원              │
│  - 50개+ API 엔드포인트 (v2)                       │
│  - Fly.io 배포                                      │
└─────────────────────────────────────────────────────┘
```

**참고**: 웹 프론트엔드는 향후 작업 예정입니다.

### 1.3 주요 특징

- **신혼부부 특화 기능**:
  - 회원가입 시 그룹 참여 (초대 코드로 가입과 동시에 가족 그룹 연결)
  - 가족코드 연동 (10-12자리 코드로 간편한 그룹 연결)
  - 실시간 동기화 (두 사람이 각자 입력해도 실시간 통합)
  - 투명한 지출 공유 (서로의 소비 패턴 투명하게 확인)
  - 개인 프라이버시 (월급 통장 공개 없이 지출만 공유)

- **핵심 기능**:
  - 거래 관리 (수입/지출/이체)
  - 카테고리 관리 (지출 분류)
  - 통계 및 분석 (월별/카테고리별 통계)
  - 예산 관리 (월별 예산 설정 및 현황)
  - 반복 거래 규칙 (자동 거래 생성)
  - 잔액 조회 (현재/예상 잔액)

- **새로운 기능 (v2.0)**:
  - 다중 통화 지원 (환율 자동 업데이트)
  - OCR 영수증 인식 (자동 거래 생성)
  - AI 기반 자동 카테고리 분류
  - 실시간 동기화 (WebSocket + Server-Sent Events)

---

## 2. 기술 스택 및 아키텍처

### 2.1 기술 스택

#### Mobile (Android 앱)
- **Framework**: Flutter (최신 버전)
- **Language**: Dart 3.x
- **Design**: Material Design 3
- **State Management**: BLoC Pattern (flutter_bloc)
- **Network**: Dio
- **Real-time**: WebSocket 클라이언트, Server-Sent Events (SSE) 클라이언트
- **Storage**: SharedPreferences
- **Charts**: fl_chart
- **Color Picker**: flutter_colorpicker
- **배포**: Google Play Store

#### Backend (API 서버)
- **Framework**: Rust (Axum 또는 Actix-web)
- **Language**: Rust (최신 안정 버전)
- **ORM**: SQLx 또는 Diesel
- **Migration**: SQLx migrations 또는 Diesel migrations
- **Database**: MySQL 8.4
- **Authentication**: JWT (jsonwebtoken 또는 jwt-simple)
- **Password Hashing**: BCrypt (bcrypt 크레이트)
- **Validation**: Serde + Validator
- **Real-time**: WebSocket (tokio-tungstenite), Server-Sent Events (SSE)
- **Testing**: cargo test (기본 테스트 프레임워크)
- **배포**: Fly.io (Rust 지원)

### 2.2 아키텍처 패턴

#### Android 앱 아키텍처
- **Pattern**: Clean Architecture (Data, Domain, Presentation)
- **State Management**: BLoC Pattern
- **Dependency Injection**: get_it
- **Repository Pattern**: Data access abstraction
- **Real-time Communication**: WebSocket 및 SSE 클라이언트를 통한 실시간 동기화

#### 백엔드 아키텍처
- **Pattern**: Clean Architecture + Repository Pattern
- **Layers**:
  - Domain Layer: 비즈니스 규칙 (모델, Repository 트레이트)
  - Application Layer: Use Cases (Service, Handler)
  - Infrastructure Layer: 기술 구현 (Repository 구현체, Security)
  - API Layer: HTTP 엔드포인트 (Router, WebSocket Handler, SSE Handler)
- **Design Principles**: SOLID 원칙 준수, Dependency Injection
- **Real-time Communication**: 
  - WebSocket: tokio-tungstenite를 사용한 양방향 실시간 통신
  - Server-Sent Events: SSE를 통한 서버 → 클라이언트 단방향 스트리밍
- **Monorepo 구조**: apps/mobile (Flutter), apps/api (Rust)로 구성

### 2.3 데이터베이스 설계 원칙

- **단순화**: 9개 핵심 테이블로 대폭 간소화 (53% 감소)
- **직접 연결**: 복잡한 매핑 테이블 제거, 외래키 직접 연결
- **JSON 활용**: UserSettings를 User.settings JSON 컬럼으로 통합
- **핵심 기능 집중**: 가계부 본연의 기능에만 집중

---

## 3. 데이터베이스 스키마

### 3.1 테이블 개요

총 **13개 핵심 테이블**로 구성됩니다 (v2.0):

#### 사용자 관리 (3개)
- `users` - 사용자 정보 + 설정(JSON) + 그룹 멤버십 직접 연결 + 기본 통화
- `groups` - 가족/커플 그룹 관리
- `group_invites` - 초대 코드 관리 (24시간 만료)

#### 금융 관리 (2개)
- `categories` - 거래 카테고리 + 예산 금액 직접 저장
- `tags` - 자유로운 태그 시스템

#### 거래 관리 (2개)
- `transactions` - 거래 내역 + 태그 직접 연결 + 통화 정보 (핵심)
- `attachments` - 영수증 첨부파일 관리

#### 고급 기능 (2개)
- `budgets` - 월별 총 예산 관리 (단순화)
- `recurring_rules` - 반복 거래 규칙

#### 다중 통화 지원 (2개) - v2.0 신규
- `exchange_rates` - 환율 정보 (통화별, 날짜별)
- `currency_preferences` - 사용자별 기본 통화 설정

#### 자동화 기능 (2개) - v2.0 신규
- `receipts` - OCR 영수증 데이터 (이미지, OCR 결과, 거래 연결)
- `auto_category_rules` - 자동 카테고리 분류 규칙 (AI 학습 데이터)

### 3.2 테이블 상세 정의

#### 3.2.1 users (사용자)

**목적**: 사용자 기본 정보 및 계정 관리

**필드**:
- `id` (BigInt, PK): 사용자 ID
- `email` (String, Unique): 이메일 주소 (인증용)
- `password_hash` (String): BCrypt 해시된 비밀번호
- `nickname` (String, 60자): 사용자 닉네임
- `avatar_url` (String, Optional, 500자): 프로필 이미지 URL
- `group_id` (BigInt, Optional, FK → groups.id): 그룹 멤버십 직접 연결
- `default_currency` (String, Optional, 3자): 기본 통화 코드 (예: "KRW", "USD") - v2.0 추가
- `settings` (JSON, Optional): 사용자 설정 정보 (알림, 테마 등)
- `created_at` (DateTime): 생성 일시

**인덱스**:
- `idx_users_group`: group_id 인덱스

**관계**:
- `group`: Group과의 관계 (그룹 멤버십)
- `transactions`: Transaction[] (소유한 거래)
- `categories`: Category[] (생성한 카테고리)
- `tags`: Tag[] (생성한 태그)
- `recurringRules`: RecurringRule[] (생성한 반복 규칙)

#### 3.2.2 groups (그룹)

**목적**: 가족/커플 그룹 관리

**필드**:
- `id` (BigInt, PK): 그룹 ID
- `name` (String, 120자): 그룹 이름
- `owner_id` (BigInt, FK → users.id): 그룹 소유자 ID
- `created_at` (DateTime): 생성 일시

**인덱스**:
- `groups_owner_id_fkey`: owner_id 인덱스

**관계**:
- `owner`: User와의 관계 (그룹 소유자)
- `members`: User[] (그룹 멤버들)
- `transactions`: Transaction[] (그룹 거래)
- `categories`: Category[] (그룹 카테고리)
- `tags`: Tag[] (그룹 태그)
- `invites`: GroupInvite[] (초대 코드)

#### 3.2.3 group_invites (그룹 초대 코드)

**목적**: 그룹 초대 코드 관리

**필드**:
- `id` (BigInt, PK): 초대 코드 ID
- `group_id` (BigInt, FK → groups.id): 그룹 ID
- `code` (String, Unique, 10자): 10자리 영문+숫자 초대 코드
- `created_by` (BigInt, FK → users.id): 생성자 ID
- `expires_at` (DateTime): 만료 시간 (24시간)
- `created_at` (DateTime): 생성 일시

**인덱스**:
- `idx_group_invites_group`: group_id 인덱스
- `idx_group_invites_expires`: expires_at 인덱스
- `group_invites_created_by_fkey`: created_by 인덱스

**비즈니스 규칙**:
- 초대 코드는 24시간 후 자동 만료
- 초대 코드는 10자리 영문+숫자 조합
- 그룹 삭제 시 연관된 초대 코드도 자동 삭제 (CASCADE)

#### 3.2.4 categories (카테고리)

**목적**: 거래 분류 카테고리 관리

**필드**:
- `id` (BigInt, PK): 카테고리 ID
- `group_id` (BigInt, Optional, FK → groups.id): 그룹 ID (그룹 카테고리)
- `created_by` (BigInt, FK → users.id): 생성자 ID
- `name` (String, 120자): 카테고리 이름
- `type` (TransactionType): 거래 유형 (EXPENSE, INCOME, TRANSFER)
- `color` (String, Optional, 7자): 색상 코드 (예: #FF5733)
- `is_default` (Boolean): 기본 카테고리 여부
- `budget_amount` (BigInt, Optional): 예산 금액 (카테고리별 예산)
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_categories_group`: group_id 인덱스
- `idx_categories_creator`: created_by 인덱스
- `ux_category_name`: (group_id, name, type) 유니크 제약

**비즈니스 규칙**:
- 같은 그룹 내에서 동일한 이름과 타입의 카테고리는 중복 불가
- 카테고리 삭제 시 연결된 거래가 있으면 알림 반환 (삭제 불가)
- 예산 금액은 카테고리별로 직접 저장

#### 3.2.5 tags (태그)

**목적**: 거래 태그 시스템

**필드**:
- `id` (BigInt, PK): 태그 ID
- `group_id` (BigInt, Optional, FK → groups.id): 그룹 ID
- `created_by` (BigInt, FK → users.id): 생성자 ID
- `name` (String, 60자): 태그 이름
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_tags_group`: group_id 인덱스
- `tags_created_by_fkey`: created_by 인덱스
- `ux_tag`: (group_id, name) 유니크 제약

**비즈니스 규칙**:
- 같은 그룹 내에서 동일한 이름의 태그는 중복 불가
- 태그는 카테고리 외 추가적인 거래 분류로 사용

#### 3.2.6 transactions (거래)

**목적**: 거래 내역 중심 테이블 (가계부의 핵심 데이터)

**필드**:
- `id` (BigInt, PK): 거래 ID
- `group_id` (BigInt, Optional, FK → groups.id): 그룹 ID (그룹 거래)
- `owner_user_id` (BigInt, FK → users.id): 거래 소유자 ID
- `type` (TransactionType): 거래 유형 (EXPENSE, INCOME, TRANSFER)
- `date` (Date): 거래 일자
- `amount` (BigInt): 거래 금액 (기준 통화 단위) - v2.0 변경
- `currency_code` (String, Optional, 3자): 통화 코드 (예: "KRW", "USD") - v2.0 추가
- `original_amount` (BigInt, Optional): 원래 통화 금액 (currency_code와 함께 사용) - v2.0 추가
- `category_id` (BigInt, Optional, FK → categories.id): 카테고리 ID
- `tag_id` (BigInt, Optional, FK → tags.id): 태그 ID
- `recurring_rule_id` (BigInt, Optional, FK → recurring_rules.id): 반복 규칙 ID
- `receipt_id` (BigInt, Optional, FK → receipts.id): OCR 영수증 ID - v2.0 추가
- `merchant` (String, Optional, 160자): 가맹점/상점명
- `memo` (String, Optional, 1000자): 메모
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_tx_group_date`: (group_id, date) 복합 인덱스
- `idx_tx_owner_date`: (owner_user_id, date) 복합 인덱스
- `idx_tx_category`: category_id 인덱스
- `idx_tx_tag`: tag_id 인덱스

**비즈니스 규칙**:
- 거래 금액은 양수만 허용 (amount > 0)
- 그룹 멤버는 그룹 거래를 수정/삭제 가능
- 반복 거래로 생성된 거래는 `recurring_rule_id`로 구분
- 이체 거래(TRANSFER)는 잔액 계산에 포함

#### 3.2.7 attachments (첨부파일)

**목적**: 거래 첨부파일 관리 (영수증, 사진 등)

**필드**:
- `id` (BigInt, PK): 첨부파일 ID
- `transaction_id` (BigInt, FK → transactions.id): 거래 ID
- `file_url` (String, 500자): 파일 URL
- `mime` (String, Optional, 100자): MIME 타입
- `size` (Int, Optional): 파일 크기 (바이트)

**인덱스**:
- `attachments_transaction_id_fkey`: transaction_id 인덱스

**비즈니스 규칙**:
- 거래 삭제 시 연관된 첨부파일도 자동 삭제 (CASCADE)

#### 3.2.8 budgets (예산)

**목적**: 월별 예산 관리 (단순화)

**필드**:
- `id` (BigInt, PK): 예산 ID
- `owner_type` (OwnerType): 소유자 유형 (USER, GROUP)
- `owner_id` (BigInt): 소유자 ID (사용자 또는 그룹)
- `period` (String, 7자): 기간 (YYYY-MM 형식)
- `total_amount` (BigInt): 총 예산 금액
- `status` (BudgetStatus): 예산 상태 (ACTIVE, CLOSED, DRAFT)
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_budgets_owner`: (owner_type, owner_id) 복합 인덱스
- `ux_budget_owner_period`: (owner_type, owner_id, period) 유니크 제약

**비즈니스 규칙**:
- 같은 소유자와 기간의 예산은 중복 불가
- 세부 예산은 Category 테이블의 `budget_amount`에서 관리

#### 3.2.9 recurring_rules (반복 거래 규칙)

**목적**: 반복 거래 규칙 정의 (월세, 구독료 등)

**필드**:
- `id` (BigInt, PK): 반복 규칙 ID
- `group_id` (BigInt, Optional, FK → groups.id): 그룹 ID
- `created_by` (BigInt, FK → users.id): 생성자 ID
- `start_date` (Date): 시작 일자
- `frequency` (RecurringFrequency): 반복 주기 (MONTHLY, WEEKLY, DAILY)
- `day_rule` (String, 20자): 날짜 규칙 (예: "1" = 매월 1일)
- `amount` (BigInt): 거래 금액
- `category_id` (BigInt, Optional, FK → categories.id): 카테고리 ID
- `merchant` (String, Optional, 160자): 가맹점명
- `memo` (String, Optional, 1000자): 메모
- `is_active` (Boolean): 활성화 여부
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_recurring_rules_group_active`: (group_id, is_active) 복합 인덱스
- `idx_recurring_rules_creator_active`: (created_by, is_active) 복합 인덱스
- `idx_recurring_rules_frequency_active`: (frequency, is_active) 복합 인덱스
- `recurring_rules_category_id_fkey`: category_id 인덱스

**비즈니스 규칙**:
- 반복 규칙은 활성화된 경우에만 자동 거래 생성
- 반복 주기는 MONTHLY, WEEKLY, DAILY 중 선택
- day_rule은 반복 주기에 따라 해석 (MONTHLY: 일자, WEEKLY: 요일)

#### 3.2.10 exchange_rates (환율) - v2.0 신규

**목적**: 환율 정보 관리 (다중 통화 지원)

**필드**:
- `id` (BigInt, PK): 환율 ID
- `from_currency` (String, 3자): 기준 통화 코드 (예: "USD")
- `to_currency` (String, 3자): 대상 통화 코드 (예: "KRW")
- `rate` (Decimal): 환율 (1 기준 통화 = rate 대상 통화)
- `date` (Date): 환율 적용 일자
- `source` (String, Optional, 100자): 환율 출처 (예: "Korea Bank", "OpenExchangeRates")
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_exchange_rates_currencies`: (from_currency, to_currency, date) 복합 인덱스
- `idx_exchange_rates_date`: date 인덱스

**비즈니스 규칙**:
- 같은 날짜, 같은 통화 쌍의 환율은 중복 불가
- 환율은 일일 자동 업데이트 (외부 API 연동)
- 과거 환율은 보관 (역사적 데이터 분석용)

#### 3.2.11 currency_preferences (통화 설정) - v2.0 신규

**목적**: 사용자별 기본 통화 설정

**필드**:
- `id` (BigInt, PK): 설정 ID
- `user_id` (BigInt, FK → users.id): 사용자 ID
- `group_id` (BigInt, Optional, FK → groups.id): 그룹 ID (그룹별 통화 설정)
- `base_currency` (String, 3자): 기준 통화 코드 (예: "KRW")
- `display_currency` (String, Optional, 3자): 표시 통화 코드 (기본값: base_currency)
- `auto_convert` (Boolean): 자동 환율 변환 여부
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_currency_prefs_user`: user_id 인덱스
- `idx_currency_prefs_group`: group_id 인덱스
- `ux_currency_prefs_user`: (user_id) 유니크 제약
- `ux_currency_prefs_group`: (group_id) 유니크 제약

**비즈니스 규칙**:
- 사용자당 하나의 기본 통화 설정만 가능
- 그룹별 통화 설정도 가능 (그룹 거래용)
- auto_convert가 true이면 모든 거래를 기준 통화로 자동 변환

#### 3.2.12 receipts (영수증) - v2.0 신규

**목적**: OCR 영수증 데이터 관리

**필드**:
- `id` (BigInt, PK): 영수증 ID
- `transaction_id` (BigInt, Optional, FK → transactions.id): 연결된 거래 ID
- `user_id` (BigInt, FK → users.id): 업로드한 사용자 ID
- `group_id` (BigInt, Optional, FK → groups.id): 그룹 ID
- `image_url` (String, 500자): 영수증 이미지 URL
- `ocr_result` (JSON, Optional): OCR 결과 (텍스트, 금액, 날짜, 가맹점 등)
- `ocr_status` (String)`: OCR 처리 상태 (PENDING, PROCESSING, COMPLETED, FAILED)
- `extracted_amount` (BigInt, Optional): OCR에서 추출한 금액
- `extracted_date` (Date, Optional): OCR에서 추출한 날짜
- `extracted_merchant` (String, Optional, 160자): OCR에서 추출한 가맹점명
- `extracted_items` (JSON, Optional): OCR에서 추출한 상품 목록
- `confidence_score` (Decimal, Optional): OCR 신뢰도 점수 (0.0 ~ 1.0)
- `verified` (Boolean): 사용자 검증 여부
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_receipts_user`: user_id 인덱스
- `idx_receipts_group`: group_id 인덱스
- `idx_receipts_transaction`: transaction_id 인덱스
- `idx_receipts_status`: ocr_status 인덱스

**비즈니스 규칙**:
- OCR 처리 완료 후 사용자가 검증 및 수정 가능
- 검증 완료 후 거래 자동 생성 또는 기존 거래에 연결
- OCR 실패 시 수동 입력 가능

#### 3.2.13 auto_category_rules (자동 카테고리 규칙) - v2.0 신규

**목적**: AI 기반 자동 카테고리 분류 규칙 관리

**필드**:
- `id` (BigInt, PK): 규칙 ID
- `user_id` (BigInt, Optional, FK → users.id): 사용자 ID (개인 규칙)
- `group_id` (BigInt, Optional, FK → groups.id): 그룹 ID (그룹 규칙)
- `pattern_type` (String, 20자): 패턴 유형 (KEYWORD, MERCHANT, AMOUNT_RANGE, REGEX)
- `pattern_value` (String, 200자): 패턴 값 (키워드, 가맹점명, 금액 범위, 정규식 등)
- `category_id` (BigInt, FK → categories.id): 매칭 시 적용할 카테고리 ID
- `priority` (Int): 우선순위 (높을수록 우선 적용)
- `match_count` (Int): 매칭 횟수 (학습 데이터)
- `success_count` (Int): 성공 횟수 (사용자 승인)
- `is_active` (Boolean): 활성화 여부
- `created_at` (DateTime): 생성 일시
- `updated_at` (DateTime): 수정 일시

**인덱스**:
- `idx_auto_category_user`: user_id 인덱스
- `idx_auto_category_group`: group_id 인덱스
- `idx_auto_category_category`: category_id 인덱스
- `idx_auto_category_active`: (is_active, priority) 복합 인덱스

**비즈니스 규칙**:
- 여러 규칙이 매칭되면 우선순위가 높은 규칙 적용
- 사용자 피드백을 통해 규칙 자동 학습 및 개선
- match_count와 success_count로 규칙 신뢰도 계산

### 3.3 Enum 타입 정의

#### TransactionType
- `EXPENSE`: 지출
- `INCOME`: 수입
- `TRANSFER`: 이체

#### OwnerType
- `USER`: 사용자 소유
- `GROUP`: 그룹 소유

#### BudgetStatus
- `ACTIVE`: 활성화
- `CLOSED`: 종료
- `DRAFT`: 초안

#### RecurringFrequency
- `MONTHLY`: 매월
- `WEEKLY`: 매주
- `DAILY`: 매일

#### OCRStatus
- `PENDING`: 대기 중
- `PROCESSING`: 처리 중
- `COMPLETED`: 완료
- `FAILED`: 실패

#### PatternType
- `KEYWORD`: 키워드 매칭
- `MERCHANT`: 가맹점명 매칭
- `AMOUNT_RANGE`: 금액 범위 매칭
- `REGEX`: 정규식 매칭

### 3.4 데이터베이스 관계도

```
users (1) ──< (N) transactions
users (1) ──< (N) categories
users (1) ──< (N) tags
users (1) ──< (N) recurring_rules
users (N) ──> (1) groups (그룹 멤버십)
users (1) ──< (N) groups (그룹 소유자)

groups (1) ──< (N) transactions
groups (1) ──< (N) categories
groups (1) ──< (N) tags
groups (1) ──< (N) group_invites
groups (1) ──< (N) recurring_rules

transactions (1) ──< (N) attachments
transactions (N) ──> (1) categories
transactions (N) ──> (1) tags
transactions (N) ──> (1) recurring_rules
transactions (N) ──> (1) receipts (OCR 영수증)

categories (1) ──< (N) transactions
categories (1) ──< (N) recurring_rules
categories (1) ──< (N) auto_category_rules

users (1) ──< (N) currency_preferences
users (1) ──< (N) receipts
groups (1) ──< (N) currency_preferences
groups (1) ──< (N) receipts

receipts (1) ──> (1) transactions (선택적 연결)
auto_category_rules (N) ──> (1) categories
```

---

## 4. 기능 요구사항

### 4.1 공통 기능

#### 4.1.1 인증 및 사용자 관리

**FR-AUTH-001: 회원가입**
- 이메일, 비밀번호, 닉네임 입력
- 초대 코드 입력 시 그룹 자동 가입
- 이메일 중복 체크
- 비밀번호 최소 8자 이상
- 회원가입 성공 시 자동 로그인

**FR-AUTH-002: 로그인**
- 이메일/비밀번호 기반 로그인
- JWT 토큰 발급 (access_token, refresh_token)
- 토큰 만료 시간: access_token (15분), refresh_token (7일)

**FR-AUTH-003: 토큰 갱신**
- refresh_token으로 access_token 갱신
- 토큰 만료 시 자동 갱신 시도
- 갱신 실패 시 자동 로그아웃

**FR-AUTH-004: 프로필 관리**
- 프로필 조회 (이메일, 닉네임, 아바타, 그룹 정보)
- 프로필 수정 (닉네임, 아바타)
- 비밀번호 변경
- 비밀번호 찾기/재설정 (이메일 발송)

**FR-AUTH-005: 로그아웃**
- 토큰 무효화
- 로컬 스토리지 정리

#### 4.1.2 그룹 관리

**FR-GROUP-001: 그룹 생성**
- 그룹 이름 입력
- 그룹 생성 시 생성자가 자동으로 그룹 소유자 및 멤버가 됨
- 그룹 생성 시 사용자의 `group_id`가 자동 설정됨

**FR-GROUP-002: 그룹 조회**
- 사용자가 속한 그룹 목록 조회
- 그룹 상세 정보 조회 (이름, 소유자, 멤버 수)

**FR-GROUP-003: 그룹 수정**
- 그룹 이름 수정 (소유자만 가능)

**FR-GROUP-004: 그룹 삭제**
- 그룹 삭제 (소유자만 가능)
- 멤버가 있으면 삭제 불가 (알림 반환)

**FR-GROUP-005: 초대 코드 생성**
- 그룹 소유자가 초대 코드 생성
- 10자리 영문+숫자 조합
- 24시간 유효 기간
- 초대 코드 복사 기능

**FR-GROUP-006: 그룹 참여**
- 초대 코드로 그룹 참여
- 회원가입 시 초대 코드 입력 시 자동 그룹 가입
- 기존 사용자도 초대 코드로 그룹 참여 가능

**FR-GROUP-007: 그룹 탈퇴**
- 그룹 멤버가 그룹 탈퇴
- 탈퇴 시 사용자의 `group_id`가 NULL로 설정됨

#### 4.1.3 거래 관리

**FR-TX-001: 거래 생성**
- 거래 유형 선택 (지출/수입/이체)
- 거래 일자 선택
- 거래 금액 입력 (양수만 허용)
- 카테고리 선택 (선택사항)
- 태그 선택 (선택사항)
- 가맹점명 입력 (선택사항)
- 메모 입력 (선택사항)
- 그룹 거래 선택 (그룹 멤버인 경우)

**FR-TX-002: 빠른 거래 추가 (Quick Add)**
- 최소한의 정보로 빠른 거래 입력
- 카테고리가 없으면 자동 생성
- 카테고리 이름만 입력하면 자동 생성 및 연결

**FR-TX-003: 거래 조회**
- 거래 목록 조회 (페이지네이션)
- 필터링: 그룹, 기간(start_date/end_date), 카테고리, 검색어
- 정렬: 날짜순, 금액순
- 무한 스크롤 지원 (오프셋 기반)

**FR-TX-004: 거래 상세 조회**
- 거래 상세 정보 조회
- 첨부파일 목록 조회

**FR-TX-005: 거래 수정**
- 거래 정보 수정
- 그룹 멤버도 그룹 거래 수정 가능
- 반복 거래로 생성된 거래는 `recurring_rule_id` 유지

**FR-TX-006: 거래 삭제**
- 거래 삭제
- 그룹 멤버도 그룹 거래 삭제 가능
- 첨부파일도 함께 삭제

**FR-TX-007: 거래 검색**
- 메모 및 가맹점명에서 검색
- 실시간 검색 지원

#### 4.1.4 카테고리 관리

**FR-CAT-001: 카테고리 조회**
- 카테고리 목록 조회
- 거래 유형별 필터링 (지출/수입/이체)
- 그룹 카테고리 및 개인 카테고리 구분

**FR-CAT-002: 카테고리 생성**
- 카테고리 이름 입력
- 거래 유형 선택
- 색상 선택 (선택사항)
- 예산 금액 설정 (선택사항)
- 그룹 카테고리 생성 (그룹 멤버인 경우)

**FR-CAT-003: 카테고리 수정**
- 카테고리 이름, 색상, 예산 금액 수정
- 그룹 카테고리는 그룹 멤버 모두 수정 가능

**FR-CAT-004: 카테고리 삭제**
- 카테고리 삭제
- 연결된 거래가 있으면 삭제 불가 (알림 반환)
- 연결된 거래 수 표시

#### 4.1.5 통계 및 분석

**FR-STAT-001: 종합 통계 조회**
- 요약 통계: 총 수입, 총 지출, 순이익, 거래 건수
- 카테고리별 통계 (수입/지출)
- 일별 트렌드 데이터
- 월별 비교 (최근 6개월)
- 기간 필터: start_date, end_date (기본값: 최근 1개월)

**FR-STAT-002: 대시보드 통계**
- 월별 수입/지출 총액
- 상위 5개 지출 카테고리
- 일별 트렌드
- 기간 필터: start_date, end_date (기본값: 최근 1개월)

**FR-STAT-003: 통계 시각화**
- 카테고리별 통계 (Pie Chart)
- 일별 추이 (Line Chart)
- 월별 비교 (Bar Chart)

#### 4.1.6 예산 관리

**FR-BUDGET-001: 예산 조회**
- 예산 목록 조회 (사용자/그룹별)
- 예산 상태 필터링 (ACTIVE, CLOSED, DRAFT)

**FR-BUDGET-002: 예산 생성/수정**
- 월별 예산 생성/수정
- 총 예산 금액 설정
- 예산 상태 설정 (ACTIVE, CLOSED, DRAFT)

**FR-BUDGET-003: 예산 현황 조회**
- 예산 대비 지출 현황
- 카테고리별 예산 대비 지출
- 예산 초과 여부 표시

**FR-BUDGET-004: 예산 삭제**
- 예산 삭제

#### 4.1.7 반복 거래 규칙

**FR-RECURRING-001: 반복 규칙 조회**
- 반복 규칙 목록 조회
- 활성화 상태 필터링
- 그룹별 필터링

**FR-RECURRING-002: 반복 규칙 생성**
- 반복 주기 선택 (MONTHLY, WEEKLY, DAILY)
- 시작 일자 설정
- 날짜 규칙 설정 (day_rule)
- 거래 금액 입력
- 카테고리 선택 (선택사항)
- 가맹점명, 메모 입력 (선택사항)

**FR-RECURRING-003: 반복 규칙 수정**
- 반복 규칙 정보 수정
- 활성화/비활성화 토글

**FR-RECURRING-004: 반복 규칙 삭제**
- 반복 규칙 삭제

**FR-RECURRING-005: 자동 거래 생성**
- 반복 규칙 일괄 처리 (자동 거래 생성)
- 특정 규칙에서 거래 생성
- 생성된 거래는 `recurring_rule_id`로 구분

#### 4.1.8 잔액 조회

**FR-BALANCE-001: 현재 잔액 조회**
- 현재 시점 기준 총 수입 - 총 지출
- 이체 거래 포함
- 그룹별 필터링

**FR-BALANCE-002: 예상 잔액 조회**
- 미래 N개월 예상 잔액 계산
- 반복 거래 규칙 기반 예상
- projection_months 파라미터 (기본값: 3개월)

**FR-BALANCE-003: 월별 추이**
- 지정 기간 동안의 월별 잔액 변화
- 그래프 시각화

#### 4.1.9 설정 관리

**FR-SETTINGS-001: 설정 조회**
- 사용자 설정 조회 (JSON 형식)
- 알림 설정, 테마 설정 등

**FR-SETTINGS-002: 설정 수정**
- 사용자 설정 저장
- 알림 on/off 설정

**FR-SETTINGS-003: 설정 초기화**
- 설정을 기본값으로 리셋

#### 4.1.10 다중 통화 지원 - v2.0 신규

**FR-CURRENCY-001: 통화 선택**
- 거래별 통화 선택 (KRW, USD, EUR, JPY 등)
- 사용자 기본 통화 설정
- 그룹별 기본 통화 설정

**FR-CURRENCY-002: 환율 관리**
- 환율 자동 업데이트 (일일)
- 환율 수동 업데이트
- 환율 히스토리 조회

**FR-CURRENCY-003: 통화 변환**
- 거래 입력 시 통화 선택
- 기준 통화로 자동 변환 (선택적)
- 통화별 잔액 조회

**FR-CURRENCY-004: 통화 설정**
- 사용자 기본 통화 설정
- 그룹 기본 통화 설정
- 자동 환율 변환 on/off

#### 4.1.11 OCR 영수증 인식 - v2.0 신규

**FR-OCR-001: 영수증 업로드**
- 영수증 이미지 업로드 (카메라 또는 갤러리)
- 이미지 형식 검증 (JPEG, PNG)
- 파일 크기 제한 (최대 10MB)

**FR-OCR-002: OCR 처리**
- 영수증 이미지 OCR 처리
- 금액, 날짜, 가맹점명 자동 추출
- OCR 결과 신뢰도 표시

**FR-OCR-003: 거래 자동 생성**
- OCR 결과 기반 거래 자동 생성
- 사용자 검증 및 수정
- 거래 연결 또는 새 거래 생성

**FR-OCR-004: 영수증 관리**
- 영수증 목록 조회
- 영수증 상세 보기
- 영수증 삭제

#### 4.1.12 자동 카테고리 분류 - v2.0 신규

**FR-AUTO-001: 자동 분류 규칙**
- 키워드 기반 카테고리 매칭
- 가맹점명 기반 카테고리 매칭
- 금액 범위 기반 카테고리 매칭
- 정규식 기반 카테고리 매칭

**FR-AUTO-002: AI 기반 추천**
- 거래 입력 시 카테고리 자동 추천
- 과거 거래 패턴 기반 학습
- 사용자 피드백 반영

**FR-AUTO-003: 규칙 관리**
- 자동 분류 규칙 생성/수정/삭제
- 규칙 우선순위 설정
- 규칙 활성화/비활성화

**FR-AUTO-004: 학습 개선**
- 규칙 매칭 횟수 추적
- 사용자 승인/거부 피드백 수집
- 규칙 신뢰도 자동 계산

#### 4.1.13 실시간 동기화 - v2.0 신규

**FR-REALTIME-001: WebSocket 연결**
- WebSocket 연결 관리
- 자동 재연결
- 연결 상태 표시

**FR-REALTIME-002: 실시간 업데이트**
- 거래 생성/수정/삭제 실시간 동기화
- 그룹 멤버 활동 실시간 표시
- 통계 데이터 실시간 업데이트

**FR-REALTIME-003: 그룹 멤버 상태**
- 그룹 멤버 온라인/오프라인 상태 표시
- 현재 접속 중인 멤버 표시
- 마지막 활동 시간 표시

**FR-REALTIME-004: 충돌 해결**
- 동시 편집 충돌 감지
- 최신 변경 우선 적용
- 충돌 알림 및 수동 해결 옵션

**FR-REALTIME-005: Server-Sent Events**
- SSE를 통한 서버 → 클라이언트 이벤트 스트리밍
- 알림 이벤트 실시간 전달
- 백그라운드 업데이트

### 4.2 Android 앱 기능 (household-ledger-mobile)

#### 4.3.1 화면 구성

**FR-ANDROID-001: 로그인 화면**
- 이메일/비밀번호 입력
- 로그인 버튼
- 회원가입 링크
- 비밀번호 찾기 링크

**FR-ANDROID-002: 회원가입 화면**
- 이메일, 비밀번호, 닉네임 입력
- 초대 코드 입력 (선택사항)
- 폼 검증
- 회원가입 성공 시 자동 로그인

**FR-ANDROID-003: 대시보드 화면**
- 요약 카드 (수입, 지출, 순이익)
- 최근 거래 목록
- 프로필/거래 상세 이동
- 하단 네비게이션 바

**FR-ANDROID-004: 거래 내역 화면**
- 거래 목록 (검색, 필터, 정렬)
- 무한 스크롤
- 거래 상세 화면
- 빠른 입력 모달 (Quick Add)

**FR-ANDROID-005: 통계 화면**
- 월별 통계 조회
- 카테고리별 통계 (Pie Chart)
- 일별 추이 (Line Chart)
- 기간 선택

**FR-ANDROID-006: 프로필 화면**
- 프로필 정보 표시
- 설정 메뉴
- 로그아웃
- 앱 정보

**FR-ANDROID-007: 카테고리 관리 화면**
- 카테고리 목록 (지출/수입/이체 분류)
- 카테고리 생성/수정/삭제
- 색상 선택 (flutter_colorpicker)
- 예산 금액 설정

**FR-ANDROID-008: 그룹 관리 화면**
- 그룹 목록 조회
- 그룹 생성/수정/삭제
- 초대 코드 생성 및 복사
- 그룹 참가/나가기

**FR-ANDROID-009: 예산 관리 화면**
- 예산 목록 조회
- 예산 생성/수정/삭제 (월별)
- 예산 현황 조회 (예산 대비 지출)

**FR-ANDROID-010: 반복 규칙 관리 화면**
- 반복 규칙 목록 조회
- 반복 규칙 생성/수정/삭제
- 날짜 범위 처리
- 거래 생성

**FR-ANDROID-011: 잔액 조회 화면**
- 현재 잔액 조회
- 예상 잔액 조회 (미래 N개월)
- 월별 추이 그래프

**FR-ANDROID-012: OCR 영수증 화면** - v2.0 신규
- 영수증 촬영/업로드
- OCR 결과 확인 및 수정
- 거래 자동 생성 또는 연결

**FR-ANDROID-013: 다중 통화 화면** - v2.0 신규
- 통화 선택 (거래 입력 시)
- 환율 조회
- 통화별 잔액 조회
- 기본 통화 설정

**FR-ANDROID-014: 자동 카테고리 설정 화면** - v2.0 신규
- 자동 분류 규칙 목록
- 규칙 생성/수정/삭제
- 규칙 우선순위 설정
- 규칙 통계 (매칭 횟수, 성공률)

**FR-ANDROID-015: 실시간 동기화 상태** - v2.0 신규
- WebSocket 연결 상태 표시
- 그룹 멤버 온라인 상태 표시
- 실시간 업데이트 알림

#### 4.2.2 UI/UX 요구사항

**FR-ANDROID-UI-001: Material Design 3**
- 동적 컬러 (Material You)
- M3 타이포그래피
- 둥근 모서리
- Surface Tinting

**FR-ANDROID-UI-002: 상태 관리**
- BLoC 패턴 사용
- Auth, Transaction, Category, Statistics, Group, Settings, Budget, RecurringRule, Balance BLoC

**FR-ANDROID-UI-003: 네트워크**
- Dio HTTP 클라이언트
- 자동 인증 토큰 첨부 (AuthInterceptor)
- 401 에러 시 자동 토큰 갱신
- 토큰 갱신 실패 시 자동 로그아웃

**FR-ANDROID-UI-004: 로컬 스토리지**
- SharedPreferences 사용
- 토큰 저장
- 사용자 설정 저장

**FR-ANDROID-UI-005: 실시간 통신** - v2.0 신규
- WebSocket 클라이언트 구현
- SSE 클라이언트 구현
- 자동 재연결 로직
- 백그라운드 동기화

**FR-ANDROID-UI-006: 오프라인 지원** - v2.0 향후
- 오프라인 거래 입력
- 오프라인 데이터 캐싱
- 온라인 복귀 시 자동 동기화

### 4.3 백엔드 API 기능 (household-ledger-api)

#### 4.4.1 API 아키텍처

**FR-API-001: RESTful API 설계**
- RESTful 원칙 준수
- HTTP 메서드 적절히 사용 (GET, POST, PUT, DELETE)
- 리소스 기반 URL 구조

**FR-API-002: 인증/인가**
- JWT 토큰 기반 인증
- 모든 API 엔드포인트 인증 필수 (공개 API 제외)
- 그룹 멤버 권한 검증

**FR-API-003: 데이터 검증**
- Pydantic 스키마로 요청/응답 검증
- 입력값 유효성 검사
- 에러 메시지 한국어 제공

**FR-API-004: 에러 처리**
- 일관된 에러 응답 형식
- HTTP 상태 코드 적절히 사용
- 에러 메시지 상세 정보 제공

**FR-API-005: 페이지네이션**
- 오프셋 기반 페이지네이션
- limit, offset 파라미터
- 총 개수 반환

**FR-API-006: 필터링 및 검색**
- start_date, end_date 기간 필터
- group_id, category_id 필터
- 검색어 필터 (메모, 가맹점명)

**FR-API-007: 실시간 통신** - v2.0 신규
- WebSocket 엔드포인트 (`/api/v2/ws`)
- Server-Sent Events 엔드포인트 (`/api/v2/events`)
- 이벤트 타입 정의 (transaction_created, transaction_updated, member_online 등)
- 연결 관리 및 인증

**FR-API-008: 다중 통화 API** - v2.0 신규
- 환율 조회 및 업데이트
- 통화 변환 계산
- 통화별 통계 조회

**FR-API-009: OCR API** - v2.0 신규
- 영수증 이미지 업로드
- OCR 처리 요청
- OCR 결과 조회 및 수정
- 거래 자동 생성

**FR-API-010: 자동 카테고리 API** - v2.0 신규
- 카테고리 추천 요청
- 자동 분류 규칙 관리
- 규칙 학습 데이터 수집

---

## 5. API 명세서

**참고**: 
- `/api/v1/*`: 레거시 FastAPI 백엔드 API (참고용)
- `/api/v2/*`: 신규 Rust 백엔드 API (v2.0)

### 5.1 인증 API (`/api/v2/auth`) - Rust 백엔드

#### POST /signup
**설명**: 회원가입

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "사용자",
  "invite_code": "ABC123XYZ" // 선택사항
}
```

**Response** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "사용자",
    "group_id": 1
  }
}
```

**에러 응답**:
- 400: 이메일 중복 또는 유효성 검사 실패
- 404: 초대 코드가 유효하지 않음

#### POST /login
**설명**: 로그인

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**에러 응답**:
- 401: 이메일 또는 비밀번호가 잘못됨

#### POST /refresh
**설명**: 토큰 갱신

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### GET /me
**설명**: 현재 사용자 정보 조회

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "사용자",
  "avatar_url": "https://example.com/avatar.jpg",
  "group_id": 1
}
```

#### PUT /me
**설명**: 프로필 수정

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "nickname": "새 닉네임",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "새 닉네임",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "group_id": 1
}
```

#### POST /change-password
**설명**: 비밀번호 변경

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

**Response** (200 OK):
```json
{
  "message": "비밀번호가 변경되었습니다"
}
```

#### POST /forgot-password
**설명**: 비밀번호 찾기

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "비밀번호 재설정 링크가 이메일로 전송되었습니다"
}
```

**참고**: 개발 환경에서는 토큰을 직접 반환

#### POST /reset-password
**설명**: 비밀번호 재설정

**Request Body**:
```json
{
  "token": "reset-token",
  "new_password": "newpassword123"
}
```

**Response** (200 OK):
```json
{
  "message": "비밀번호가 재설정되었습니다"
}
```

#### GET /check-email
**설명**: 이메일 중복 체크

**Query Parameters**:
- `email`: 이메일 주소

**Response** (200 OK):
```json
{
  "available": true
}
```

### 5.2 그룹 API (`/api/v2/groups`) - Rust 백엔드

#### GET /
**설명**: 그룹 목록 조회

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "우리 가족",
    "owner_id": 1
  }
]
```

#### POST /
**설명**: 그룹 생성

**Headers**:
```
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "name": "우리 가족"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "name": "우리 가족",
  "owner_id": 1
}
```

#### GET /{group_id}
**설명**: 그룹 조회

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "우리 가족",
  "owner_id": 1
}
```

#### PUT /{group_id}
**설명**: 그룹 수정 (소유자만 가능)

**Request Body**:
```json
{
  "name": "새 그룹 이름"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "새 그룹 이름",
  "owner_id": 1
}
```

#### DELETE /{group_id}
**설명**: 그룹 삭제 (소유자만 가능, 멤버가 있으면 삭제 불가)

**Response** (200 OK):
```json
{
  "message": "그룹이 삭제되었습니다"
}
```

**에러 응답**:
- 400: 멤버가 있어서 삭제할 수 없음

#### POST /{group_id}/invite
**설명**: 초대 코드 생성 (24시간 유효)

**Response** (201 Created):
```json
{
  "code": "ABC123XYZ",
  "expires_at": "2025-01-26T12:00:00Z"
}
```

#### POST /join
**설명**: 그룹 참여 (초대 코드로)

**Request Body**:
```json
{
  "code": "ABC123XYZ"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "우리 가족",
  "owner_id": 1
}
```

#### POST /leave
**설명**: 그룹 탈퇴

**Response** (200 OK):
```json
{
  "message": "그룹에서 탈퇴했습니다"
}
```

### 5.3 거래 API (`/api/v2/transactions`) - Rust 백엔드

#### GET /
**설명**: 거래 목록 조회 (필터링, 페이징)

**Query Parameters**:
- `group_id` (Optional): 그룹 ID 필터
- `start_date` (Optional): 시작 일자 (YYYY-MM-DD)
- `end_date` (Optional): 종료 일자 (YYYY-MM-DD)
- `category_id` (Optional): 카테고리 ID 필터
- `search` (Optional): 검색어 (메모, 가맹점명)
- `limit` (Default: 50): 페이지 크기 (1-100)
- `offset` (Default: 0): 오프셋

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": 1,
      "group_id": 1,
      "owner_user_id": 1,
      "type": "EXPENSE",
      "date": "2025-01-25",
      "amount": 50000,
      "currency_code": "KRW",
      "original_amount": null,
      "category_id": 1,
      "tag_id": null,
      "recurring_rule_id": null,
      "receipt_id": null,
      "merchant": "편의점",
      "memo": "점심 식사",
      "created_at": "2025-01-25T12:00:00Z",
      "updated_at": "2025-01-25T12:00:00Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

#### POST /
**설명**: 거래 생성

**Request Body**:
```json
{
  "group_id": 1,
  "type": "EXPENSE",
  "date": "2025-01-25",
  "amount": 50000,
  "currency_code": "KRW",
  "original_amount": null,
  "category_id": 1,
  "tag_id": null,
  "merchant": "편의점",
  "memo": "점심 식사"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "group_id": 1,
  "owner_user_id": 1,
  "type": "EXPENSE",
  "date": "2025-01-25",
  "amount": 50000,
  "currency_code": "KRW",
  "original_amount": null,
  "category_id": 1,
  "tag_id": null,
  "recurring_rule_id": null,
  "receipt_id": null,
  "merchant": "편의점",
  "memo": "점심 식사",
  "created_at": "2025-01-25T12:00:00Z",
  "updated_at": "2025-01-25T12:00:00Z"
}
```

#### POST /quick-add
**설명**: 빠른 거래 추가 (카테고리 자동 생성)

**Request Body**:
```json
{
  "type": "EXPENSE",
  "date": "2025-01-25",
  "amount": 50000,
  "currency_code": "KRW",
  "category_name": "식비",
  "merchant": "편의점",
  "memo": "점심 식사"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "category_id": 1,
  "category_created": true,
  // ... 거래 정보
}
```

#### GET /{transaction_id}
**설명**: 거래 조회

**Response** (200 OK):
```json
{
  "id": 1,
  "group_id": 1,
  "owner_user_id": 1,
  "type": "EXPENSE",
  "date": "2025-01-25",
  "amount": 50000,
  "currency_code": "KRW",
  "original_amount": null,
  "category_id": 1,
  "tag_id": null,
  "recurring_rule_id": null,
  "receipt_id": null,
  "merchant": "편의점",
  "memo": "점심 식사",
  "created_at": "2025-01-25T12:00:00Z",
  "updated_at": "2025-01-25T12:00:00Z"
}
```

#### PUT /{transaction_id}
**설명**: 거래 수정 (그룹 멤버도 수정 가능)

**Request Body**:
```json
{
  "amount": 60000,
  "memo": "저녁 식사"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  // ... 수정된 거래 정보
}
```

#### DELETE /{transaction_id}
**설명**: 거래 삭제 (그룹 멤버도 삭제 가능)

**Response** (200 OK):
```json
{
  "message": "거래가 삭제되었습니다"
}
```

### 5.4 카테고리 API (`/api/v2/categories`) - Rust 백엔드

#### GET /
**설명**: 카테고리 목록 조회

**Query Parameters**:
- `type`: 거래 유형 (EXPENSE, INCOME, TRANSFER)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "group_id": 1,
    "created_by": 1,
    "name": "식비",
    "type": "EXPENSE",
    "color": "#FF5733",
    "is_default": false,
    "budget_amount": 500000,
    "created_at": "2025-01-25T12:00:00Z",
    "updated_at": "2025-01-25T12:00:00Z"
  }
]
```

#### POST /
**설명**: 카테고리 생성

**Request Body**:
```json
{
  "name": "식비",
  "type": "EXPENSE",
  "color": "#FF5733",
  "budget_amount": 500000
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "name": "식비",
  "type": "EXPENSE",
  "color": "#FF5733",
  "budget_amount": 500000
}
```

#### PUT /{category_id}
**설명**: 카테고리 수정

**Request Body**:
```json
{
  "name": "외식비",
  "color": "#33FF57",
  "budget_amount": 600000
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "외식비",
  "color": "#33FF57",
  "budget_amount": 600000
}
```

#### DELETE /{category_id}
**설명**: 카테고리 삭제 (연결된 거래가 있으면 삭제 불가)

**Response** (200 OK):
```json
{
  "message": "카테고리가 삭제되었습니다"
}
```

**에러 응답**:
- 400: 연결된 거래가 있어서 삭제할 수 없음 (거래 수 포함)

### 5.5 통계 API (`/api/v2/statistics`) - Rust 백엔드

#### GET /
**설명**: 종합 통계 조회

**Query Parameters**:
- `start_date` (Optional): 시작 일자 (기본값: 1개월 전)
- `end_date` (Optional): 종료 일자 (기본값: 오늘)
- `group_id` (Optional): 그룹 ID 필터

**Response** (200 OK):
```json
{
  "summary": {
    "total_income": 5000000,
    "total_expense": 3000000,
    "net_profit": 2000000,
    "transaction_count": 50
  },
  "category_stats": {
    "income": [
      {
        "category_id": 1,
        "category_name": "급여",
        "amount": 5000000,
        "percentage": 100.0
      }
    ],
    "expense": [
      {
        "category_id": 2,
        "category_name": "식비",
        "amount": 1500000,
        "percentage": 50.0
      }
    ]
  },
  "daily_trends": [
    {
      "date": "2025-01-25",
      "income": 0,
      "expense": 50000
    }
  ],
  "monthly_comparison": [
    {
      "month": "2024-12",
      "income": 5000000,
      "expense": 2800000
    }
  ]
}
```

### 5.6 대시보드 API (`/api/v2/dashboard`) - Rust 백엔드

#### GET /monthly-stats
**설명**: 월별 대시보드 통계

**Query Parameters**:
- `start_date` (Optional): 시작 일자 (기본값: 1개월 전)
- `end_date` (Optional): 종료 일자 (기본값: 오늘)

**Response** (200 OK):
```json
{
  "monthly_total": {
    "income": 5000000,
    "expense": 3000000,
    "net": 2000000
  },
  "top_categories": [
    {
      "category_id": 2,
      "category_name": "식비",
      "amount": 1500000,
      "percentage": 50.0
    }
  ],
  "daily_trends": [
    {
      "date": "2025-01-25",
      "income": 0,
      "expense": 50000
    }
  ]
}
```

### 5.7 반복 거래 API (`/api/v2/recurring-rules`) - Rust 백엔드

#### GET /
**설명**: 반복 거래 규칙 목록 조회

**Query Parameters**:
- `is_active` (Optional): 활성화 상태 필터
- `group_id` (Optional): 그룹 ID 필터

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "group_id": 1,
    "created_by": 1,
    "start_date": "2025-01-01",
    "frequency": "MONTHLY",
    "day_rule": "1",
    "amount": 500000,
    "category_id": 3,
    "merchant": "월세",
    "memo": "아파트 월세",
    "is_active": true,
    "created_at": "2025-01-01T12:00:00Z",
    "updated_at": "2025-01-01T12:00:00Z"
  }
]
```

#### POST /
**설명**: 반복 거래 규칙 생성

**Request Body**:
```json
{
  "group_id": 1,
  "start_date": "2025-01-01",
  "frequency": "MONTHLY",
  "day_rule": "1",
  "amount": 500000,
  "category_id": 3,
  "merchant": "월세",
  "memo": "아파트 월세"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "frequency": "MONTHLY",
  "day_rule": "1",
  "amount": 500000
}
```

#### GET /{rule_id}
**설명**: 반복 거래 규칙 조회

#### PUT /{rule_id}
**설명**: 반복 거래 규칙 수정

#### DELETE /{rule_id}
**설명**: 반복 거래 규칙 삭제

#### POST /process
**설명**: 반복 거래 규칙 일괄 처리 (자동 거래 생성)

**Request Body**:
```json
{
  "target_date": "2025-02-01"
}
```

**Response** (200 OK):
```json
{
  "processed_count": 5,
  "transactions_created": [
    {
      "id": 10,
      "recurring_rule_id": 1
    }
  ]
}
```

#### POST /{rule_id}/generate
**설명**: 특정 규칙에서 거래 생성

**Request Body**:
```json
{
  "target_date": "2025-02-01"
}
```

**Response** (201 Created):
```json
{
  "id": 10,
  "recurring_rule_id": 1,
  "date": "2025-02-01",
  "amount": 500000
}
```

### 5.8 예산 API (`/api/v2/budgets`) - Rust 백엔드

#### GET /
**설명**: 예산 목록 조회

**Query Parameters**:
- `owner_type`: 소유자 유형 (USER, GROUP)
- `status` (Optional): 예산 상태 필터 (ACTIVE, CLOSED, DRAFT)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "owner_type": "GROUP",
    "owner_id": 1,
    "period": "2025-01",
    "total_amount": 3000000,
    "status": "ACTIVE",
    "created_at": "2025-01-01T12:00:00Z",
    "updated_at": "2025-01-01T12:00:00Z"
  }
]
```

#### POST /
**설명**: 예산 생성/수정 (월별)

**Request Body**:
```json
{
  "owner_type": "GROUP",
  "owner_id": 1,
  "period": "2025-01",
  "total_amount": 3000000,
  "status": "ACTIVE"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "period": "2025-01",
  "total_amount": 3000000,
  "status": "ACTIVE"
}
```

#### GET /status
**설명**: 예산 현황 조회 (예산 대비 지출)

**Query Parameters**:
- `owner_type`: 소유자 유형
- `owner_id`: 소유자 ID
- `period`: 기간 (YYYY-MM)

**Response** (200 OK):
```json
{
  "budget": {
    "id": 1,
    "total_amount": 3000000,
    "period": "2025-01"
  },
  "spent": 2500000,
  "remaining": 500000,
  "percentage": 83.33,
  "category_breakdown": [
    {
      "category_id": 2,
      "category_name": "식비",
      "budget_amount": 500000,
      "spent": 450000,
      "remaining": 50000,
      "percentage": 90.0
    }
  ]
}
```

#### GET /{budget_id}
**설명**: 예산 조회

#### PUT /{budget_id}
**설명**: 예산 수정

#### DELETE /{budget_id}
**설명**: 예산 삭제

### 5.9 잔액 API (`/api/v2/balance`) - Rust 백엔드

#### GET /
**설명**: 잔액 조회

**Query Parameters**:
- `group_id` (Optional): 그룹 ID 필터
- `include_projection` (Default: false): 예상 잔액 포함 여부
- `projection_months` (Default: 3): 예상 기간 (1-12개월)
- `period` (Optional): 기간 (YYYY-MM 형식)

**Response** (200 OK):
```json
{
  "current_balance": 2000000,
  "projection": {
    "months": [
      {
        "month": "2025-02",
        "projected_balance": 1500000
      },
      {
        "month": "2025-03",
        "projected_balance": 1000000
      }
    ]
  },
  "monthly_trends": [
    {
      "month": "2025-01",
      "balance": 2000000
    }
  ]
}
```

### 5.10 설정 API (`/api/v2/settings`) - Rust 백엔드

#### GET /
**설명**: 설정 조회

**Response** (200 OK):
```json
{
  "notifications": true,
  "theme": "light",
  "language": "ko"
}
```

#### PUT /
**설명**: 설정 수정

**Request Body**:
```json
{
  "notifications": false,
  "theme": "dark"
}
```

**Response** (200 OK):
```json
{
  "notifications": false,
  "theme": "dark",
  "language": "ko"
}
```

#### DELETE /
**설명**: 설정 초기화

**Response** (200 OK):
```json
{
  "message": "설정이 초기화되었습니다"
}
```

### 5.11 다중 통화 API (`/api/v2/exchange-rates`) - v2.0 신규

#### GET /
**설명**: 환율 목록 조회

**Query Parameters**:
- `from_currency` (Optional): 기준 통화 코드
- `to_currency` (Optional): 대상 통화 코드
- `date` (Optional): 날짜 (YYYY-MM-DD, 기본값: 오늘)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "from_currency": "USD",
    "to_currency": "KRW",
    "rate": 1300.50,
    "date": "2025-01-25",
    "source": "Korea Bank",
    "created_at": "2025-01-25T00:00:00Z",
    "updated_at": "2025-01-25T00:00:00Z"
  }
]
```

#### POST /update
**설명**: 환율 업데이트 (외부 API 연동)

**Response** (200 OK):
```json
{
  "updated_count": 10,
  "message": "환율이 업데이트되었습니다"
}
```

#### GET /convert
**설명**: 통화 변환 계산

**Query Parameters**:
- `from_currency`: 기준 통화 코드
- `to_currency`: 대상 통화 코드
- `amount`: 변환할 금액
- `date` (Optional): 환율 적용 날짜

**Response** (200 OK):
```json
{
  "from_currency": "USD",
  "to_currency": "KRW",
  "amount": 100,
  "converted_amount": 130050,
  "rate": 1300.50,
  "date": "2025-01-25"
}
```

### 5.12 OCR 영수증 API (`/api/v2/receipts`) - v2.0 신규

#### POST /upload
**설명**: 영수증 이미지 업로드

**Request**: multipart/form-data
- `file`: 이미지 파일 (JPEG, PNG, 최대 10MB)
- `group_id` (Optional): 그룹 ID

**Response** (201 Created):
```json
{
  "id": 1,
  "image_url": "https://example.com/receipts/1.jpg",
  "ocr_status": "PENDING",
  "created_at": "2025-01-25T12:00:00Z"
}
```

#### POST /{receipt_id}/process
**설명**: OCR 처리 요청

**Response** (200 OK):
```json
{
  "id": 1,
  "ocr_status": "PROCESSING",
  "message": "OCR 처리가 시작되었습니다"
}
```

#### GET /{receipt_id}
**설명**: OCR 결과 조회

**Response** (200 OK):
```json
{
  "id": 1,
  "transaction_id": null,
  "image_url": "https://example.com/receipts/1.jpg",
  "ocr_status": "COMPLETED",
  "extracted_amount": 50000,
  "extracted_date": "2025-01-25",
  "extracted_merchant": "편의점",
  "extracted_items": [
    {"name": "점심 도시락", "price": 50000}
  ],
  "confidence_score": 0.95,
  "verified": false,
  "created_at": "2025-01-25T12:00:00Z",
  "updated_at": "2025-01-25T12:05:00Z"
}
```

#### PUT /{receipt_id}
**설명**: OCR 결과 수정 및 검증

**Request Body**:
```json
{
  "extracted_amount": 55000,
  "extracted_date": "2025-01-25",
  "extracted_merchant": "편의점",
  "verified": true
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "verified": true,
  "message": "OCR 결과가 검증되었습니다"
}
```

#### POST /{receipt_id}/create-transaction
**설명**: OCR 결과로 거래 생성

**Request Body**:
```json
{
  "category_id": 1,
  "tag_id": null,
  "group_id": 1
}
```

**Response** (201 Created):
```json
{
  "transaction_id": 10,
  "receipt_id": 1,
  "message": "거래가 생성되었습니다"
}
```

### 5.13 자동 카테고리 API (`/api/v2/auto-category`) - v2.0 신규

#### POST /recommend
**설명**: 카테고리 자동 추천

**Request Body**:
```json
{
  "merchant": "편의점",
  "amount": 50000,
  "memo": "점심 식사"
}
```

**Response** (200 OK):
```json
{
  "recommended_category_id": 1,
  "recommended_category_name": "식비",
  "confidence": 0.85,
  "matched_rules": [
    {
      "rule_id": 5,
      "pattern_type": "KEYWORD",
      "pattern_value": "식사",
      "priority": 10
    }
  ]
}
```

#### GET /rules
**설명**: 자동 분류 규칙 목록 조회

**Query Parameters**:
- `user_id` (Optional): 사용자 ID
- `group_id` (Optional): 그룹 ID
- `is_active` (Optional): 활성화 상태

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "pattern_type": "KEYWORD",
    "pattern_value": "식사",
    "category_id": 1,
    "category_name": "식비",
    "priority": 10,
    "match_count": 50,
    "success_count": 45,
    "is_active": true,
    "created_at": "2025-01-01T12:00:00Z"
  }
]
```

#### POST /rules
**설명**: 자동 분류 규칙 생성

**Request Body**:
```json
{
  "pattern_type": "KEYWORD",
  "pattern_value": "식사",
  "category_id": 1,
  "priority": 10
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "pattern_type": "KEYWORD",
  "pattern_value": "식사",
  "category_id": 1,
  "priority": 10
}
```

#### PUT /rules/{rule_id}
**설명**: 자동 분류 규칙 수정

#### DELETE /rules/{rule_id}
**설명**: 자동 분류 규칙 삭제

#### POST /rules/{rule_id}/feedback
**설명**: 규칙 피드백 (학습 데이터 수집)

**Request Body**:
```json
{
  "success": true,
  "transaction_id": 10
}
```

**Response** (200 OK):
```json
{
  "message": "피드백이 반영되었습니다",
  "updated_match_count": 51,
  "updated_success_count": 46
}
```

### 5.14 실시간 통신 API - v2.0 신규

#### WebSocket 엔드포인트 (`/api/v2/ws`)

**연결**: `ws://api.example.com/api/v2/ws?token={access_token}`

**인증**: WebSocket 연결 시 JWT 토큰을 쿼리 파라미터로 전달

**이벤트 타입**:

1. **transaction_created**
```json
{
  "type": "transaction_created",
  "data": {
    "id": 10,
    "group_id": 1,
    "owner_user_id": 1,
    "type": "EXPENSE",
    "amount": 50000,
    "date": "2025-01-25"
  },
  "timestamp": "2025-01-25T12:00:00Z"
}
```

2. **transaction_updated**
```json
{
  "type": "transaction_updated",
  "data": {
    "id": 10,
    "amount": 60000
  },
  "timestamp": "2025-01-25T12:05:00Z"
}
```

3. **transaction_deleted**
```json
{
  "type": "transaction_deleted",
  "data": {
    "id": 10
  },
  "timestamp": "2025-01-25T12:10:00Z"
}
```

4. **member_online**
```json
{
  "type": "member_online",
  "data": {
    "user_id": 2,
    "group_id": 1,
    "nickname": "사용자 B"
  },
  "timestamp": "2025-01-25T12:00:00Z"
}
```

5. **member_offline**
```json
{
  "type": "member_offline",
  "data": {
    "user_id": 2,
    "group_id": 1
  },
  "timestamp": "2025-01-25T12:15:00Z"
}
```

**클라이언트 → 서버 메시지**:

1. **ping**: 연결 유지
```json
{
  "type": "ping"
}
```

2. **subscribe**: 그룹 구독
```json
{
  "type": "subscribe",
  "group_id": 1
}
```

#### Server-Sent Events 엔드포인트 (`/api/v2/events`)

**연결**: `GET /api/v2/events`

**Headers**:
```
Authorization: Bearer {access_token}
Accept: text/event-stream
```

**이벤트 스트림 형식**:
```
event: transaction_created
data: {"id": 10, "amount": 50000, "date": "2025-01-25"}

event: notification
data: {"title": "새 거래", "message": "사용자 A가 거래를 추가했습니다"}

event: keepalive
data: {"timestamp": "2025-01-25T12:00:00Z"}
```

**이벤트 타입**:
- `transaction_created`: 거래 생성
- `transaction_updated`: 거래 수정
- `transaction_deleted`: 거래 삭제
- `notification`: 알림
- `keepalive`: 연결 유지 (30초마다)

---

## 6. 사용자 시나리오

### 6.1 회원가입 및 그룹 참여 플로우

**시나리오**: 신혼부부가 처음 서비스를 사용하는 경우

1. **회원가입**
   - 사용자 A가 이메일, 비밀번호, 닉네임 입력
   - 초대 코드 입력 (선택사항)
   - 회원가입 완료 → 자동 로그인

2. **그룹 생성**
   - 사용자 A가 그룹 생성 ("우리 가족")
   - 초대 코드 생성 (10자리 코드)
   - 초대 코드 복사

3. **그룹 참여**
   - 사용자 B가 회원가입 시 초대 코드 입력
   - 또는 기존 사용자가 초대 코드로 그룹 참여
   - 사용자 B의 `group_id`가 자동 설정됨

4. **거래 입력**
   - 사용자 A가 거래 입력 (그룹 거래 선택)
   - 사용자 B가 앱에서 실시간으로 거래 확인 가능

### 6.2 거래 입력 플로우

**시나리오**: 사용자가 거래를 입력하는 경우

1. **빠른 입력 (Quick Add)**
   - 대시보드에서 "빠른 입력" 버튼 클릭
   - 거래 유형 선택 (지출/수입/이체)
   - 금액 입력
   - 카테고리 이름 입력 (없으면 자동 생성)
   - 가맹점명, 메모 입력 (선택사항)
   - 저장

2. **상세 입력**
   - 거래 내역 페이지에서 "거래 추가" 버튼 클릭
   - 모든 필드 입력 (일자, 금액, 카테고리, 태그 등)
   - 그룹 거래 선택 (그룹 멤버인 경우)
   - 저장

3. **반복 거래 설정**
   - 빠른 입력 또는 상세 입력에서 "반복 설정" 선택
   - 반복 주기 선택 (매월/매주/매일)
   - 날짜 규칙 설정
   - 반복 규칙 저장
   - 이후 자동으로 거래 생성됨

### 6.3 통계 조회 플로우

**시나리오**: 사용자가 통계를 확인하는 경우

1. **월별 통계 조회**
   - 통계 페이지 접속
   - 기본값: 최근 1개월 통계 표시
   - 기간 선택 (start_date, end_date)

2. **카테고리별 분석**
   - 카테고리별 통계 Pie Chart 확인
   - 상위 지출 카테고리 확인
   - 카테고리 클릭 시 상세 내역 확인

3. **트렌드 분석**
   - 일별 추이 Line Chart 확인
   - 월별 비교 Bar Chart 확인
   - 지출 패턴 파악

### 6.4 예산 관리 플로우

**시나리오**: 사용자가 예산을 설정하고 관리하는 경우

1. **예산 설정**
   - 예산 관리 페이지 접속
   - 월별 예산 생성 (총 예산 금액)
   - 카테고리별 예산 설정 (카테고리 관리에서)

2. **예산 현황 확인**
   - 예산 현황 조회
   - 예산 대비 지출 확인
   - 카테고리별 예산 대비 지출 확인
   - 예산 초과 여부 확인

3. **예산 수정**
   - 예산 수정 (총 예산 또는 카테고리별 예산)
   - 예산 상태 변경 (ACTIVE, CLOSED, DRAFT)

### 6.5 반복 거래 설정 플로우

**시나리오**: 사용자가 반복 거래를 설정하는 경우

1. **반복 규칙 생성**
   - 반복 거래 관리 페이지 접속
   - 반복 규칙 생성
   - 반복 주기 선택 (MONTHLY, WEEKLY, DAILY)
   - 시작 일자 설정
   - 날짜 규칙 설정 (예: 매월 1일)
   - 거래 정보 입력 (금액, 카테고리, 가맹점명, 메모)

2. **자동 거래 생성**
   - 반복 규칙 일괄 처리 실행
   - 또는 특정 규칙에서 거래 생성
   - 생성된 거래는 `recurring_rule_id`로 구분

3. **반복 규칙 관리**
   - 반복 규칙 수정 (금액, 카테고리 등)
   - 반복 규칙 비활성화
   - 반복 규칙 삭제

### 6.6 OCR 영수증 인식 플로우 - v2.0 신규

**시나리오**: 사용자가 영수증을 촬영하여 자동으로 거래를 생성하는 경우

1. **영수증 촬영/업로드**
   - 거래 입력 화면에서 "영수증 촬영" 버튼 클릭
   - 카메라로 영수증 촬영 또는 갤러리에서 선택
   - 이미지 업로드

2. **OCR 처리**
   - 서버에서 OCR 처리 시작
   - 처리 상태 표시 (대기 중 → 처리 중 → 완료)
   - OCR 결과 자동 추출 (금액, 날짜, 가맹점명)

3. **결과 확인 및 수정**
   - OCR 결과 확인 (금액, 날짜, 가맹점명)
   - 신뢰도 점수 확인
   - 필요 시 수동 수정

4. **거래 생성**
   - 카테고리 선택 (자동 추천 또는 수동 선택)
   - 태그 선택 (선택사항)
   - 그룹 거래 선택 (그룹 멤버인 경우)
   - 거래 생성 또는 기존 거래에 연결

### 6.7 다중 통화 거래 입력 플로우 - v2.0 신규

**시나리오**: 사용자가 외화로 거래를 입력하는 경우

1. **통화 선택**
   - 거래 입력 화면에서 통화 선택 (KRW, USD, EUR, JPY 등)
   - 기본 통화는 사용자 설정에서 가져옴

2. **금액 입력**
   - 선택한 통화로 금액 입력
   - 환율 자동 조회 및 기준 통화 변환 금액 표시

3. **거래 저장**
   - 원래 통화와 금액 저장
   - 기준 통화 변환 금액 저장 (선택적)
   - 통계 및 잔액 계산 시 기준 통화로 변환

4. **통화별 조회**
   - 통화별 거래 목록 조회
   - 통화별 잔액 조회
   - 환율 변동 추이 확인

### 6.8 실시간 동기화 플로우 - v2.0 신규

**시나리오**: 두 사용자가 동시에 거래를 입력하는 경우

1. **WebSocket 연결**
   - 앱 실행 시 WebSocket 자동 연결
   - 그룹 구독 (그룹 멤버인 경우)
   - 연결 상태 표시

2. **실시간 업데이트**
   - 사용자 A가 거래 입력
   - 서버에서 WebSocket으로 이벤트 브로드캐스트
   - 사용자 B의 앱에서 실시간으로 거래 목록 업데이트
   - 사용자 B에게 알림 표시

3. **그룹 멤버 상태**
   - 그룹 멤버 온라인/오프라인 상태 표시
   - 현재 접속 중인 멤버 표시
   - 마지막 활동 시간 표시

4. **충돌 해결**
   - 동시 편집 시 충돌 감지
   - 최신 변경 우선 적용
   - 충돌 알림 및 수동 해결 옵션 제공

### 6.9 자동 카테고리 분류 플로우 - v2.0 신규

**시나리오**: 사용자가 거래를 입력할 때 카테고리가 자동으로 추천되는 경우

1. **거래 입력**
   - 거래 입력 화면에서 가맹점명, 금액, 메모 입력
   - "카테고리 자동 추천" 버튼 클릭

2. **자동 추천**
   - 서버에서 자동 분류 규칙 매칭
   - 과거 거래 패턴 분석
   - 카테고리 추천 결과 표시 (신뢰도 포함)

3. **추천 수락/거부**
   - 추천 카테고리 수락
   - 또는 다른 카테고리 선택
   - 피드백 자동 수집 (학습 데이터)

4. **규칙 학습**
   - 사용자 피드백 반영
   - 규칙 매칭 횟수 및 성공률 업데이트
   - 규칙 신뢰도 자동 계산
   - 향후 추천 정확도 향상

---

## 7. 비기능 요구사항

### 7.1 성능 요구사항

**NFR-PERF-001: 응답 시간**
- API 응답 시간: 평균 < 500ms, 최대 < 2초
- 페이지 로드 시간: 초기 로드 < 3초
- 데이터베이스 쿼리: 평균 < 100ms

**NFR-PERF-002: Core Web Vitals**
- LCP (Largest Contentful Paint): < 2.5초
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**NFR-PERF-003: 동시 사용자**
- 동시 사용자 지원: 1,000명 이상
- API 처리량: 초당 100개 요청 이상

**NFR-PERF-004: 데이터베이스 성능**
- 인덱스 최적화: 모든 외래키 및 자주 조회되는 컬럼에 인덱스
- 쿼리 최적화: JOIN 최소화, 복합 인덱스 활용
- 연결 풀링: 적절한 연결 풀 크기 설정

### 7.2 보안 요구사항

**NFR-SEC-001: 인증/인가**
- JWT 토큰 기반 인증
- 비밀번호 BCrypt 해싱 (salt rounds: 12)
- 토큰 만료 시간: access_token (15분), refresh_token (7일)
- 모든 API 엔드포인트 인증 필수 (공개 API 제외)

**NFR-SEC-002: 데이터 보호**
- SQL Injection 방지 (ORM 사용)
- XSS 방지 (입력값 검증 및 이스케이프)
- CSRF 방지 (SameSite 쿠키 설정)
- 민감 정보 로깅 금지

**NFR-SEC-003: 입력 검증**
- 모든 사용자 입력 검증 (Serde + Validator)
- 파일 업로드 크기 제한 (최대 10MB)
- 파일 타입 검증 (JPEG, PNG)

**NFR-SEC-004: 에러 처리**
- 상세한 에러 정보 노출 금지 (프로덕션)
- 일관된 에러 응답 형식
- 에러 로깅 및 모니터링

### 7.3 확장성 요구사항

**NFR-SCAL-001: 수평 확장**
- 무상태(Stateless) API 설계
- 세션 정보는 데이터베이스 또는 Redis에 저장
- 로드 밸런서 지원

**NFR-SCAL-002: 데이터베이스 확장**
- 읽기 전용 복제본 지원 (향후)
- 샤딩 전략 (향후)
- 캐싱 전략 (Redis, 향후)

**NFR-SCAL-003: 모니터링**
- 성능 모니터링 (응답 시간, 처리량)
- 에러 모니터링 (Sentry 또는 자체 구축)
- 리소스 모니터링 (CPU, 메모리, 디스크)

### 7.4 유지보수성 요구사항

**NFR-MAIN-001: 코드 품질**
- Rust 타입 안전성 (컴파일 타임 검증)
- Dart 타입 안전성 (Flutter)
- 코드 리뷰 프로세스
- 테스트 커버리지 80% 이상 (목표)

**NFR-MAIN-002: 문서화**
- API 문서화 (OpenAPI/Swagger - Rust 자동 생성)
- 코드 주석 (한국어, Rust doc comments)
- 아키텍처 문서

**NFR-MAIN-003: 테스트**
- 단위 테스트 (cargo test, Flutter test)
- 통합 테스트 (Rust, Flutter)
- E2E 테스트 (Flutter integration test)

### 7.5 가용성 요구사항

**NFR-AVAIL-001: 서비스 가용성**
- 목표 가용성: 99.9% (월간 다운타임 < 43분)
- Health Check 엔드포인트 제공
- 자동 장애 감지 및 알림

**NFR-AVAIL-002: 데이터 백업**
- 일일 자동 백업
- 백업 보관 기간: 30일
- 백업 복구 테스트 정기 수행

**NFR-AVAIL-003: 장애 대응**
- 장애 발생 시 즉시 알림
- 롤백 절차 문서화
- 장애 복구 시간 목표: < 1시간

---

## 8. 배포 및 운영

### 8.1 배포 환경

#### Android 앱 (household-ledger-mobile)
- **플랫폼**: Google Play Store
- **빌드**: Flutter APK/AAB 빌드
- **서명**: Play App Signing 사용
- **버전 관리**: Semantic Versioning
- **최소 Android 버전**: Android 8.0 (API 26) 이상

#### 백엔드 API (household-ledger-api)
- **플랫폼**: Fly.io (Rust 지원)
- **빌드**: Rust Cargo 빌드 (Dockerfile 멀티 스테이지)
- **포트**: 8080 (기본)
- **데이터베이스**: MySQL 8.4 (Fly.io Postgres 또는 외부 MySQL)
- **환경 변수**: Fly.io Secrets 관리
- **배포 도구**: `flyctl` CLI
- **배포 프로세스**:
  1. `flyctl launch` - 초기 설정
  2. `flyctl deploy` - 배포
  3. `flyctl secrets set` - 환경 변수 설정
  4. Health check 엔드포인트 구성

**Fly.io Rust 배포 특징**:
- `cargo chef` 기반 Dockerfile 자동 생성 지원
- `flyctl` Rust 스캐너로 빌드 최적화
- Firecracker 기반 마이크로VM으로 전 세계 배포
- 첫 빌드는 시간이 걸리지만, 이후 빌드는 캐시로 빠름

### 8.2 모니터링 및 로깅

**MON-001: 애플리케이션 모니터링**
- 에러 모니터링: Sentry 또는 자체 구축
- 성능 모니터링: 응답 시간, 처리량 추적
- 사용자 활동 추적: 주요 기능 사용 통계

**MON-002: 인프라 모니터링**
- 서버 리소스 모니터링 (CPU, 메모리, 디스크)
- 데이터베이스 모니터링 (연결 수, 쿼리 성능)
- 네트워크 모니터링 (대역폭, 지연 시간)

**MON-003: 로깅**
- 구조화된 로깅 (JSON 형식)
- 로그 레벨: DEBUG, INFO, WARNING, ERROR
- 로그 보관 기간: 30일
- 민감 정보 로깅 금지

### 8.3 백업 전략

**BACKUP-001: 데이터베이스 백업**
- 일일 자동 백업 (매일 새벽 2시)
- 백업 보관 기간: 30일
- 백업 파일 암호화
- 백업 복구 테스트: 월 1회

**BACKUP-002: 백업 스크립트 예시**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="household_ledger"

mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Retention: Keep last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

### 8.4 장애 대응 절차

**INCIDENT-001: 장애 감지**
- Health Check 엔드포인트 모니터링
- 에러 로그 실시간 모니터링
- 자동 알림 시스템 (Slack, Email)

**INCIDENT-002: 장애 대응**
1. 장애 확인 및 영향 범위 파악
2. 임시 조치 (롤백 또는 트래픽 차단)
3. 근본 원인 분석
4. 수정 및 배포
5. 사후 검토 및 개선

**INCIDENT-003: 롤백 절차**
- 이전 버전으로 즉시 롤백 가능
- 데이터베이스 마이그레이션 롤백 절차 문서화
- 롤백 테스트 정기 수행

### 8.5 환경 변수 관리

#### 백엔드 환경 변수 (Rust)
```env
# 데이터베이스
DATABASE_URL="mysql://user:password@localhost:3306/household_ledger"

# 인증
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"
JWT_ACCESS_TOKEN_EXPIRY=900  # 15분 (초)
JWT_REFRESH_TOKEN_EXPIRY=604800  # 7일 (초)

# CORS
CORS_ORIGINS="https://your-domain.com"

# 이메일 (비밀번호 재설정 등)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
FROM_EMAIL="your-email@gmail.com"

# OCR 서비스 (선택적)
OCR_API_KEY="your-ocr-api-key"
OCR_API_URL="https://api.ocr-service.com"

# 환율 API (선택적)
EXCHANGE_RATE_API_KEY="your-exchange-rate-api-key"
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com"

# 환경
ENVIRONMENT="production"
LOG_LEVEL="info"

# Fly.io 특정
FLY_APP_NAME="household-ledger-api"
PORT=8080
```

**Fly.io Secrets 설정**:
```bash
flyctl secrets set JWT_SECRET="your-secret-key"
flyctl secrets set DATABASE_URL="mysql://..."
flyctl secrets set SMTP_PASSWORD="your-password"
```

---

## 9. 참고 자료

### 9.1 프로젝트 문서
- `household-ledger-legacy/README.md`: 레거시 웹앱 기능 및 버전 히스토리 (참고용)
- `household-ledger-android/README.md`: 레거시 Android 앱 기능 및 화면 구성 (참고용)
- `household-ledger-server/README.md`: 레거시 FastAPI 백엔드 API 엔드포인트 목록 (참고용)
- `household-ledger-legacy/prisma/schema.prisma`: 레거시 데이터베이스 스키마 (참고용)
- `household-ledger/docs/PRD.md`: 현재 PRD 문서 (v2.0)

### 9.2 기술 문서
- `.cursorrules`: 프로젝트 개발 규칙
- `DATABASE.md`: 데이터베이스 설계 문서
- `DEVELOPMENT.md`: 개발 가이드
- `SETUP.md`: 환경 설정 가이드

### 9.3 API 문서
- OpenAPI/Swagger UI: `http://localhost:8080/docs` (개발 환경)
- ReDoc: `http://localhost:8080/redoc` (개발 환경)
- API 버전: v1 (레거시), v2 (신규 Rust 백엔드)

### 9.4 마이그레이션 가이드
- 레거시 프로젝트에서 새 프로젝트로의 마이그레이션 가이드 (향후 작성)
- 데이터베이스 마이그레이션 스크립트 (향후 작성)

---

**문서 버전**: 2.0  
**최종 업데이트**: 2025-01-25  
**작성자**: Household Ledger Development Team  
**주요 변경사항**: 
- Rust 백엔드로 전환
- Flutter 모바일 앱 업그레이드
- 웹 프론트엔드 제외 (향후 작업)
- 다중 통화, OCR, 자동 카테고리, 실시간 동기화 기능 추가

