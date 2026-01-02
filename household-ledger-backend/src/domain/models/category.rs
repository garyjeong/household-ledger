use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use super::transaction::TransactionType;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: i64,
    pub group_id: Option<i64>,
    pub created_by: i64,
    pub name: String,
    #[sqlx(rename = "type")]
    pub transaction_type: TransactionType,
    pub color: Option<String>,
    pub is_default: bool,
    pub budget_amount: Option<i64>,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
    #[sqlx(default)]
    pub updated_at: NaiveDateTime,
}

