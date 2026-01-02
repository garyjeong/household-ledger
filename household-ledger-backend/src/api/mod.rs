pub mod health;
pub mod middleware;
pub mod v2;

use axum::Router;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/api/v2", v2::router())
}

