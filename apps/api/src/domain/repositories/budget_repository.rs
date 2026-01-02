use async_trait::async_trait;
use crate::domain::models::{Budget, OwnerType};
use crate::errors::AppError;

#[async_trait]
pub trait BudgetRepository: Send + Sync {
    async fn create(&self, budget: &Budget) -> Result<Budget, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Budget>, AppError>;
    async fn find_by_owner(
        &self,
        owner_type: OwnerType,
        owner_id: i64,
        period: Option<&str>,
    ) -> Result<Vec<Budget>, AppError>;
    async fn update(&self, budget: &Budget) -> Result<Budget, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
}

