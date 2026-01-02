use async_trait::async_trait;
use crate::domain::models::GroupInvite;
use crate::errors::AppError;

#[async_trait]
pub trait GroupInviteRepository: Send + Sync {
    async fn create(&self, invite: &GroupInvite) -> Result<GroupInvite, AppError>;
    async fn find_by_code(&self, code: &str) -> Result<Option<GroupInvite>, AppError>;
    async fn find_by_group(&self, group_id: i64) -> Result<Vec<GroupInvite>, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
    async fn delete_expired(&self) -> Result<u64, AppError>;
}

