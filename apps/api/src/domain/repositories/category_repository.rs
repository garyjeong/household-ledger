use async_trait::async_trait;
use crate::domain::models::{Category, TransactionType};
use crate::errors::AppError;

#[async_trait]
pub trait CategoryRepository: Send + Sync {
    async fn create(&self, category: &Category) -> Result<Category, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Category>, AppError>;
    async fn find_by_group(
        &self,
        group_id: Option<i64>,
        transaction_type: Option<TransactionType>,
    ) -> Result<Vec<Category>, AppError>;
    async fn find_by_creator(&self, created_by: i64) -> Result<Vec<Category>, AppError>;
    async fn update(&self, category: &Category) -> Result<Category, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
    async fn has_transactions(&self, id: i64) -> Result<bool, AppError>;
}

