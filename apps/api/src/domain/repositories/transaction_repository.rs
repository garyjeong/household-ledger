use async_trait::async_trait;
use chrono::NaiveDate;
use crate::domain::models::Transaction;
use crate::errors::AppError;

#[async_trait]
pub trait TransactionRepository: Send + Sync {
    async fn create(&self, transaction: &Transaction) -> Result<Transaction, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Transaction>, AppError>;
    async fn find_by_group(
        &self,
        group_id: Option<i64>,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
        category_id: Option<i64>,
        search: Option<&str>,
        limit: u32,
        offset: u32,
    ) -> Result<Vec<Transaction>, AppError>;
    async fn find_by_owner(
        &self,
        owner_user_id: i64,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
        limit: u32,
        offset: u32,
    ) -> Result<Vec<Transaction>, AppError>;
    async fn update(&self, transaction: &Transaction) -> Result<Transaction, AppError>;
    async fn delete(&self, id: i64) -> Result<(), AppError>;
    async fn count_by_group(
        &self,
        group_id: Option<i64>,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
    ) -> Result<i64, AppError>;
}

