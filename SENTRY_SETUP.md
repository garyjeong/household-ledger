# Sentry 에러 모니터링 시스템 설정 가이드

이 문서는 우리가족가계부 프로젝트에 Sentry 에러 모니터링 시스템을 설정하는 방법을 설명합니다.

## 목차

1. [Sentry 프로젝트 생성](#sentry-프로젝트-생성)
2. [환경 변수 설정](#환경-변수-설정)
3. [기능 확인](#기능-확인)
4. [대시보드 활용](#대시보드-활용)
5. [문제 해결](#문제-해결)

## Sentry 프로젝트 생성

### 1. Sentry 계정 생성

1. [Sentry.io](https://sentry.io/)에 접속하여 계정을 생성합니다.
2. Organization을 생성하거나 기존 organization을 선택합니다.

### 2. 프로젝트 생성

1. Sentry 대시보드에서 "Create Project" 클릭
2. 플랫폼으로 **Next.js** 선택
3. 프로젝트 이름: `household-ledger` (또는 원하는 이름)
4. Team 할당 (선택사항)

### 3. DSN 및 설정 정보 획득

프로젝트 생성 후 다음 정보를 메모해 두세요:

- **DSN**: `https://[key]@[org].ingest.sentry.io/[project-id]`
- **Organization**: 조직 이름
- **Project**: 프로젝트 이름
- **Auth Token**: Settings > Auth Tokens에서 생성

## 환경 변수 설정

### 1. 로컬 개발 환경 (.env.local)

```bash
# Sentry 설정
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn-here"
SENTRY_ORG="your-sentry-organization"
SENTRY_PROJECT="your-sentry-project"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

### 2. GitHub Secrets 설정

Repository Settings > Secrets and variables > Actions에서 다음 secrets 추가:

```bash
SENTRY_ORG=your-sentry-organization
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### 3. Vercel 환경 변수 설정

Vercel 대시보드에서 프로젝트 설정에 환경 변수 추가:

**All Environments:**

- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN
- `SENTRY_ORG`: Organization 이름
- `SENTRY_PROJECT`: 프로젝트 이름
- `SENTRY_AUTH_TOKEN`: Auth token

## 기능 확인

### 1. 개발 환경에서 테스트

1. 개발 서버 실행: `pnpm run dev`
2. 브라우저에서 우측 하단의 "Sentry 테스트" 패널 확인
3. 각 테스트 버튼을 클릭하여 에러 전송 테스트:
   - **동기 에러 테스트**: 일반적인 JavaScript 에러
   - **비동기 에러 테스트**: Promise rejection 에러
   - **네트워크 에러 테스트**: API 호출 실패 에러
   - **Sentry 직접 테스트**: Sentry API 직접 호출
   - **성능 추적 테스트**: 성능 모니터링 테스트
   - **Sentry 상태 확인**: 콘솔에서 설정 상태 확인

### 2. 프로덕션 환경에서 확인

1. 배포 후 Sentry 대시보드에서 릴리즈 생성 확인
2. Source maps 업로드 상태 확인
3. 실제 에러 발생 시 제대로 수집되는지 확인

## 대시보드 활용

### 1. Issues 대시보드

- **에러 그룹화**: 유사한 에러들이 자동으로 그룹화됨
- **영향도 분석**: 사용자 수, 발생 빈도 등 분석
- **해결 상태 관리**: Assign, Resolve, Ignore 등으로 상태 관리

### 2. Performance 모니터링

- **트랜잭션 추적**: 페이지 로딩, API 호출 성능 추적
- **Web Vitals**: LCP, FID, CLS 등 핵심 성능 지표
- **사용자 경험**: 실제 사용자의 성능 경험 분석

### 3. Releases

- **배포 추적**: 각 배포 버전별 에러 발생 현황
- **회귀 분석**: 새 버전에서 발생한 새로운 에러 식별
- **코드 커밋 연결**: 에러와 관련된 코드 변경사항 추적

### 4. 알림 설정

1. **Slack 연동**: Sentry 알림을 Slack 채널로 전송
2. **이메일 알림**: 중요한 에러 발생 시 이메일 알림
3. **알림 규칙**: 에러 빈도, 심각도에 따른 알림 규칙 설정

## 에러 분류 및 처리

### 1. 자동 에러 분류

현재 시스템은 다음과 같이 에러를 자동 분류합니다:

- **Critical**: 애플리케이션 전체 중단 (fatal level)
- **High**: 페이지 수준 에러 (error level)
- **Medium**: 컴포넌트 수준 에러 (warning level)
- **Low**: 일반적인 정보성 에러 (info level)

### 2. 민감 정보 필터링

다음 정보들은 자동으로 필터링됩니다:

- 비밀번호, 토큰, 시크릿 키
- 이메일 주소 (일부 마스킹)
- 로컬/세션 스토리지 내용
- 인증 헤더 정보
- 데이터베이스 연결 정보

### 3. 무시할 에러 패턴

다음 에러들은 자동으로 무시됩니다:

- 네트워크 연결 에러 (일시적)
- 브라우저 확장 프로그램 에러
- 개발 중 흔한 에러들 (ChunkLoadError 등)
- 취소된 요청 에러

## 문제 해결

### 1. Sentry가 초기화되지 않는 경우

**확인 사항:**

- DSN이 올바르게 설정되었는지 확인
- 환경 변수가 NEXT*PUBLIC* 접두사를 포함하는지 확인
- 브라우저 개발자 도구 콘솔에서 Sentry 에러 메시지 확인

**해결 방법:**

```bash
# 개발자 도구 콘솔에서 실행
console.log(process.env.NEXT_PUBLIC_SENTRY_DSN)
```

### 2. Source Maps가 업로드되지 않는 경우

**확인 사항:**

- `SENTRY_AUTH_TOKEN`이 올바르게 설정되었는지 확인
- Token에 `project:releases` 권한이 있는지 확인
- 빌드 과정에서 에러가 없는지 확인

**해결 방법:**

```bash
# 수동으로 source maps 업로드 테스트
npx @sentry/cli releases files [version] upload-sourcemaps .next/static
```

### 3. 에러가 수집되지 않는 경우

**확인 사항:**

- 에러가 `ignoreErrors` 패턴에 해당하지 않는지 확인
- `beforeSend` 함수에서 필터링되지 않는지 확인
- 네트워크 연결 상태 확인

**해결 방법:**

```javascript
// 강제로 에러 전송 테스트
Sentry.captureMessage('Test message', 'info')
```

### 4. 성능 모니터링이 작동하지 않는 경우

**확인 사항:**

- `tracesSampleRate`가 0보다 큰지 확인
- 성능 모니터링이 활성화되어 있는지 확인
- 사용량 한도에 도달하지 않았는지 확인

## 모니터링 지표

### 1. 핵심 지표

- **에러율**: 전체 요청 대비 에러 발생률
- **응답 시간**: API 응답 시간 및 페이지 로딩 시간
- **사용자 영향도**: 에러 영향을 받은 사용자 수
- **에러 빈도**: 시간당/일당 에러 발생 빈도

### 2. 알림 기준

- **즉시 알림**: Critical 에러, 에러율 10% 이상
- **일간 리포트**: 전체 에러 요약, 신규 에러 발생
- **주간 리포트**: 트렌드 분석, 개선사항 제안

## 팀 워크플로우

### 1. 에러 처리 프로세스

1. **탐지**: Sentry에서 에러 자동 탐지
2. **분류**: 심각도 및 영향도에 따른 우선순위 설정
3. **할당**: 담당자 지정 및 이슈 생성
4. **해결**: 버그 수정 및 테스트
5. **배포**: 수정사항 배포 및 모니터링
6. **확인**: 에러 해결 상태 확인 및 Resolve

### 2. 릴리즈 관리

- **사전 배포**: 스테이징 환경에서 에러 모니터링
- **배포 후**: 프로덕션 환경 에러 모니터링 강화
- **회귀 분석**: 새 버전에서 발생한 에러 분석
- **롤백 결정**: 심각한 에러 발생 시 롤백 여부 결정

---

## 추가 리소스

- [Sentry Next.js 공식 문서](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Error Monitoring Best Practices](https://docs.sentry.io/product/error-monitoring/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)

문제가 발생하거나 추가 설정이 필요한 경우, 개발팀에 문의하거나 이슈를 생성해 주세요.
