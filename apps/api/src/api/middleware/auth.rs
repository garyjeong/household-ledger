use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use crate::errors::AppError;
use crate::infrastructure::security::JwtService;

pub async fn auth_middleware(
    State(jwt_service): State<JwtService>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = request.headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Authentication("Missing authorization header".to_string()))?;

    let token = auth_header.strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Authentication("Invalid authorization format".to_string()))?;

    let claims = jwt_service.verify_token(token)?;
    
    // 사용자 정보를 request extensions에 추가
    request.extensions_mut().insert(claims.user_id);
    
    Ok(next.run(request).await)
}

