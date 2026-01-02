use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GroupInvite {
    pub id: i64,
    pub group_id: i64,
    pub code: String,
    pub created_by: i64,
    pub expires_at: NaiveDateTime,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
}

