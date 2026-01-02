use crate::domain::models::User;
use crate::domain::repositories::UserRepository;
use crate::errors::AppError;
use crate::infrastructure::security::{hash_password, verify_password, JwtService};
use std::sync::Arc;

pub struct AuthService {
    user_repo: Box<dyn UserRepository>,
    jwt_service: Arc<JwtService>,
}

impl AuthService {
    pub fn new(user_repo: Box<dyn UserRepository>, jwt_service: Arc<JwtService>) -> Self {
        Self {
            user_repo,
            jwt_service,
        }
    }

    pub async fn signup(
        &self,
        email: String,
        password: String,
        nickname: String,
        invite_code: Option<String>,
    ) -> Result<(User, String, String), AppError> {
        // 이메일 중복 체크
        if self.user_repo.find_by_email(&email).await?.is_some() {
            return Err(AppError::Validation("이미 사용 중인 이메일입니다".to_string()));
        }

        // 비밀번호 해싱
        let password_hash = hash_password(&password)?;

        // 사용자 생성
        let user = User {
            id: 0,
            email,
            password_hash,
            nickname,
            avatar_url: None,
            group_id: None,
            default_currency: Some("KRW".to_string()),
            settings: None,
            created_at: chrono::Utc::now().naive_utc(),
        };

        let created_user = self.user_repo.create(&user).await?;

        // TODO: invite_code 처리 (그룹 참여)

        // 토큰 생성
        let access_token = self.jwt_service.generate_access_token(created_user.id, &created_user.email)?;
        let refresh_token = self.jwt_service.generate_refresh_token(created_user.id, &created_user.email)?;

        Ok((created_user, access_token, refresh_token))
    }

    pub async fn login(&self, email: String, password: String) -> Result<(User, String, String), AppError> {
        let user = self.user_repo
            .find_by_email(&email)
            .await?
            .ok_or_else(|| AppError::Authentication("이메일 또는 비밀번호가 올바르지 않습니다".to_string()))?;

        // 비밀번호 검증
        if !verify_password(&password, &user.password_hash)? {
            return Err(AppError::Authentication("이메일 또는 비밀번호가 올바르지 않습니다".to_string()));
        }

        // 토큰 생성
        let access_token = self.jwt_service.generate_access_token(user.id, &user.email)?;
        let refresh_token = self.jwt_service.generate_refresh_token(user.id, &user.email)?;

        Ok((user, access_token, refresh_token))
    }

    pub async fn refresh_token(&self, refresh_token: String) -> Result<String, AppError> {
        let claims = self.jwt_service.verify_token(&refresh_token)?;
        
        // 사용자 확인
        let user = self.user_repo
            .find_by_id(claims.user_id)
            .await?
            .ok_or_else(|| AppError::Authentication("사용자를 찾을 수 없습니다".to_string()))?;

        // 새 access token 생성
        self.jwt_service.generate_access_token(user.id, &user.email)
    }
}

