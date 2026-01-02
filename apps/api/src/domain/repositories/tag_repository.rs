use async_trait::async_trait;
use crate::domain::models::Tag;
use crate::errors::AppError;

#[async_trait]
pub trait TagRepository: Send + Sync {
    async fn create(&self, tag: &Tag) -> Result<Tag, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Tag>, AppError>;
    async fn find_by_group(&self, group_id: Option<i64>) -> Result<Vec<Tag>, AppError>;
    async fn find_by_creator(&self, created_by: i64) -> Result<Vec<Tag>, AppError>;
    async fn update(&self, tag: &Tag) -> Result<Tag, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
}

