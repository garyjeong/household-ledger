use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Tag {
    pub id: i64,
    pub group_id: Option<i64>,
    pub created_by: i64,
    pub name: String,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
    #[sqlx(default)]
    pub updated_at: NaiveDateTime,
}

