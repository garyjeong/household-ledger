use async_trait::async_trait;
use crate::domain::models::{Receipt, OcrStatus};
use crate::errors::AppError;

#[async_trait]
pub trait ReceiptRepository: Send + Sync {
    async fn create(&self, receipt: &Receipt) -> Result<Receipt, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Receipt>, AppError>;
    async fn find_by_user(&self, user_id: i64) -> Result<Vec<Receipt>, AppError>;
    async fn find_by_group(&self, group_id: i64) -> Result<Vec<Receipt>, AppError>;
    async fn find_by_status(&self, status: OcrStatus) -> Result<Vec<Receipt>, AppError>;
    async fn update(&self, receipt: &Receipt) -> Result<Receipt, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
}

