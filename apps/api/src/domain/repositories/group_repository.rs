use async_trait::async_trait;
use crate::domain::models::Group;
use crate::errors::AppError;

#[async_trait]
pub trait GroupRepository: Send + Sync {
    async fn create(&self, group: &Group) -> Result<Group, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Group>, AppError>;
    async fn find_by_owner(&self, owner_id: i64) -> Result<Vec<Group>, AppError>;
    async fn update(&self, group: &Group) -> Result<Group, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
    async fn has_members(&self, id: i64) -> Result<bool, AppError>;
}

