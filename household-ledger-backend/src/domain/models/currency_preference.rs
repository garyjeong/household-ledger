use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CurrencyPreference {
    pub id: i64,
    pub user_id: i64,
    pub group_id: Option<i64>,
    pub base_currency: String,
    pub display_currency: Option<String>,
    pub auto_convert: bool,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
    #[sqlx(default)]
    pub updated_at: NaiveDateTime,
}

