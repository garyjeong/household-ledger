# Household Ledger - Backend Technical Requirements Document (TRD)

**작성일**: 2025-01-25  
**버전**: 2.0  
**목적**: Rust 백엔드 API 서버의 기술적 구현 요구사항 정의서

---

## 목차

1. [개요](#1-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [아키텍처 설계](#4-아키텍처-설계)
5. [데이터베이스 구현](#5-데이터베이스-구현)
6. [API 구현](#6-api-구현)
7. [실시간 통신 구현](#7-실시간-통신-구현)
8. [외부 서비스 통합](#8-외부-서비스-통합)
9. [보안 구현](#9-보안-구현)
10. [테스트 전략](#10-테스트-전략)
11. [배포 및 운영](#11-배포-및-운영)

---

## 1. 개요

### 1.1 목적

Household Ledger 백엔드 API 서버는 Rust로 구현되며, Flutter 모바일 앱을 위한 RESTful API와 실시간 통신(WebSocket, SSE)을 제공합니다.

### 1.2 주요 기능

- 인증 및 사용자 관리 (JWT)
- 거래 관리 (CRUD, 다중 통화 지원)
- 카테고리 및 태그 관리
- 통계 및 대시보드
- 예산 관리
- 반복 거래 규칙
- 그룹 관리
- OCR 영수증 인식
- 자동 카테고리 분류
- 환율 관리
- 실시간 동기화 (WebSocket, SSE)

### 1.3 참고 문서

- [PRD.md](./PRD.md): 전체 제품 요구사항 문서
- [TRD_MOBILE.md](./TRD_MOBILE.md): 모바일 앱 기술 요구사항 문서

---

## 2. 기술 스택

### 2.1 핵심 프레임워크

#### 웹 프레임워크 선택
- **옵션 1: Axum** (권장)
  - Tokio 팀에서 개발
  - 비동기 우선 설계
  - 타입 안전한 핸들러
  - WebSocket 내장 지원
  - 최신 Rust 기능 활용

- **옵션 2: Actix-web**
  - 성숙한 생태계
  - 높은 성능
  - Actor 모델 기반

**선택 기준**: Axum 권장 (최신 Rust 생태계, WebSocket 내장 지원)

#### 의존성 (Cargo.toml)

```toml
[dependencies]
# 웹 프레임워크
axum = "0.7"
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }

# 데이터베이스
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "mysql", "chrono", "json"] }
mysql_async = "0.37"

# 인증 및 보안
jsonwebtoken = "9.2"
bcrypt = "0.15"
argon2 = "0.5"

# 직렬화
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# 검증
validator = { version = "0.18", features = ["derive"] }

# 실시간 통신
tokio-tungstenite = { version = "0.21", features = ["native-tls"] }
futures-util = "0.3"

# 환경 변수
dotenv = "0.15"

# 로깅
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# 날짜/시간
chrono = { version = "0.4", features = ["serde"] }

# 에러 처리
anyhow = "1.0"
thiserror = "1.0"

# HTTP 클라이언트 (외부 API 호출)
reqwest = { version = "0.11", features = ["json"] }

# 파일 업로드
multer = "3.0"

# UUID
uuid = { version = "1.6", features = ["v4", "serde"] }

# 비동기 런타임
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
# 테스트
mockall = "0.12"
tokio-test = "0.4"
```

### 2.2 데이터베이스

- **MySQL 8.4**: 메인 데이터베이스
- **ORM**: SQLx (타입 안전한 쿼리) 또는 Diesel (선택적)
- **마이그레이션**: SQLx migrations 또는 Diesel migrations

### 2.3 실시간 통신

- **WebSocket**: tokio-tungstenite
- **Server-Sent Events**: Axum 내장 SSE 지원

### 2.4 외부 서비스 통합

- **OCR 서비스**: Tesseract OCR 또는 클라우드 OCR API (Google Vision, AWS Textract)
- **환율 API**: OpenExchangeRates, ExchangeRate-API 등

---

## 3. 프로젝트 구조

### 3.1 Monorepo 내 위치

```
household-ledger/
├── apps/
│   └── api/                    # Rust 백엔드
│       ├── Cargo.toml
│       ├── src/
│       │   ├── main.rs
│       │   ├── lib.rs
│       │   ├── api/            # API 라우터
│       │   │   ├── mod.rs
│       │   │   ├── v2/
│       │   │   │   ├── mod.rs
│       │   │   │   ├── auth.rs
│       │   │   │   ├── transactions.rs
│       │   │   │   ├── categories.rs
│       │   │   │   ├── groups.rs
│       │   │   │   ├── statistics.rs
│       │   │   │   ├── budgets.rs
│       │   │   │   ├── recurring_rules.rs
│       │   │   │   ├── balance.rs
│       │   │   │   ├── settings.rs
│       │   │   │   ├── exchange_rates.rs
│       │   │   │   ├── receipts.rs
│       │   │   │   ├── auto_category.rs
│       │   │   │   └── ws.rs          # WebSocket
│       │   │   └── sse.rs             # Server-Sent Events
│       │   ├── domain/         # 도메인 계층
│       │   │   ├── mod.rs
│       │   │   ├── models/      # 도메인 모델
│       │   │   │   ├── mod.rs
│       │   │   │   ├── user.rs
│       │   │   │   ├── transaction.rs
│       │   │   │   ├── category.rs
│       │   │   │   ├── group.rs
│       │   │   │   └── ...
│       │   │   └── repositories/ # Repository 트레이트
│       │   │       ├── mod.rs
│       │   │       ├── user_repository.rs
│       │   │       ├── transaction_repository.rs
│       │   │       └── ...
│       │   ├── application/    # 애플리케이션 계층
│       │   │   ├── mod.rs
│       │   │   ├── services/    # 비즈니스 로직
│       │   │   │   ├── mod.rs
│       │   │   │   ├── auth_service.rs
│       │   │   │   ├── transaction_service.rs
│       │   │   │   ├── category_service.rs
│       │   │   │   ├── ocr_service.rs
│       │   │   │   ├── exchange_rate_service.rs
│       │   │   │   └── ...
│       │   │   └── handlers/   # 요청 핸들러
│       │   │       ├── mod.rs
│       │   │       └── ...
│       │   ├── infrastructure/ # 인프라 계층
│       │   │   ├── mod.rs
│       │   │   ├── database/    # 데이터베이스 연결
│       │   │   │   ├── mod.rs
│       │   │   │   ├── pool.rs
│       │   │   │   └── migrations/
│       │   │   ├── repositories/ # Repository 구현체
│       │   │   │   ├── mod.rs
│       │   │   │   ├── user_repository_impl.rs
│       │   │   │   ├── transaction_repository_impl.rs
│       │   │   │   └── ...
│       │   │   ├── security/    # 보안 유틸리티
│       │   │   │   ├── mod.rs
│       │   │   │   ├── jwt.rs
│       │   │   │   └── password.rs
│       │   │   └── external/    # 외부 서비스 클라이언트
│       │   │       ├── mod.rs
│       │   │       ├── ocr_client.rs
│       │   │       └── exchange_rate_client.rs
│       │   ├── schemas/         # 요청/응답 스키마
│       │   │   ├── mod.rs
│       │   │   ├── auth.rs
│       │   │   ├── transaction.rs
│       │   │   └── ...
│       │   ├── errors/          # 에러 타입
│       │   │   ├── mod.rs
│       │   │   └── app_error.rs
│       │   └── utils/           # 유틸리티
│       │       ├── mod.rs
│       │       └── ...
│       ├── migrations/          # 데이터베이스 마이그레이션
│       │   └── *.sql
│       ├── tests/               # 테스트
│       │   ├── integration/
│       │   └── unit/
│       ├── Dockerfile
│       ├── fly.toml
│       └── .env.example
```

### 3.2 모듈 구조 원칙

- **계층 분리**: Domain → Application → Infrastructure → API
- **의존성 방향**: API → Application → Domain ← Infrastructure
- **트레이트 기반**: Repository는 트레이트로 정의, 구현체는 Infrastructure에 위치
- **에러 처리**: `thiserror`로 도메인별 에러 타입 정의

---

## 4. 아키텍처 설계

### 4.1 Clean Architecture 계층

#### 4.1.1 Domain Layer (도메인 계층)

**역할**: 비즈니스 규칙 및 도메인 모델

**구성**:
- **Models**: 엔티티 정의 (User, Transaction, Category 등)
- **Repository Traits**: 데이터 접근 인터페이스 정의
- **Domain Errors**: 도메인별 에러 타입

**예시: Transaction 모델**
```rust
// src/domain/models/transaction.rs
use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: i64,
    pub group_id: Option<i64>,
    pub owner_user_id: i64,
    pub transaction_type: TransactionType,
    pub date: NaiveDate,
    pub amount: i64,
    pub currency_code: Option<String>,
    pub original_amount: Option<i64>,
    pub category_id: Option<i64>,
    pub tag_id: Option<i64>,
    pub recurring_rule_id: Option<i64>,
    pub receipt_id: Option<i64>,
    pub merchant: Option<String>,
    pub memo: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum TransactionType {
    Expense,
    Income,
    Transfer,
}
```

**예시: Repository Trait**
```rust
// src/domain/repositories/transaction_repository.rs
use async_trait::async_trait;
use crate::domain::models::transaction::Transaction;

#[async_trait]
pub trait TransactionRepository: Send + Sync {
    async fn create(&self, transaction: &Transaction) -> Result<Transaction, RepositoryError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Transaction>, RepositoryError>;
    async fn find_by_group(&self, group_id: i64, limit: u32, offset: u32) -> Result<Vec<Transaction>, RepositoryError>;
    async fn update(&self, transaction: &Transaction) -> Result<Transaction, RepositoryError>;
    async fn delete(&self, id: i64) -> Result<(), RepositoryError>;
}
```

#### 4.1.2 Application Layer (애플리케이션 계층)

**역할**: 비즈니스 로직 및 Use Cases

**구성**:
- **Services**: 비즈니스 로직 구현
- **Handlers**: HTTP 요청 처리 (선택적, API Layer로 이동 가능)

**예시: Transaction Service**
```rust
// src/application/services/transaction_service.rs
use crate::domain::repositories::transaction_repository::TransactionRepository;
use crate::domain::models::transaction::Transaction;

pub struct TransactionService {
    transaction_repo: Box<dyn TransactionRepository>,
}

impl TransactionService {
    pub fn new(transaction_repo: Box<dyn TransactionRepository>) -> Self {
        Self { transaction_repo }
    }

    pub async fn create_transaction(
        &self,
        transaction: Transaction,
    ) -> Result<Transaction, ServiceError> {
        // 비즈니스 로직: 검증, 환율 변환 등
        self.transaction_repo.create(&transaction).await
    }
}
```

#### 4.1.3 Infrastructure Layer (인프라 계층)

**역할**: 기술적 구현 (데이터베이스, 외부 API 등)

**구성**:
- **Database Pool**: SQLx 연결 풀 관리
- **Repository Implementations**: Repository 트레이트 구현
- **External Clients**: OCR, 환율 API 클라이언트
- **Security**: JWT, BCrypt 구현

**예시: Transaction Repository 구현**
```rust
// src/infrastructure/repositories/transaction_repository_impl.rs
use sqlx::MySqlPool;
use crate::domain::repositories::transaction_repository::TransactionRepository;
use crate::domain::models::transaction::Transaction;

pub struct TransactionRepositoryImpl {
    pool: MySqlPool,
}

impl TransactionRepositoryImpl {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TransactionRepository for TransactionRepositoryImpl {
    async fn create(&self, transaction: &Transaction) -> Result<Transaction, RepositoryError> {
        sqlx::query_as!(
            Transaction,
            r#"
            INSERT INTO transactions (group_id, owner_user_id, type, date, amount, currency_code, ...)
            VALUES (?, ?, ?, ?, ?, ?, ...)
            "#,
            transaction.group_id,
            transaction.owner_user_id,
            // ...
        )
        .execute(&self.pool)
        .await?;
        // ...
    }
}
```

#### 4.1.4 API Layer (API 계층)

**역할**: HTTP 엔드포인트 및 라우팅

**구성**:
- **Routers**: Axum 라우터 정의
- **Handlers**: HTTP 요청 핸들러
- **Middleware**: 인증, 로깅, CORS 등

**예시: Transaction Router**
```rust
// src/api/v2/transactions.rs
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use crate::application::services::transaction_service::TransactionService;
use crate::schemas::transaction::{TransactionCreateRequest, TransactionResponse};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_transactions).post(create_transaction))
        .route("/:id", get(get_transaction).put(update_transaction).delete(delete_transaction))
        .route("/quick-add", post(quick_add_transaction))
}

async fn create_transaction(
    State(service): State<TransactionService>,
    Json(payload): Json<TransactionCreateRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // ...
}
```

### 4.2 의존성 주입

**방식**: Axum의 `State`를 통한 의존성 주입

```rust
// src/lib.rs
#[derive(Clone)]
pub struct AppState {
    pub db_pool: MySqlPool,
    pub transaction_service: TransactionService,
    pub auth_service: AuthService,
    // ...
}

pub fn create_app(state: AppState) -> Router {
    Router::new()
        .nest("/api/v2", api::v2::router())
        .with_state(state)
}
```

### 4.3 에러 처리

**전역 에러 타입**:
```rust
// src/errors/app_error.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Authentication error: {0}")]
    Authentication(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Internal server error")]
    Internal,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::Authentication(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "Internal error"),
        };
        
        let body = Json(json!({
            "error": error_message,
            "message": self.to_string()
        }));
        
        (status, body).into_response()
    }
}
```

---

## 5. 데이터베이스 구현

### 5.1 연결 풀 설정

```rust
// src/infrastructure/database/pool.rs
use sqlx::MySqlPool;

pub async fn create_pool(database_url: &str) -> Result<MySqlPool, sqlx::Error> {
    MySqlPool::connect_with(
        database_url.parse()?
    ).await
}
```

### 5.2 마이그레이션

**SQLx Migrations 사용**:
```rust
// migrations/001_initial_schema.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(60) NOT NULL,
    avatar_url VARCHAR(500),
    group_id BIGINT,
    default_currency VARCHAR(3),
    settings JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);

-- ... 나머지 테이블
```

**마이그레이션 실행**:
```rust
// src/infrastructure/database/migrations.rs
pub async fn run_migrations(pool: &MySqlPool) -> Result<(), sqlx::Error> {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await
}
```

### 5.3 쿼리 최적화

- **인덱스 활용**: 모든 외래키 및 자주 조회되는 컬럼에 인덱스
- **복합 인덱스**: (group_id, date), (owner_user_id, date) 등
- **연결 풀링**: 적절한 풀 크기 설정 (기본값: 10)

---

## 6. API 구현

### 6.1 인증 API

#### JWT 토큰 관리

```rust
// src/infrastructure/security/jwt.rs
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub user_id: i64,
    pub email: String,
    pub exp: usize,
}

pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    pub fn new(secret: &str) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_ref()),
            decoding_key: DecodingKey::from_secret(secret.as_ref()),
        }
    }

    pub fn generate_access_token(&self, user_id: i64, email: &str) -> Result<String, JwtError> {
        let exp = (chrono::Utc::now() + chrono::Duration::minutes(15)).timestamp() as usize;
        let claims = Claims {
            user_id,
            email: email.to_string(),
            exp,
        };
        encode(&Header::new(Algorithm::HS256), &claims, &self.encoding_key)
            .map_err(|e| JwtError::Encoding(e.to_string()))
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, JwtError> {
        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &Validation::new(Algorithm::HS256),
        )?;
        Ok(token_data.claims)
    }
}
```

#### 인증 미들웨어

```rust
// src/api/middleware/auth.rs
use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};

pub async fn auth_middleware(
    State(jwt_service): State<JwtService>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = request.headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(AppError::Authentication("Missing authorization header".to_string()))?;

    let token = auth_header.strip_prefix("Bearer ")
        .ok_or(AppError::Authentication("Invalid authorization format".to_string()))?;

    let claims = jwt_service.verify_token(token)?;
    
    // 사용자 정보를 request extensions에 추가
    request.extensions_mut().insert(claims.user_id);
    
    Ok(next.run(request).await)
}
```

### 6.2 거래 API 구현

#### 거래 생성 (다중 통화 지원)

```rust
// src/api/v2/transactions.rs
async fn create_transaction(
    State(service): State<TransactionService>,
    State(exchange_service): State<ExchangeRateService>,
    Extension(user_id): Extension<i64>,
    Json(payload): Json<TransactionCreateRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // 통화 변환 (필요한 경우)
    let amount = if let Some(currency_code) = &payload.currency_code {
        if currency_code != "KRW" {
            // 기준 통화(KRW)로 변환
            let converted = exchange_service
                .convert(payload.original_amount.unwrap_or(payload.amount), currency_code, "KRW")
                .await?;
            converted
        } else {
            payload.amount
        }
    } else {
        payload.amount
    };

    let transaction = Transaction {
        id: 0,
        group_id: payload.group_id,
        owner_user_id: user_id,
        transaction_type: payload.transaction_type,
        date: payload.date,
        amount,
        currency_code: payload.currency_code,
        original_amount: payload.original_amount,
        // ...
    };

    let created = service.create_transaction(transaction).await?;
    Ok(Json(TransactionResponse::from(created)))
}
```

### 6.3 통계 API 구현

#### 최적화된 쿼리

```rust
// src/infrastructure/repositories/statistics_repository_impl.rs
pub async fn get_category_stats(
    &self,
    group_id: Option<i64>,
    start_date: NaiveDate,
    end_date: NaiveDate,
) -> Result<CategoryStats, RepositoryError> {
    let stats = sqlx::query_as!(
        CategoryStat,
        r#"
        SELECT 
            c.id as category_id,
            c.name as category_name,
            SUM(t.amount) as amount,
            COUNT(t.id) as transaction_count
        FROM transactions t
        INNER JOIN categories c ON t.category_id = c.id
        WHERE 
            (t.group_id = ? OR ? IS NULL)
            AND t.date BETWEEN ? AND ?
            AND t.type = 'EXPENSE'
        GROUP BY c.id, c.name
        ORDER BY amount DESC
        LIMIT 10
        "#,
        group_id,
        group_id,
        start_date,
        end_date
    )
    .fetch_all(&self.pool)
    .await?;
    
    Ok(CategoryStats { stats })
}
```

---

## 7. 실시간 통신 구현

### 7.1 WebSocket 구현

#### WebSocket 핸들러

```rust
// src/api/v2/ws.rs
use axum::{
    extract::{ws::WebSocketUpgrade, State, Query},
    response::Response,
};
use tokio_tungstenite::tungstenite::Message;
use futures_util::{SinkExt, StreamExt};

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> Response {
    let token = params.get("token").cloned();
    
    ws.on_upgrade(move |socket| handle_socket(socket, state, token))
}

async fn handle_socket(
    socket: WebSocket,
    state: AppState,
    token: Option<String>,
) {
    // 인증 확인
    let user_id = match authenticate_ws(&state, &token).await {
        Ok(id) => id,
        Err(_) => {
            socket.close(None).await.ok();
            return;
        }
    };

    let (mut sender, mut receiver) = socket.split();

    // 그룹 구독
    let mut group_id = None;
    
    // 메시지 수신 루프
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                let event: WsEvent = serde_json::from_str(&text)?;
                match event {
                    WsEvent::Subscribe { group_id: gid } => {
                        group_id = Some(gid);
                    }
                    WsEvent::Ping => {
                        sender.send(Message::Text(r#"{"type":"pong"}"#.to_string())).await?;
                    }
                    _ => {}
                }
            }
            Ok(Message::Close(_)) => break,
            Err(e) => {
                tracing::error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }
}

// 이벤트 브로드캐스트
pub async fn broadcast_transaction_created(
    state: &AppState,
    group_id: i64,
    transaction: &Transaction,
) {
    let event = WsEvent::TransactionCreated {
        transaction: transaction.clone(),
    };
    state.ws_manager.broadcast_to_group(group_id, event).await;
}
```

#### WebSocket 연결 관리자

```rust
// src/infrastructure/websocket/manager.rs
use std::collections::HashMap;
use tokio::sync::broadcast;

pub struct WebSocketManager {
    // 그룹별 채널
    groups: Arc<RwLock<HashMap<i64, broadcast::Sender<WsEvent>>>>,
    // 사용자별 연결
    connections: Arc<RwLock<HashMap<i64, Vec<Connection>>>>,
}

impl WebSocketManager {
    pub async fn broadcast_to_group(&self, group_id: i64, event: WsEvent) {
        if let Some(sender) = self.groups.read().await.get(&group_id) {
            let _ = sender.send(event);
        }
    }
}
```

### 7.2 Server-Sent Events 구현

```rust
// src/api/v2/sse.rs
use axum::{
    extract::State,
    response::sse::{Event, Sse},
    Router,
};
use futures_util::stream;
use tokio_stream::StreamExt;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/events", get(sse_handler))
}

async fn sse_handler(
    State(state): State<AppState>,
    Extension(user_id): Extension<i64>,
) -> Sse<impl Stream<Item = Result<Event, axum::Error>>> {
    let (tx, mut rx) = tokio::sync::broadcast::channel::<SseEvent>(100);
    
    // 그룹 구독
    state.sse_manager.subscribe(user_id, tx.clone()).await;
    
    let stream = stream::unfold(rx, |mut receiver| async move {
        match receiver.recv().await {
            Ok(event) => {
                let event = Event::default()
                    .event(&event.event_type)
                    .data(serde_json::to_string(&event.data).unwrap());
                Some((Ok(event), receiver))
            }
            Err(_) => None,
        }
    });

    Sse::new(stream)
        .keep_alive(axum::response::sse::KeepAlive::new().interval(Duration::from_secs(30)))
}
```

---

## 8. 외부 서비스 통합

### 8.1 OCR 서비스 통합

#### OCR 클라이언트

```rust
// src/infrastructure/external/ocr_client.rs
use reqwest::Client;
use serde::{Deserialize, Serialize};

pub struct OcrClient {
    client: Client,
    api_key: String,
    api_url: String,
}

impl OcrClient {
    pub fn new(api_key: String, api_url: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
            api_url,
        }
    }

    pub async fn process_receipt(&self, image_data: Vec<u8>) -> Result<OcrResult, OcrError> {
        let form = reqwest::multipart::Form::new()
            .part("image", reqwest::multipart::Part::bytes(image_data));

        let response = self.client
            .post(&format!("{}/ocr", self.api_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .multipart(form)
            .send()
            .await?;

        let result: OcrResult = response.json().await?;
        Ok(result)
    }
}

#[derive(Debug, Deserialize)]
pub struct OcrResult {
    pub amount: Option<i64>,
    pub date: Option<NaiveDate>,
    pub merchant: Option<String>,
    pub items: Vec<OcrItem>,
    pub confidence: f64,
}
```

#### OCR 서비스

```rust
// src/application/services/ocr_service.rs
pub struct OcrService {
    ocr_client: Arc<OcrClient>,
    receipt_repo: Box<dyn ReceiptRepository>,
}

impl OcrService {
    pub async fn process_receipt(
        &self,
        user_id: i64,
        image_data: Vec<u8>,
    ) -> Result<Receipt, ServiceError> {
        // OCR 처리
        let ocr_result = self.ocr_client.process_receipt(image_data).await?;
        
        // Receipt 저장
        let receipt = Receipt {
            id: 0,
            user_id,
            ocr_result: Some(serde_json::to_value(&ocr_result)?),
            ocr_status: OcrStatus::Completed,
            extracted_amount: ocr_result.amount,
            extracted_date: ocr_result.date,
            extracted_merchant: ocr_result.merchant,
            confidence_score: Some(ocr_result.confidence),
            verified: false,
            // ...
        };
        
        self.receipt_repo.create(&receipt).await
    }
}
```

### 8.2 환율 API 통합

#### 환율 클라이언트

```rust
// src/infrastructure/external/exchange_rate_client.rs
pub struct ExchangeRateClient {
    client: Client,
    api_key: String,
    api_url: String,
}

impl ExchangeRateClient {
    pub async fn get_exchange_rate(
        &self,
        from: &str,
        to: &str,
    ) -> Result<f64, ExchangeRateError> {
        let url = format!("{}/latest/{}", self.api_url, from);
        let response = self.client
            .get(&url)
            .header("apikey", &self.api_key)
            .send()
            .await?;

        let data: ExchangeRateResponse = response.json().await?;
        Ok(data.rates.get(to).copied().unwrap_or(1.0))
    }

    pub async fn update_exchange_rates(&self) -> Result<Vec<ExchangeRate>, ExchangeRateError> {
        // 주요 통화 쌍 업데이트
        let currencies = vec!["USD", "EUR", "JPY", "CNY"];
        let mut rates = Vec::new();
        
        for from in &currencies {
            for to in &currencies {
                if from != to {
                    let rate = self.get_exchange_rate(from, to).await?;
                    rates.push(ExchangeRate {
                        from_currency: from.to_string(),
                        to_currency: to.to_string(),
                        rate: Decimal::from_f64(rate).unwrap(),
                        date: chrono::Utc::now().date_naive(),
                    });
                }
            }
        }
        
        Ok(rates)
    }
}
```

#### 환율 업데이트 스케줄러

```rust
// src/application/services/exchange_rate_service.rs
use tokio::time::{interval, Duration};

pub async fn start_exchange_rate_scheduler(
    service: Arc<ExchangeRateService>,
) {
    let mut interval = interval(Duration::from_secs(3600)); // 1시간마다
    
    loop {
        interval.tick().await;
        if let Err(e) = service.update_exchange_rates().await {
            tracing::error!("Failed to update exchange rates: {}", e);
        }
    }
}
```

---

## 9. 보안 구현

### 9.1 비밀번호 해싱

```rust
// src/infrastructure/security/password.rs
use bcrypt::{hash, verify, DEFAULT_COST};

pub fn hash_password(password: &str) -> Result<String, PasswordError> {
    hash(password, DEFAULT_COST)
        .map_err(|e| PasswordError::Hashing(e.to_string()))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, PasswordError> {
    verify(password, hash)
        .map_err(|e| PasswordError::Verification(e.to_string()))
}
```

### 9.2 입력 검증

```rust
// src/schemas/transaction.rs
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct TransactionCreateRequest {
    #[validate(range(min = 1))]
    pub amount: i64,
    
    #[validate(length(min = 3, max = 3))]
    pub currency_code: Option<String>,
    
    #[validate(length(max = 160))]
    pub merchant: Option<String>,
    
    #[validate(length(max = 1000))]
    pub memo: Option<String>,
}
```

### 9.3 CORS 설정

```rust
// src/main.rs
use tower_http::cors::CorsLayer;

let cors = CorsLayer::new()
    .allow_origin(env::var("CORS_ORIGINS")?.parse()?)
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
    .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE])
    .allow_credentials(true);
```

---

## 10. 테스트 전략

### 10.1 단위 테스트

```rust
// tests/unit/transaction_service_test.rs
#[tokio::test]
async fn test_create_transaction() {
    let mut mock_repo = MockTransactionRepository::new();
    mock_repo
        .expect_create()
        .times(1)
        .returning(|t| Ok(t.clone()));
    
    let service = TransactionService::new(Box::new(mock_repo));
    let transaction = Transaction::new(/* ... */);
    
    let result = service.create_transaction(transaction).await;
    assert!(result.is_ok());
}
```

### 10.2 통합 테스트

```rust
// tests/integration/transaction_api_test.rs
#[sqlx::test]
async fn test_create_transaction_api(pool: MySqlPool) {
    let app = create_app(AppState { db_pool: pool, /* ... */ }).await;
    
    let response = app
        .post("/api/v2/transactions")
        .header("Authorization", "Bearer test_token")
        .json(&json!({
            "type": "EXPENSE",
            "amount": 50000,
            "date": "2025-01-25"
        }))
        .send()
        .await;
    
    assert_eq!(response.status(), StatusCode::CREATED);
}
```

---

## 11. 배포 및 운영

### 11.1 Fly.io 배포 설정

#### Dockerfile

```dockerfile
# Dockerfile
FROM rust:1.75 as builder

WORKDIR /app

# 의존성 복사 및 빌드
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

# 런타임 이미지
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/household-ledger-api /usr/local/bin/

EXPOSE 8080

CMD ["/usr/local/bin/household-ledger-api"]
```

#### fly.toml

```toml
app = "household-ledger-api"
primary_region = "icn"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  RUST_LOG = "info"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 8080
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[checks]
  [checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"
```

### 11.2 환경 변수 관리

```bash
# Fly.io Secrets 설정
flyctl secrets set DATABASE_URL="mysql://..."
flyctl secrets set JWT_SECRET="..."
flyctl secrets set JWT_REFRESH_SECRET="..."
flyctl secrets set OCR_API_KEY="..."
flyctl secrets set EXCHANGE_RATE_API_KEY="..."
```

### 11.3 Health Check

```rust
// src/api/health.rs
pub async fn health_check() -> Json<serde_json::Value> {
    Json(json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
```

### 11.4 로깅

```rust
// src/main.rs
use tracing_subscriber;

fn init_logging() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info"))
        )
        .init();
}
```

---

## 12. 성능 최적화

### 12.1 데이터베이스 최적화

- **연결 풀 크기**: 10-20 (동시 요청 수에 따라 조정)
- **쿼리 최적화**: 인덱스 활용, JOIN 최소화
- **캐싱**: Redis 도입 (향후)

### 12.2 비동기 처리

- **Tokio 런타임**: 멀티스레드 런타임 사용
- **논블로킹 I/O**: 모든 데이터베이스 작업 비동기
- **백그라운드 작업**: OCR 처리, 환율 업데이트는 백그라운드 태스크로

---

## 13. 모니터링 및 로깅

### 13.1 로깅 전략

- **구조화된 로깅**: JSON 형식
- **로그 레벨**: DEBUG, INFO, WARN, ERROR
- **민감 정보 제외**: 비밀번호, 토큰 등은 로깅하지 않음

### 13.2 메트릭 수집

- **응답 시간**: 각 API 엔드포인트별 측정
- **에러율**: 에러 발생 빈도 추적
- **데이터베이스 쿼리 시간**: 느린 쿼리 감지

---

**문서 버전**: 2.0  
**최종 업데이트**: 2025-01-25  
**작성자**: Household Ledger Development Team

