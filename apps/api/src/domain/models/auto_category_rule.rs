use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "enum", rename_all = "UPPERCASE")]
pub enum PatternType {
    Keyword,
    Merchant,
    AmountRange,
    Regex,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AutoCategoryRule {
    pub id: i64,
    pub user_id: Option<i64>,
    pub group_id: Option<i64>,
    #[sqlx(rename = "pattern_type")]
    pub pattern_type: PatternType,
    pub pattern_value: String,
    pub category_id: i64,
    pub priority: i32,
    pub match_count: i32,
    pub success_count: i32,
    pub is_active: bool,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
    #[sqlx(default)]
    pub updated_at: NaiveDateTime,
}

