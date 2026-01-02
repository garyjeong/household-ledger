use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct SignupRequest {
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 8))]
    pub password: String,
    
    #[validate(length(min = 1, max = 60))]
    pub nickname: String,
    
    pub invite_code: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    
    #[validate(length(min = 1))]
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: i64,
    pub email: String,
    pub nickname: String,
    pub avatar_url: Option<String>,
    pub group_id: Option<i64>,
    pub default_currency: Option<String>,
}

impl From<crate::domain::models::User> for UserResponse {
    fn from(user: crate::domain::models::User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            group_id: user.group_id,
            default_currency: user.default_currency,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
}

