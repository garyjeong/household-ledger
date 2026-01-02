use axum::{
    extract::{Path, Query, State},
    response::Json,
    routing::{get, post, put, delete, Router},
};
use crate::AppState;
use crate::schemas::transaction::{TransactionCreateRequest, TransactionResponse};
use crate::errors::AppError;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_transactions).post(create_transaction))
        .route("/:id", get(get_transaction).put(update_transaction).delete(delete_transaction))
}

async fn list_transactions(
    State(_state): State<AppState>,
    Query(_params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<TransactionResponse>>, AppError> {
    // TODO: 구현
    Ok(Json(vec![]))
}

async fn create_transaction(
    State(_state): State<AppState>,
    Json(_payload): Json<TransactionCreateRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // TODO: 구현
    Err(AppError::Internal("Not implemented yet".to_string()))
}

async fn get_transaction(
    State(_state): State<AppState>,
    Path(_id): Path<i64>,
) -> Result<Json<TransactionResponse>, AppError> {
    // TODO: 구현
    Err(AppError::Internal("Not implemented yet".to_string()))
}

async fn update_transaction(
    State(_state): State<AppState>,
    Path(_id): Path<i64>,
    Json(_payload): Json<TransactionCreateRequest>,
) -> Result<Json<TransactionResponse>, AppError> {
    // TODO: 구현
    Err(AppError::Internal("Not implemented yet".to_string()))
}

async fn delete_transaction(
    State(_state): State<AppState>,
    Path(_id): Path<i64>,
) -> Result<(), AppError> {
    // TODO: 구현
    Err(AppError::Internal("Not implemented yet".to_string()))
}

