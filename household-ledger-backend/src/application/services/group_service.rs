use crate::domain::models::Group;
use crate::domain::repositories::{GroupRepository, UserRepository};
use crate::errors::AppError;
use uuid::Uuid;

pub struct GroupService {
    group_repo: Box<dyn GroupRepository>,
    user_repo: Box<dyn UserRepository>,
}

impl GroupService {
    pub fn new(
        group_repo: Box<dyn GroupRepository>,
        user_repo: Box<dyn UserRepository>,
    ) -> Self {
        Self {
            group_repo,
            user_repo,
        }
    }

    pub async fn create_group(&self, name: String, owner_id: i64) -> Result<Group, AppError> {
        let group = Group {
            id: 0,
            name,
            owner_id,
            created_at: chrono::Utc::now().naive_utc(),
        };

        let created_group = self.group_repo.create(&group).await?;

        // 사용자의 group_id 업데이트
        let mut user = self.user_repo
            .find_by_id(owner_id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("User with id {} not found", owner_id)))?;
        
        user.group_id = Some(created_group.id);
        self.user_repo.update(&user).await?;

        Ok(created_group)
    }

    pub async fn get_group(&self, id: i64) -> Result<Group, AppError> {
        self.group_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Group with id {} not found", id)))
    }

    pub async fn generate_invite_code(&self, group_id: i64) -> Result<String, AppError> {
        // 10자리 영문+숫자 코드 생성
        let code = Uuid::new_v4()
            .to_string()
            .replace("-", "")
            .chars()
            .take(10)
            .collect::<String>()
            .to_uppercase();

        // TODO: GroupInviteRepository를 사용하여 초대 코드 저장

        Ok(code)
    }

    pub async fn delete_group(&self, id: i64) -> Result<(), AppError> {
        // 멤버가 있는지 확인
        if self.group_repo.has_members(id).await? {
            return Err(AppError::Validation("멤버가 있는 그룹은 삭제할 수 없습니다".to_string()));
        }

        self.group_repo.delete(id).await
    }
}

