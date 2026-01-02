use async_trait::async_trait;
use sqlx::MySqlPool;
use crate::domain::models::Group;
use crate::domain::repositories::GroupRepository;
use crate::errors::AppError;

pub struct GroupRepositoryImpl {
    pool: MySqlPool,
}

impl GroupRepositoryImpl {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl GroupRepository for GroupRepositoryImpl {
    async fn create(&self, group: &Group) -> Result<Group, AppError> {
        let result = sqlx::query!(
            r#"
            INSERT INTO groups (name, owner_id)
            VALUES (?, ?)
            "#,
            group.name,
            group.owner_id
        )
        .execute(&self.pool)
        .await?;

        let id = result.last_insert_id();
        self.find_by_id(id as i64).await?
            .ok_or_else(|| AppError::NotFound(format!("Group with id {} not found", id)))
    }

    async fn find_by_id(&self, id: i64) -> Result<Option<Group>, AppError> {
        let group = sqlx::query_as!(
            Group,
            r#"
            SELECT id, name, owner_id, created_at
            FROM groups
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(group)
    }

    async fn find_by_owner(&self, owner_id: i64) -> Result<Vec<Group>, AppError> {
        let groups = sqlx::query_as!(
            Group,
            r#"
            SELECT id, name, owner_id, created_at
            FROM groups
            WHERE owner_id = ?
            "#,
            owner_id
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(groups)
    }

    async fn update(&self, group: &Group) -> Result<Group, AppError> {
        sqlx::query!(
            r#"
            UPDATE groups
            SET name = ?, owner_id = ?
            WHERE id = ?
            "#,
            group.name,
            group.owner_id,
            group.id
        )
        .execute(&self.pool)
        .await?;

        self.find_by_id(group.id).await?
            .ok_or_else(|| AppError::NotFound(format!("Group with id {} not found", group.id)))
    }

    async fn delete(&self, id: i64) -> Result<(), AppError> {
        sqlx::query!("DELETE FROM groups WHERE id = ?", id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn has_members(&self, id: i64) -> Result<bool, AppError> {
        let count: i64 = sqlx::query_scalar!(
            r#"
            SELECT COUNT(*) as count
            FROM users
            WHERE group_id = ?
            "#,
            id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(count > 0)
    }
}

