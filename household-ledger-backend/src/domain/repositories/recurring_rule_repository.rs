use async_trait::async_trait;
use crate::domain::models::RecurringRule;
use crate::errors::AppError;

#[async_trait]
pub trait RecurringRuleRepository: Send + Sync {
    async fn create(&self, rule: &RecurringRule) -> Result<RecurringRule, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<RecurringRule>, AppError>;
    async fn find_by_group(&self, group_id: Option<i64>) -> Result<Vec<RecurringRule>, AppError>;
    async fn find_by_creator(&self, created_by: i64) -> Result<Vec<RecurringRule>, AppError>;
    async fn find_active(&self) -> Result<Vec<RecurringRule>, AppError>;
    async fn update(&self, rule: &RecurringRule) -> Result<RecurringRule, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
}

