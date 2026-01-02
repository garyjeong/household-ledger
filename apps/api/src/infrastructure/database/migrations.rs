use sqlx::{MySqlPool, Pool, MySql};
use crate::errors::AppError;

pub async fn run_migrations(pool: &Pool<MySql>) -> Result<(), AppError> {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await
        .map_err(|e| AppError::Database(e))?;
    
    Ok(())
}

