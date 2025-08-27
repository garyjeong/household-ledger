# Repository Setup Guide

이 문서는 GitHub repository의 CI/CD 파이프라인과 branch protection rules을 설정하는 방법을 설명합니다.

## 1. Branch Protection Rules 설정

### Main Branch Protection

Repository Settings > Branches > Add rule에서 다음 설정을 적용하세요:

**Branch name pattern:** `main`

**Protection Rules:**

- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (CODEOWNERS 파일 있는 경우)
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `quick-check` (PR Quick Check)
    - `quick-test` (PR Quick Check)
    - `build-check` (PR Quick Check)
    - `code-quality` (CI/CD Pipeline)
    - `test` (CI/CD Pipeline)
    - `build` (CI/CD Pipeline)
- ✅ Require conversation resolution before merging
- ✅ Require signed commits (선택사항)
- ✅ Require linear history
- ✅ Include administrators (권장)
- ✅ Restrict pushes that create files (선택사항)

### Develop Branch Protection (사용하는 경우)

**Branch name pattern:** `develop`

**Protection Rules:**

- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `quick-check`
    - `quick-test`
    - `build-check`

## 2. Repository Secrets 설정

Repository Settings > Secrets and variables > Actions에서 다음 secrets을 추가하세요:

### Required Secrets

```bash
# Vercel 배포 (필수)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Slack 알림 (선택사항)
SLACK_WEBHOOK=your_slack_webhook_url

# 보안 검사 (선택사항)
SNYK_TOKEN=your_snyk_token

# 데이터베이스 (프로덕션)
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
NEXTAUTH_URL=https://household-ledger.app
NEXTAUTH_SECRET=your_production_nextauth_secret
```

### Vercel Token 생성 방법

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. Settings > Tokens > Create Token
3. Token name: "GitHub Actions"
4. Scope: Full Account
5. Expiration: No expiration 또는 적절한 기간

### Slack Webhook 생성 방법

1. [Slack API](https://api.slack.com/apps) 접속
2. Create New App > From scratch
3. App name: "CI/CD Bot", Workspace 선택
4. Incoming Webhooks 활성화
5. Add New Webhook to Workspace
6. 채널 선택 (#dev-alerts, #deployments)

## 3. Environment 설정

Repository Settings > Environments에서 다음 환경을 생성하세요:

### Staging Environment

- **Environment name:** `staging`
- **Deployment branches:** Selected branches
  - `main` 브랜치만 허용
- **Environment secrets:**
  ```bash
  DATABASE_URL=staging_database_url
  NEXTAUTH_URL=https://staging.household-ledger.app
  ```

### Production Environment

- **Environment name:** `production`
- **Deployment branches:** Selected branches
  - `main` 브랜치와 `v*` 태그만 허용
- **Required reviewers:** 1명 이상 (중요)
- **Wait timer:** 0 minutes
- **Environment secrets:**
  ```bash
  DATABASE_URL=production_database_url
  NEXTAUTH_URL=https://household-ledger.app
  ```

## 4. Repository Settings

### General Settings

- **Default branch:** `main`
- **Template repository:** Disabled
- **Issues:** Enabled
- **Projects:** Enabled
- **Wiki:** Disabled
- **Discussions:** Disabled (선택사항)

### Pull Requests

- ✅ Allow merge commits
- ✅ Allow squash merging
- ❌ Allow rebase merging
- ✅ Always suggest updating pull request branches
- ✅ Allow auto-merge
- ✅ Automatically delete head branches

### Actions

- **Actions permissions:** Allow all actions and reusable workflows
- **Workflow permissions:** Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

## 5. CODEOWNERS 설정

`.github/CODEOWNERS` 파일이 이미 설정되어 있습니다. 다음 팀 멤버들을 GitHub에서 할당하세요:

### 필수 팀 설정

- `@lead-developer`: 프로젝트 리더
- `@frontend-team`: Frontend 개발자들
- `@backend-team`: Backend 개발자들
- `@devops-team`: DevOps 및 인프라 담당자들
- `@qa-team`: QA 및 테스트 담당자들
- `@docs-team`: 문서화 담당자들
- `@security-team`: 보안 담당자들
- `@dba-team`: 데이터베이스 관리자들

### 팀 멤버 추가 방법

1. Repository Settings > Manage access > Add people
2. 각 팀별로 GitHub Team을 생성
3. CODEOWNERS에서 정의된 팀명과 일치시키기

## 5.1. Pull Request 템플릿 설정

`.github/pull_request_template.md` 파일이 이미 설정되어 있습니다. 이 템플릿은:

### 포함된 기능

- ✅ 변경사항 요약 및 이슈 링크
- ✅ 변경 유형 체크리스트 (기능/버그수정/문서 등)
- ✅ 자동화 및 수동 테스트 체크리스트
- ✅ 코드 리뷰 가이드라인 (기능성, 품질, 보안, 성능)
- ✅ 배포 전 확인사항
- ✅ 스크린샷/데모 첨부 섹션

### 자동 적용 확인

새로운 PR 생성시 템플릿이 자동으로 적용되는지 확인하세요. 적용되지 않는다면:

1. `.github/pull_request_template.md` 파일 위치 확인
2. 파일 권한 및 인코딩 확인 (UTF-8)
3. Repository 새로고침 또는 캐시 클리어

## 6. Labels 설정

Repository Issues > Labels에서 다음 라벨들을 추가하세요:

```bash
# Priority
priority/critical
priority/high
priority/medium
priority/low

# Type
type/bug
type/feature
type/enhancement
type/documentation
type/refactor
type/security

# Status
status/blocked
status/in-review
status/needs-info
status/ready-to-merge

# Size
size/xs
size/s
size/m
size/l
size/xl
```

## 7. Workflow 권한 설정

각 워크플로우가 올바르게 작동하려면 다음 권한이 필요합니다:

### Repository Permissions

```yaml
# .github/workflows/에서 사용할 권한
permissions:
  contents: read
  pull-requests: write
  issues: write
  checks: write
  actions: read
  deployments: write
```

## 8. 알림 채널 설정

### Slack 채널 구성

```bash
#dev-alerts     # CI/CD 실패 알림
#deployments    # 배포 성공/실패 알림
#code-review    # PR 리뷰 요청
#releases       # 릴리즈 알림
```

### GitHub Notifications

Repository Settings > Notifications에서:

- ✅ Discussions
- ✅ Issues
- ✅ Pull requests
- ✅ Releases
- ✅ Actions

## 9. 문제 해결

### 일반적인 문제들

1. **Status checks not appearing**
   - 워크플로우가 한 번 실행된 후 나타남
   - 정확한 job 이름 확인 필요

2. **Secrets not working**
   - Secret 이름 대소문자 확인
   - Environment-specific secrets 우선순위 확인

3. **Vercel deployment failing**
   - Project ID와 Org ID 확인
   - Vercel token 권한 확인

4. **Permission denied errors**
   - Repository permissions 확인
   - Personal access token scope 확인

### 체크리스트

배포 전 다음 사항들을 확인하세요:

- [ ] Branch protection rules 설정됨
- [ ] Required status checks 구성됨
- [ ] Secrets 모두 추가됨
- [ ] Environments 설정됨
- [ ] Slack webhook 테스트됨
- [ ] Vercel 연동 테스트됨
- [ ] Health check API 작동 확인

---

설정 관련 질문이나 문제가 있으면 DevOps 팀에 문의하거나 이슈를 생성해 주세요.
