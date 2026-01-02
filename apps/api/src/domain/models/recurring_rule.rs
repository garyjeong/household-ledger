use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "enum", rename_all = "UPPERCASE")]
pub enum RecurringFrequency {
    Monthly,
    Weekly,
    Daily,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RecurringRule {
    pub id: i64,
    pub group_id: Option<i64>,
    pub created_by: i64,
    pub start_date: NaiveDate,
    #[sqlx(rename = "frequency")]
    pub recurring_frequency: RecurringFrequency,
    pub day_rule: String,
    pub amount: i64,
    pub category_id: Option<i64>,
    pub merchant: Option<String>,
    pub memo: Option<String>,
    pub is_active: bool,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
    #[sqlx(default)]
    pub updated_at: NaiveDateTime,
}

