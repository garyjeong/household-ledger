use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Group {
    pub id: i64,
    pub name: String,
    pub owner_id: i64,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
}

