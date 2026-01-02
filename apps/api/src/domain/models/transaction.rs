use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "enum", rename_all = "UPPERCASE")]
pub enum TransactionType {
    Expense,
    Income,
    Transfer,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: i64,
    pub group_id: Option<i64>,
    pub owner_user_id: i64,
    #[sqlx(rename = "type")]
    pub transaction_type: TransactionType,
    pub date: NaiveDate,
    pub amount: i64,
    pub currency_code: Option<String>,
    pub original_amount: Option<i64>,
    pub category_id: Option<i64>,
    pub tag_id: Option<i64>,
    pub recurring_rule_id: Option<i64>,
    pub receipt_id: Option<i64>,
    pub merchant: Option<String>,
    pub memo: Option<String>,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
    #[sqlx(default)]
    pub updated_at: NaiveDateTime,
}

