use crate::domain::models::Transaction;
use crate::domain::repositories::TransactionRepository;
use crate::errors::AppError;

pub struct TransactionService {
    transaction_repo: Box<dyn TransactionRepository>,
}

impl TransactionService {
    pub fn new(transaction_repo: Box<dyn TransactionRepository>) -> Self {
        Self { transaction_repo }
    }

    pub async fn create_transaction(
        &self,
        transaction: Transaction,
    ) -> Result<Transaction, AppError> {
        // 비즈니스 로직: 검증
        if transaction.amount <= 0 {
            return Err(AppError::Validation("거래 금액은 양수여야 합니다".to_string()));
        }

        self.transaction_repo.create(&transaction).await
    }

    pub async fn get_transaction(&self, id: i64) -> Result<Transaction, AppError> {
        self.transaction_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Transaction with id {} not found", id)))
    }

    pub async fn update_transaction(
        &self,
        transaction: Transaction,
    ) -> Result<Transaction, AppError> {
        if transaction.amount <= 0 {
            return Err(AppError::Validation("거래 금액은 양수여야 합니다".to_string()));
        }

        self.transaction_repo.update(&transaction).await
    }

    pub async fn delete_transaction(&self, id: i64) -> Result<(), AppError> {
        self.transaction_repo.delete(id).await
    }

    pub async fn list_transactions(
        &self,
        group_id: Option<i64>,
        start_date: Option<chrono::NaiveDate>,
        end_date: Option<chrono::NaiveDate>,
        category_id: Option<i64>,
        search: Option<String>,
        limit: u32,
        offset: u32,
    ) -> Result<Vec<Transaction>, AppError> {
        self.transaction_repo
            .find_by_group(
                group_id,
                start_date,
                end_date,
                category_id,
                search.as_deref(),
                limit,
                offset,
            )
            .await
    }
}

