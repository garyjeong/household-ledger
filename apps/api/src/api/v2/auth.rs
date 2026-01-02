use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{post, Router},
};
use crate::application::services::AuthService;
use crate::schemas::{
    SignupRequest, LoginRequest, RefreshTokenRequest,
    AuthResponse, RefreshTokenResponse,
};
use crate::errors::AppError;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/signup", post(signup))
        .route("/login", post(login))
        .route("/refresh", post(refresh))
}

async fn signup(
    State(state): State<AppState>,
    Json(payload): Json<SignupRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // 입력 검증
    payload.validate()
        .map_err(|e| AppError::Validation(format!("입력 검증 실패: {:?}", e)))?;

    let (user, access_token, refresh_token) = state.auth_service.signup(
        payload.email,
        payload.password,
        payload.nickname,
        payload.invite_code,
    ).await?;
    
    Ok(Json(AuthResponse {
        user: UserResponse::from(user),
        access_token,
        refresh_token,
    }))
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // 입력 검증
    payload.validate()
        .map_err(|e| AppError::Validation(format!("입력 검증 실패: {:?}", e)))?;

    let (user, access_token, refresh_token) = state.auth_service.login(
        payload.email,
        payload.password,
    ).await?;
    
    Ok(Json(AuthResponse {
        user: UserResponse::from(user),
        access_token,
        refresh_token,
    }))
}

async fn refresh(
    State(state): State<AppState>,
    Json(payload): Json<RefreshTokenRequest>,
) -> Result<Json<RefreshTokenResponse>, AppError> {
    let access_token = state.auth_service.refresh_token(payload.refresh_token).await?;
    
    Ok(Json(RefreshTokenResponse { access_token }))
}

