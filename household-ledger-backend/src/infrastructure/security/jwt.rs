use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use crate::errors::AppError;

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

    pub fn generate_access_token(&self, user_id: i64, email: &str) -> Result<String, AppError> {
        let exp = (chrono::Utc::now() + chrono::Duration::minutes(15)).timestamp() as usize;
        let claims = Claims {
            user_id,
            email: email.to_string(),
            exp,
        };
        encode(&Header::new(Algorithm::HS256), &claims, &self.encoding_key)
            .map_err(|e| AppError::Jwt(format!("Failed to encode token: {}", e)))
    }

    pub fn generate_refresh_token(&self, user_id: i64, email: &str) -> Result<String, AppError> {
        let exp = (chrono::Utc::now() + chrono::Duration::days(7)).timestamp() as usize;
        let claims = Claims {
            user_id,
            email: email.to_string(),
            exp,
        };
        encode(&Header::new(Algorithm::HS256), &claims, &self.encoding_key)
            .map_err(|e| AppError::Jwt(format!("Failed to encode refresh token: {}", e)))
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, AppError> {
        let token_data = decode::<Claims>(
            token,
            &self.decoding_key,
            &Validation::new(Algorithm::HS256),
        )
        .map_err(|e| AppError::Jwt(format!("Failed to decode token: {}", e)))?;
        Ok(token_data.claims)
    }
}

