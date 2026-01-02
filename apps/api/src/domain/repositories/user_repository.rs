use async_trait::async_trait;
use crate::domain::models::User;
use crate::errors::AppError;

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create(&self, user: &User) -> Result<User, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<User>, AppError>;
    async fn find_by_email(&self, email: &str) -> Result<Option<User>, AppError>;
    async fn update(&self, user: &User) -> Result<User, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
    async fn find_by_group_id(&self, group_id: i64) -> Result<Vec<User>, AppError>;
}

