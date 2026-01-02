use sqlx::{MySqlPool, Pool, MySql};
use crate::errors::AppError;

pub async fn create_pool(database_url: &str) -> Result<Pool<MySql>, AppError> {
    let pool = MySqlPool::connect(database_url)
        .await
        .map_err(|e| AppError::Database(e))?;
    
    Ok(pool)
}

