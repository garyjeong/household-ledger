# Household Ledger

신혼부부 가계부 서비스 - 투명한 지출 공유와 실시간 동기화를 제공하는 모바일 앱 및 백엔드 API

## 프로젝트 개요

Household Ledger는 신혼부부가 각자 입력해도 자동으로 하나의 가계부로 묶여 지출을 투명하게 공유할 수 있는 수동 입력 위주의 초간단 가계부 서비스입니다.

### 핵심 가치 제안

- **투명한 지출 공유**: 월급 통장 공개 없이 지출만 공유
- **실시간 동기화**: 두 사람이 각자 입력해도 실시간 통합
- **간편한 그룹 참여**: 초대 코드로 가입과 동시에 그룹 연결

## 기술 스택

### Backend (household-ledger-backend)
- **Language**: Rust (최신 안정 버전)
- **Framework**: Axum
- **ORM**: SQLx
- **Database**: MySQL 8.4
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: BCrypt
- **Real-time**: WebSocket (tokio-tungstenite), Server-Sent Events (SSE)
- **Deployment**: Fly.io (Docker 지원)

### Mobile (household-ledger-mobile)
- **Framework**: Flutter (최신 안정 버전)
- **Language**: Dart 3.x
- **Design**: Material Design 3
- **State Management**: BLoC Pattern (flutter_bloc)
- **Network**: Dio + Retrofit
- **Real-time**: WebSocket, Server-Sent Events
- **Storage**: SharedPreferences, Hive
- **Charts**: fl_chart
- **Deployment**: Google Play Store

## 프로젝트 구조

```
household-ledger/
├── household-ledger-backend/    # Rust 백엔드 API
│   ├── src/
│   │   ├── api/                # API 엔드포인트
│   │   ├── application/         # 비즈니스 로직 (Services)
│   │   ├── domain/              # 도메인 모델 및 Repository 인터페이스
│   │   ├── infrastructure/      # 기술 구현 (Repository, Security, Database)
│   │   └── schemas/             # API 요청/응답 스키마
│   ├── migrations/              # 데이터베이스 마이그레이션
│   ├── docker-compose.yml       # 로컬 개발 환경 (MySQL)
│   ├── Dockerfile               # 프로덕션 빌드
│   └── Cargo.toml
│
├── household-ledger-mobile/     # Flutter 모바일 앱
│   ├── lib/
│   │   ├── config/              # 앱 설정
│   │   ├── core/                # 공통 기능 (라우터, 테마, 유틸리티)
│   │   ├── data/                # 데이터 계층 (API, Repository, Models)
│   │   ├── domain/               # 도메인 계층 (Entities, Repository 인터페이스)
│   │   └── presentation/        # 프레젠테이션 계층 (BLoC, Pages, Widgets)
│   ├── android/                 # Android 설정
│   ├── ios/                     # iOS 설정
│   └── pubspec.yaml
│
└── docs/                        # 프로젝트 문서
    ├── PRD.md                   # 제품 요구사항 문서
    ├── TRD_BACKEND.md           # 백엔드 기술 요구사항
    └── TRD_MOBILE.md            # 모바일 앱 기술 요구사항
```

## 아키텍처

### Backend Architecture
- **Pattern**: Clean Architecture + Repository Pattern
- **Layers**:
  - Domain Layer: 비즈니스 규칙 (모델, Repository 트레이트)
  - Application Layer: Use Cases (Service, Handler)
  - Infrastructure Layer: 기술 구현 (Repository 구현체, Security)
  - API Layer: HTTP 엔드포인트 (Router, WebSocket Handler, SSE Handler)

### Mobile Architecture
- **Pattern**: Clean Architecture
- **State Management**: BLoC Pattern
- **Layers**:
  - Domain Layer: 비즈니스 엔티티 및 Repository 인터페이스
  - Data Layer: API 클라이언트, Repository 구현, 로컬 스토리지
  - Presentation Layer: BLoC, Pages, Widgets

## 시작하기

### 사전 요구사항

#### Backend
- Rust (최신 안정 버전)
- Docker & Docker Compose
- MySQL 8.4 (Docker로 실행 가능)

#### Mobile
- Flutter SDK (최신 안정 버전)
- Dart 3.x
- Android Studio 또는 Xcode (모바일 개발용)

### Backend 설정

1. **저장소 클론**
```bash
git clone git@github.com:garyjeong/household-ledger.git
cd household-ledger/household-ledger-backend
```

2. **환경 변수 설정**
```bash
# .env 파일 생성
cp .env.example .env
# 필요한 환경 변수 설정 (DATABASE_URL, JWT_SECRET 등)
```

3. **데이터베이스 실행**
```bash
docker-compose up -d
```

4. **애플리케이션 실행**
```bash
cargo run
```

API 서버가 `http://localhost:8080`에서 실행됩니다.

자세한 내용은 [household-ledger-backend/README.md](household-ledger-backend/README.md)를 참고하세요.

### Mobile 설정

1. **저장소 클론**
```bash
git clone git@github.com:garyjeong/household-ledger.git
cd household-ledger/household-ledger-mobile
```

2. **의존성 설치**
```bash
flutter pub get
```

3. **환경 변수 설정**
```bash
# lib/config/app_config.dart에서 API URL 설정
# 기본값: http://localhost:8080
# Android 에뮬레이터: http://10.0.2.2:8080
```

4. **애플리케이션 실행**
```bash
flutter run
```

자세한 내용은 [household-ledger-mobile/README.md](household-ledger-mobile/README.md)를 참고하세요.

## 주요 기능

### 인증 및 사용자 관리
- 회원가입 / 로그인
- JWT 토큰 기반 인증
- 프로필 관리

### 거래 관리
- 거래 CRUD (생성, 조회, 수정, 삭제)
- 빠른 거래 추가 (Quick Add)
- 다중 통화 지원
- 거래 검색 및 필터링

### 카테고리 및 태그
- 카테고리 관리
- 태그 시스템
- 예산 금액 설정

### 그룹 관리
- 그룹 생성 및 관리
- 초대 코드 생성
- 그룹 참여/탈퇴

### 통계 및 분석
- 종합 통계 (수입, 지출, 순이익)
- 카테고리별 통계 (Pie Chart)
- 일별 추이 (Line Chart)
- 월별 비교

### 실시간 동기화 (계획)
- WebSocket을 통한 실시간 거래 업데이트
- Server-Sent Events를 통한 알림

### 자동화 기능 (계획)
- OCR 영수증 인식
- AI 기반 자동 카테고리 분류

## 개발 가이드

### 코드 스타일

#### Rust
- `rustfmt`를 사용한 코드 포맷팅
- `clippy`를 사용한 린팅
- 타입 안전성 우선

#### Flutter/Dart
- `dartfmt`를 사용한 코드 포맷팅
- `dart analyze`를 사용한 린팅
- Material Design 3 가이드라인 준수

### 테스트

#### Backend
```bash
cd household-ledger-backend
cargo test
```

#### Mobile
```bash
cd household-ledger-mobile
flutter test
```

## 배포

### Backend
- Fly.io에 Docker 이미지로 배포
- `fly.toml` 설정 파일 참고

### Mobile
- Google Play Store에 배포
- Android APK/AAB 빌드

## 문서

- [PRD.md](docs/PRD.md): 제품 요구사항 문서
- [TRD_BACKEND.md](docs/TRD_BACKEND.md): 백엔드 기술 요구사항
- [TRD_MOBILE.md](docs/TRD_MOBILE.md): 모바일 앱 기술 요구사항

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 기여

현재 이 프로젝트는 개인 프로젝트로 진행 중입니다.

## 연락처

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Household Ledger** - 투명한 지출 공유, 실시간 동기화

