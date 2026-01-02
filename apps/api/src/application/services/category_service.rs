use crate::domain::models::{Category, TransactionType};
use crate::domain::repositories::CategoryRepository;
use crate::errors::AppError;

pub struct CategoryService {
    category_repo: Box<dyn CategoryRepository>,
}

impl CategoryService {
    pub fn new(category_repo: Box<dyn CategoryRepository>) -> Self {
        Self { category_repo }
    }

    pub async fn create_category(&self, category: Category) -> Result<Category, AppError> {
        self.category_repo.create(&category).await
    }

    pub async fn get_category(&self, id: i64) -> Result<Category, AppError> {
        self.category_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Category with id {} not found", id)))
    }

    pub async fn list_categories(
        &self,
        group_id: Option<i64>,
        transaction_type: Option<TransactionType>,
    ) -> Result<Vec<Category>, AppError> {
        self.category_repo.find_by_group(group_id, transaction_type).await
    }

    pub async fn update_category(&self, category: Category) -> Result<Category, AppError> {
        self.category_repo.update(&category).await
    }

    pub async fn delete_category(&self, id: i64) -> Result<(), AppError> {
        // 거래가 있는지 확인
        if self.category_repo.has_transactions(id).await? {
            return Err(AppError::Validation("거래가 연결된 카테고리는 삭제할 수 없습니다".to_string()));
        }

        self.category_repo.delete(id).await
    }
}

