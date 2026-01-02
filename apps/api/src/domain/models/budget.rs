use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "enum", rename_all = "UPPERCASE")]
pub enum OwnerType {
    User,
    Group,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "enum", rename_all = "UPPERCASE")]
pub enum BudgetStatus {
    Active,
    Closed,
    Draft,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Budget {
    pub id: i64,
    #[sqlx(rename = "owner_type")]
    pub owner_type: OwnerType,
    pub owner_id: i64,
    pub period: String,
    pub total_amount: i64,
    #[sqlx(rename = "status")]
    pub budget_status: BudgetStatus,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
    #[sqlx(default)]
    pub updated_at: NaiveDateTime,
}

