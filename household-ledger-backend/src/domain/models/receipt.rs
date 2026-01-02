use chrono::{NaiveDate, NaiveDateTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "enum", rename_all = "UPPERCASE")]
pub enum OcrStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Receipt {
    pub id: i64,
    pub transaction_id: Option<i64>,
    pub user_id: i64,
    pub group_id: Option<i64>,
    pub image_url: String,
    pub ocr_result: Option<serde_json::Value>,
    #[sqlx(rename = "ocr_status")]
    pub ocr_status: OcrStatus,
    pub extracted_amount: Option<i64>,
    pub extracted_date: Option<NaiveDate>,
    pub extracted_merchant: Option<String>,
    pub extracted_items: Option<serde_json::Value>,
    pub confidence_score: Option<rust_decimal::Decimal>,
    pub verified: bool,
    #[sqlx(default)]
    pub created_at: NaiveDateTime,
    #[sqlx(default)]
    pub updated_at: NaiveDateTime,
}

