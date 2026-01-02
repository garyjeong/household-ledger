use async_trait::async_trait;
use chrono::NaiveDate;
use crate::domain::models::ExchangeRate;
use crate::errors::AppError;

#[async_trait]
pub trait ExchangeRateRepository: Send + Sync {
    async fn create(&self, rate: &ExchangeRate) -> Result<ExchangeRate, AppError>;
    async fn find_by_currencies(
        &self,
        from_currency: &str,
        to_currency: &str,
        date: Option<NaiveDate>,
    ) -> Result<Option<ExchangeRate>, AppError>;
    async fn find_latest(
        &self,
        from_currency: &str,
        to_currency: &str,
    ) -> Result<Option<ExchangeRate>, AppError>;
    async fn update(&self, rate: &ExchangeRate) -> Result<ExchangeRate, AppError>;
}

