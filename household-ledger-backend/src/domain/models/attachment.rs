use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Attachment {
    pub id: i64,
    pub transaction_id: i64,
    pub file_url: String,
    pub mime: Option<String>,
    pub size: Option<i32>,
}

