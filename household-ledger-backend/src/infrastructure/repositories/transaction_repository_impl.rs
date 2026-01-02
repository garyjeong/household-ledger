use async_trait::async_trait;
use chrono::NaiveDate;
use sqlx::MySqlPool;
use crate::domain::models::Transaction;
use crate::domain::repositories::TransactionRepository;
use crate::errors::AppError;

pub struct TransactionRepositoryImpl {
    pool: MySqlPool,
}

impl TransactionRepositoryImpl {
    pub fn new(pool: MySqlPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TransactionRepository for TransactionRepositoryImpl {
    async fn create(&self, transaction: &Transaction) -> Result<Transaction, AppError> {
        let result = sqlx::query!(
            r#"
            INSERT INTO transactions (
                group_id, owner_user_id, type, date, amount, currency_code, original_amount,
                category_id, tag_id, recurring_rule_id, receipt_id, merchant, memo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            transaction.group_id,
            transaction.owner_user_id,
            transaction.transaction_type,
            transaction.date,
            transaction.amount,
            transaction.currency_code,
            transaction.original_amount,
            transaction.category_id,
            transaction.tag_id,
            transaction.recurring_rule_id,
            transaction.receipt_id,
            transaction.merchant,
            transaction.memo
        )
        .execute(&self.pool)
        .await?;

        let id = result.last_insert_id();
        self.find_by_id(id as i64).await?
            .ok_or_else(|| AppError::NotFound(format!("Transaction with id {} not found", id)))
    }

    async fn find_by_id(&self, id: i64) -> Result<Option<Transaction>, AppError> {
        let transaction = sqlx::query_as!(
            Transaction,
            r#"
            SELECT 
                id, group_id, owner_user_id, type as `type: _`, date, amount, currency_code,
                original_amount, category_id, tag_id, recurring_rule_id, receipt_id,
                merchant, memo, created_at, updated_at
            FROM transactions
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(transaction)
    }

    async fn find_by_group(
        &self,
        group_id: Option<i64>,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
        category_id: Option<i64>,
        search: Option<&str>,
        limit: u32,
        offset: u32,
    ) -> Result<Vec<Transaction>, AppError> {
        let mut query = String::from(
            r#"
            SELECT 
                id, group_id, owner_user_id, type as `type: _`, date, amount, currency_code,
                original_amount, category_id, tag_id, recurring_rule_id, receipt_id,
                merchant, memo, created_at, updated_at
            FROM transactions
            WHERE 1=1
            "#
        );

        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::MySql> + Send + Sync>> = vec![];

        if let Some(gid) = group_id {
            query.push_str(" AND group_id = ?");
            params.push(Box::new(gid));
        }

        if let Some(sd) = start_date {
            query.push_str(" AND date >= ?");
            params.push(Box::new(sd));
        }

        if let Some(ed) = end_date {
            query.push_str(" AND date <= ?");
            params.push(Box::new(ed));
        }

        if let Some(cid) = category_id {
            query.push_str(" AND category_id = ?");
            params.push(Box::new(cid));
        }

        if let Some(s) = search {
            query.push_str(" AND (merchant LIKE ? OR memo LIKE ?)");
            let search_pattern = format!("%{}%", s);
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern));
        }

        query.push_str(" ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?");
        params.push(Box::new(limit));
        params.push(Box::new(offset));

        // SQLx의 동적 쿼리는 복잡하므로, 간단한 방법으로 구현
        let transactions = if group_id.is_some() || start_date.is_some() || end_date.is_some() || category_id.is_some() || search.is_some() {
            // 복잡한 쿼리는 나중에 최적화
            sqlx::query_as!(
                Transaction,
                r#"
                SELECT 
                    id, group_id, owner_user_id, type as `type: _`, date, amount, currency_code,
                    original_amount, category_id, tag_id, recurring_rule_id, receipt_id,
                    merchant, memo, created_at, updated_at
                FROM transactions
                WHERE (? IS NULL OR group_id = ?)
                  AND (? IS NULL OR date >= ?)
                  AND (? IS NULL OR date <= ?)
                  AND (? IS NULL OR category_id = ?)
                  AND (? IS NULL OR merchant LIKE ? OR memo LIKE ?)
                ORDER BY date DESC, created_at DESC
                LIMIT ? OFFSET ?
                "#,
                group_id, group_id,
                start_date, start_date,
                end_date, end_date,
                category_id, category_id,
                search, search, search,
                limit, offset
            )
            .fetch_all(&self.pool)
            .await?
        } else {
            sqlx::query_as!(
                Transaction,
                r#"
                SELECT 
                    id, group_id, owner_user_id, type as `type: _`, date, amount, currency_code,
                    original_amount, category_id, tag_id, recurring_rule_id, receipt_id,
                    merchant, memo, created_at, updated_at
                FROM transactions
                ORDER BY date DESC, created_at DESC
                LIMIT ? OFFSET ?
                "#,
                limit, offset
            )
            .fetch_all(&self.pool)
            .await?
        };

        Ok(transactions)
    }

    async fn find_by_owner(
        &self,
        owner_user_id: i64,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
        limit: u32,
        offset: u32,
    ) -> Result<Vec<Transaction>, AppError> {
        let transactions = sqlx::query_as!(
            Transaction,
            r#"
            SELECT 
                id, group_id, owner_user_id, type as `type: _`, date, amount, currency_code,
                original_amount, category_id, tag_id, recurring_rule_id, receipt_id,
                merchant, memo, created_at, updated_at
            FROM transactions
            WHERE owner_user_id = ?
              AND (? IS NULL OR date >= ?)
              AND (? IS NULL OR date <= ?)
            ORDER BY date DESC, created_at DESC
            LIMIT ? OFFSET ?
            "#,
            owner_user_id,
            start_date, start_date,
            end_date, end_date,
            limit, offset
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(transactions)
    }

    async fn update(&self, transaction: &Transaction) -> Result<Transaction, AppError> {
        sqlx::query!(
            r#"
            UPDATE transactions
            SET group_id = ?, owner_user_id = ?, type = ?, date = ?, amount = ?,
                currency_code = ?, original_amount = ?, category_id = ?, tag_id = ?,
                recurring_rule_id = ?, receipt_id = ?, merchant = ?, memo = ?
            WHERE id = ?
            "#,
            transaction.group_id,
            transaction.owner_user_id,
            transaction.transaction_type,
            transaction.date,
            transaction.amount,
            transaction.currency_code,
            transaction.original_amount,
            transaction.category_id,
            transaction.tag_id,
            transaction.recurring_rule_id,
            transaction.receipt_id,
            transaction.merchant,
            transaction.memo,
            transaction.id
        )
        .execute(&self.pool)
        .await?;

        self.find_by_id(transaction.id).await?
            .ok_or_else(|| AppError::NotFound(format!("Transaction with id {} not found", transaction.id)))
    }

    async fn delete(&self, id: i64) -> Result<(), AppError> {
        sqlx::query!("DELETE FROM transactions WHERE id = ?", id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn count_by_group(
        &self,
        group_id: Option<i64>,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
    ) -> Result<i64, AppError> {
        let count: i64 = sqlx::query_scalar!(
            r#"
            SELECT COUNT(*) as count
            FROM transactions
            WHERE (? IS NULL OR group_id = ?)
              AND (? IS NULL OR date >= ?)
              AND (? IS NULL OR date <= ?)
            "#,
            group_id, group_id,
            start_date, start_date,
            end_date, end_date
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(count)
    }
}

