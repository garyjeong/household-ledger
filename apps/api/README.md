# Household Ledger API (Rust Backend)

신혼부부 가계부 서비스의 Rust 백엔드 API 서버입니다.

## 기술 스택

- **Framework**: Axum 0.7
- **Language**: Rust (최신 안정 버전)
- **ORM**: SQLx 0.7
- **Database**: MySQL 8.4
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: BCrypt

## 로컬 개발 환경 설정

### 1. 사전 요구사항

- Rust (최신 안정 버전)
- Docker & Docker Compose
- MySQL 8.4 (Docker Compose로 실행)

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

`.env` 파일에서 필요한 값들을 설정합니다:

```env
DATABASE_URL=mysql://household_user:household_password@localhost:3306/household_ledger
JWT_SECRET=your-secret-key-here-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-here-change-in-production-min-32-chars
```

### 3. Docker Compose로 MySQL 실행

```bash
docker-compose up -d
```

MySQL이 실행되면 다음 명령으로 확인할 수 있습니다:

```bash
docker-compose ps
```

### 4. 데이터베이스 마이그레이션

애플리케이션을 실행하면 자동으로 마이그레이션이 실행됩니다.

또는 수동으로 실행하려면:

```bash
# SQLx CLI 설치 (필요한 경우)
cargo install sqlx-cli

# 마이그레이션 실행
sqlx migrate run
```

### 5. 애플리케이션 실행

#### 방법 1: Makefile 사용 (권장)

```bash
# 초기 설정 (.env 파일 생성)
make setup

# MySQL 시작
make up

# 애플리케이션 실행
make run
```

#### 방법 2: 스크립트 사용

```bash
# 테스트 스크립트 실행 (MySQL 자동 시작 + 애플리케이션 실행)
./scripts/test-local.sh
```

#### 방법 3: 수동 실행

```bash
# MySQL 시작
docker-compose up -d

# 애플리케이션 실행
cargo run

# 또는 릴리스 모드로 실행
cargo run --release
```

서버는 기본적으로 `http://localhost:8080`에서 실행됩니다.

### 6. Health Check

서버가 정상적으로 실행되었는지 확인:

```bash
curl http://localhost:8080/health
```

예상 응답:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-25T12:00:00Z"
}
```

## API 엔드포인트

### 인증

- `POST /api/v2/auth/signup` - 회원가입
- `POST /api/v2/auth/login` - 로그인
- `POST /api/v2/auth/refresh` - 토큰 갱신

### 거래

- `GET /api/v2/transactions` - 거래 목록 조회
- `POST /api/v2/transactions` - 거래 생성
- `GET /api/v2/transactions/:id` - 거래 상세
- `PUT /api/v2/transactions/:id` - 거래 수정
- `DELETE /api/v2/transactions/:id` - 거래 삭제

## 개발 가이드

### 프로젝트 구조

```
apps/api/
├── src/
│   ├── main.rs              # 애플리케이션 진입점
│   ├── lib.rs               # 라이브러리 루트
│   ├── api/                 # API 계층
│   │   ├── v2/              # v2 API
│   │   └── middleware/      # 미들웨어
│   ├── domain/              # 도메인 계층
│   │   ├── models/          # 도메인 모델
│   │   └── repositories/   # Repository 트레이트
│   ├── application/         # 애플리케이션 계층
│   │   └── services/        # 비즈니스 로직
│   ├── infrastructure/      # 인프라 계층
│   │   ├── database/        # 데이터베이스
│   │   ├── repositories/    # Repository 구현
│   │   └── security/        # 보안
│   ├── schemas/             # 요청/응답 스키마
│   └── errors/              # 에러 타입
├── migrations/              # 데이터베이스 마이그레이션
├── tests/                   # 테스트
├── Cargo.toml
├── docker-compose.yml       # 로컬 MySQL
└── .env.example
```

### 코드 포맷팅 및 린팅

```bash
# 코드 포맷팅
cargo fmt

# 린팅
cargo clippy
```

### 테스트

```bash
# 모든 테스트 실행
cargo test

# 특정 테스트 실행
cargo test test_name
```

## 문제 해결

### MySQL 연결 오류

1. Docker Compose가 실행 중인지 확인:
   ```bash
   docker-compose ps
   # 또는
   make logs
   ```

2. MySQL 로그 확인:
   ```bash
   docker-compose logs mysql
   # 또는
   make logs
   ```

3. 데이터베이스 연결 테스트:
   ```bash
   docker-compose exec mysql mysql -u household_user -phousehold_password household_ledger
   ```

4. MySQL 컨테이너 재시작:
   ```bash
   docker-compose restart mysql
   ```

### 포트 충돌

기본 포트 8080이 사용 중인 경우:

1. `.env` 파일에 `PORT=8081` 추가
2. 또는 `src/main.rs`에서 포트를 변경

### 마이그레이션 오류

마이그레이션이 실패하는 경우:

1. 데이터베이스가 비어있는지 확인:
   ```bash
   docker-compose exec mysql mysql -u household_user -phousehold_password -e "DROP DATABASE IF EXISTS household_ledger; CREATE DATABASE household_ledger;"
   ```

2. 마이그레이션 파일의 SQL 문법 확인

3. 애플리케이션을 다시 실행하면 자동으로 마이그레이션이 실행됩니다

### 컴파일 오류

1. Rust 버전 확인:
   ```bash
   rustc --version  # 최신 안정 버전 권장
   ```

2. 의존성 업데이트:
   ```bash
   cargo update
   ```

3. 빌드 캐시 정리:
   ```bash
   cargo clean
   make clean
   ```

### Docker Compose 문제

1. 컨테이너 중지 및 재시작:
   ```bash
   make down
   make up
   ```

2. 볼륨 삭제 후 재시작 (데이터 초기화):
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## 참고 문서

- [PRD.md](../../docs/PRD.md) - 전체 제품 요구사항
- [TRD_BACKEND.md](../../docs/TRD_BACKEND.md) - 백엔드 기술 요구사항

