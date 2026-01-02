use serde::{Deserialize, Serialize};
use validator::Validate;
use crate::domain::models::TransactionType;

#[derive(Debug, Deserialize, Validate)]
pub struct TransactionCreateRequest {
    pub group_id: Option<i64>,
    #[validate(range(min = 1))]
    pub amount: i64,
    pub currency_code: Option<String>,
    pub original_amount: Option<i64>,
    pub category_id: Option<i64>,
    pub tag_id: Option<i64>,
    pub merchant: Option<String>,
    #[validate(length(max = 1000))]
    pub memo: Option<String>,
    pub transaction_type: TransactionType,
    pub date: chrono::NaiveDate,
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub id: i64,
    pub group_id: Option<i64>,
    pub owner_user_id: i64,
    pub transaction_type: TransactionType,
    pub date: chrono::NaiveDate,
    pub amount: i64,
    pub currency_code: Option<String>,
    pub original_amount: Option<i64>,
    pub category_id: Option<i64>,
    pub tag_id: Option<i64>,
    pub merchant: Option<String>,
    pub memo: Option<String>,
}

impl From<crate::domain::models::Transaction> for TransactionResponse {
    fn from(tx: crate::domain::models::Transaction) -> Self {
        Self {
            id: tx.id,
            group_id: tx.group_id,
            owner_user_id: tx.owner_user_id,
            transaction_type: tx.transaction_type,
            date: tx.date,
            amount: tx.amount,
            currency_code: tx.currency_code,
            original_amount: tx.original_amount,
            category_id: tx.category_id,
            tag_id: tx.tag_id,
            merchant: tx.merchant,
            memo: tx.memo,
        }
    }
}

