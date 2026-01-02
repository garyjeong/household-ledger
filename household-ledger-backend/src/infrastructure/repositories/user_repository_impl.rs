use async_trait::async_trait;
use sqlx::MySqlPool;
use crate::domain::models::User;
use crate::domain::repositories::UserRepository;
use crate::errors::AppError;

pub struct UserRepositoryImpl {
    pool: MySqlPool,
}

impl UserRepositoryImpl {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for UserRepositoryImpl {
    async fn create(&self, user: &User) -> Result<User, AppError> {
        let result = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (email, password_hash, nickname, avatar_url, group_id, default_currency, settings)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
            user.email,
            user.password_hash,
            user.nickname,
            user.avatar_url,
            user.group_id,
            user.default_currency,
            user.settings
        )
        .execute(&self.pool)
        .await?;

        let id = result.last_insert_id();
        self.find_by_id(id as i64).await?
            .ok_or_else(|| AppError::NotFound(format!("User with id {} not found", id)))
    }

    async fn find_by_id(&self, id: i64) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, password_hash, nickname, avatar_url, group_id, default_currency, settings, created_at
            FROM users
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    async fn find_by_email(&self, email: &str) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, password_hash, nickname, avatar_url, group_id, default_currency, settings, created_at
            FROM users
            WHERE email = ?
            "#,
            email
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    async fn update(&self, user: &User) -> Result<User, AppError> {
        sqlx::query!(
            r#"
            UPDATE users
            SET email = ?, password_hash = ?, nickname = ?, avatar_url = ?, group_id = ?, default_currency = ?, settings = ?
            WHERE id = ?
            "#,
            user.email,
            user.password_hash,
            user.nickname,
            user.avatar_url,
            user.group_id,
            user.default_currency,
            user.settings,
            user.id
        )
        .execute(&self.pool)
        .await?;

        self.find_by_id(user.id).await?
            .ok_or_else(|| AppError::NotFound(format!("User with id {} not found", user.id)))
    }

    async fn delete(&self, id: i64) -> Result<(), AppError> {
        sqlx::query!("DELETE FROM users WHERE id = ?", id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn find_by_group_id(&self, group_id: i64) -> Result<Vec<User>, AppError> {
        let users = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, password_hash, nickname, avatar_url, group_id, default_currency, settings, created_at
            FROM users
            WHERE group_id = ?
            "#,
            group_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(users)
    }
}

