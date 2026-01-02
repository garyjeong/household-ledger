pub mod auth;
pub mod transactions;

use axum::Router;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/auth", auth::router())
        .nest("/transactions", transactions::router())
}


