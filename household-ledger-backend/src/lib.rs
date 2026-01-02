pub mod api;
pub mod application;
pub mod domain;
pub mod errors;
pub mod infrastructure;
pub mod schemas;
pub mod utils;

use axum::Router;
use errors::AppError;
use infrastructure::database::{pool::create_pool, migrations::run_migrations};
use infrastructure::security::JwtService;
use infrastructure::repositories::{
    UserRepositoryImpl, GroupRepositoryImpl, TransactionRepositoryImpl, CategoryRepositoryImpl,
};
use application::services::{
    AuthService, TransactionService, CategoryService, GroupService,
};
use std::env;
use tower_http::cors::CorsLayer;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: sqlx::MySqlPool,
    pub jwt_service: Arc<JwtService>,
    pub auth_service: Arc<AuthService>,
    pub transaction_service: Arc<TransactionService>,
    pub category_service: Arc<CategoryService>,
    pub group_service: Arc<GroupService>,
}

pub async fn create_app() -> Result<Router, AppError> {
    // 데이터베이스 연결 풀 생성
    let database_url = env::var("DATABASE_URL")
        .map_err(|_| AppError::Configuration("DATABASE_URL 환경 변수가 설정되지 않았습니다".to_string()))?;
    
    let pool = create_pool(&database_url).await?;

    // 마이그레이션 실행
    run_migrations(&pool).await?;

    // JWT 서비스 초기화
    let jwt_secret = env::var("JWT_SECRET")
        .map_err(|_| AppError::Configuration("JWT_SECRET 환경 변수가 설정되지 않았습니다".to_string()))?;
    let jwt_service = Arc::new(JwtService::new(&jwt_secret));

    // Repository 구현체 생성
    let user_repo = Box::new(UserRepositoryImpl::new(pool.clone()));
    let group_repo = Box::new(GroupRepositoryImpl::new(pool.clone()));
    let transaction_repo = Box::new(TransactionRepositoryImpl::new(pool.clone()));
    let category_repo = Box::new(CategoryRepositoryImpl::new(pool.clone()));

    // 서비스 생성
    let auth_service = Arc::new(AuthService::new(user_repo.clone(), jwt_service.clone()));
    let transaction_service = Arc::new(TransactionService::new(transaction_repo));
    let category_service = Arc::new(CategoryService::new(category_repo));
    let group_service = Arc::new(GroupService::new(group_repo, user_repo));

    // AppState 생성
    let state = AppState {
        db_pool: pool,
        jwt_service,
        auth_service,
        transaction_service,
        category_service,
        group_service,
    };

    // CORS 설정
    let cors = CorsLayer::permissive(); // 개발 환경용, 프로덕션에서는 특정 origin만 허용

    let app = Router::new()
        .route("/health", axum::routing::get(health_check))
        .merge(api::router())
        .layer(cors)
        .with_state(state);

    Ok(app)
}

async fn health_check() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

