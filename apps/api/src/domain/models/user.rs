use chrono::{NaiveDateTime, DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub password_hash: String,
    pub nickname: String,
    pub avatar_url: Option<String>,
    pub group_id: Option<i64>,
    pub default_currency: Option<String>,
    pub settings: Option<serde_json::Value>,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
}

