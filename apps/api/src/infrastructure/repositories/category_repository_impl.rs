use async_trait::async_trait;
use sqlx::MySqlPool;
use crate::domain::models::{Category, TransactionType};
use crate::domain::repositories::CategoryRepository;
use crate::errors::AppError;

pub struct CategoryRepositoryImpl {
    pool: MySqlPool,
}

impl CategoryRepositoryImpl {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl CategoryRepository for CategoryRepositoryImpl {
    async fn create(&self, category: &Category) -> Result<Category, AppError> {
        let result = sqlx::query!(
            r#"
            INSERT INTO categories (group_id, created_by, name, type, color, is_default, budget_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
            category.group_id,
            category.created_by,
            category.name,
            category.transaction_type as u8,
            category.color,
            category.is_default,
            category.budget_amount
        )
        .execute(&self.pool)
        .await?;

        let id = result.last_insert_id();
        self.find_by_id(id as i64).await?
            .ok_or_else(|| AppError::NotFound(format!("Category with id {} not found", id)))
    }

    async fn find_by_id(&self, id: i64) -> Result<Option<Category>, AppError> {
        let category = sqlx::query_as!(
            Category,
            r#"
            SELECT id, group_id, created_by, name, type as `type: _`, color, is_default, budget_amount, created_at, updated_at
            FROM categories
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(category)
    }

    async fn find_by_group(
        &self,
        group_id: Option<i64>,
        transaction_type: Option<TransactionType>,
    ) -> Result<Vec<Category>, AppError> {
        let categories = sqlx::query_as!(
            Category,
            r#"
            SELECT id, group_id, created_by, name, type as `type: _`, color, is_default, budget_amount, created_at, updated_at
            FROM categories
            WHERE (? IS NULL OR group_id = ?)
              AND (? IS NULL OR type = ?)
            ORDER BY name
            "#,
            group_id, group_id,
            transaction_type, transaction_type
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(categories)
    }

    async fn find_by_creator(&self, created_by: i64) -> Result<Vec<Category>, AppError> {
        let categories = sqlx::query_as!(
            Category,
            r#"
            SELECT id, group_id, created_by, name, type as `type: _`, color, is_default, budget_amount, created_at, updated_at
            FROM categories
            WHERE created_by = ?
            ORDER BY name
            "#,
            created_by
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(categories)
    }

    async fn update(&self, category: &Category) -> Result<Category, AppError> {
        sqlx::query!(
            r#"
            UPDATE categories
            SET group_id = ?, created_by = ?, name = ?, type = ?, color = ?, is_default = ?, budget_amount = ?
            WHERE id = ?
            "#,
            category.group_id,
            category.created_by,
            category.name,
            category.transaction_type as u8,
            category.color,
            category.is_default,
            category.budget_amount,
            category.id
        )
        .execute(&self.pool)
        .await?;

        self.find_by_id(category.id).await?
            .ok_or_else(|| AppError::NotFound(format!("Category with id {} not found", category.id)))
    }

    async fn delete(&self, id: i64) -> Result<(), AppError> {
        sqlx::query!("DELETE FROM categories WHERE id = ?", id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn has_transactions(&self, id: i64) -> Result<bool, AppError> {
        let count: i64 = sqlx::query_scalar!(
            r#"
            SELECT COUNT(*) as count
            FROM transactions
            WHERE category_id = ?
            "#,
            id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(count > 0)
    }
}

