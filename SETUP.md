# ⚙️ 설정 & 보안 가이드

프로젝트 설정, 보안, 모니터링 통합 가이드입니다.

---

## 📋 목차

1. [환경 설정](#-환경-설정)
2. [Sentry 모니터링 설정](#-sentry-모니터링-설정)
3. [보안 가이드라인](#-보안-가이드라인)
4. [배포 환경 설정](#-배포-환경-설정)
5. [보안 점검 자동화](#-보안-점검-자동화)

---

## 🛠 환경 설정

### 필수 환경변수

```bash
# .env.local 설정
cp .env.example .env.local

# 데이터베이스 (2025.09.06 검증 완료)
DATABASE_URL="mysql://root:wjdwhdans@localhost:3307/household_ledger"

# JWT 인증 (검증된 키)
JWT_SECRET="your-super-secret-jwt-key-for-development-only-2024"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-for-development-only-2024"
NEXTAUTH_SECRET="household-ledger-develop-nextauth-secret-2025"
NEXTAUTH_URL="http://localhost:3001"

# Sentry 모니터링 (선택)
NEXT_PUBLIC_SENTRY_DSN="https://[key]@[org].ingest.sentry.io/[project-id]"
SENTRY_ORG="your-org"
SENTRY_PROJECT="household-ledger"
SENTRY_AUTH_TOKEN="your-token"
```

### Docker 데이터베이스 설정

```bash
# Docker 이미지 빌드
docker build -f docker/database.Dockerfile -t household-ledger .

# MySQL 컨테이너 실행 (포트 3307)
docker run --name household-ledger \
  -e MYSQL_ROOT_PASSWORD=wjdwhdans \
  -e MYSQL_DATABASE=household_ledger \
  -e MYSQL_USER=user \
  -e MYSQL_PASSWORD=wjdwhdans \
  -e TZ=Asia/Seoul \
  -p 3307:3306 \
  -d household-ledger

# 데이터베이스 초기화
pnpm db:generate
pnpm db:push
```

---

## 📊 Sentry 모니터링 설정

### 1. Sentry 프로젝트 생성

1. [Sentry.io](https://sentry.io/) 계정 생성
2. Organization 생성 또는 선택
3. "Create Project" → **Next.js** 플랫폼 선택
4. 프로젝트명: `household-ledger`

### 2. DSN 및 설정 정보 수집

```bash
# Sentry 설정 정보
DSN: https://[key]@[org].ingest.sentry.io/[project-id]
Organization: your-sentry-organization
Project: household-ledger
Auth Token: Settings > Auth Tokens에서 생성
```

### 3. 환경변수 설정

```bash
# 로컬 개발 환경 (.env.local)
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn-here"
SENTRY_ORG="your-sentry-organization"
SENTRY_PROJECT="household-ledger"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# 프로덕션 환경
NEXT_PUBLIC_SENTRY_DSN="production-dsn"
SENTRY_ENVIRONMENT="production"
```

### 4. GitHub Secrets 설정

Repository Settings > Secrets and variables > Actions:

```text
SENTRY_DSN: your-sentry-dsn
SENTRY_ORG: your-organization
SENTRY_PROJECT: household-ledger
SENTRY_AUTH_TOKEN: your-auth-token
```

### 5. Sentry 기능 확인

```typescript
// 개발 환경에서 테스트
// Sentry 테스트 패널 사용 (개발 환경에서만 표시)
// - 동기 에러 테스트
// - 비동기 에러 테스트
// - 네트워크 에러 테스트
// - Sentry 직접 테스트
// - 성능 추적 테스트
```

### 6. 대시보드 활용

- **에러 추적**: 실시간 에러 모니터링
- **성능 모니터링**: 페이지 로딩 시간, API 응답 시간
- **릴리즈 추적**: 배포별 에러 변화 추이
- **사용자 피드백**: 에러 발생 시 사용자 의견 수집

---

## 🔒 보안 가이드라인

### 보안 정책

| Version | Supported |
| ------- | --------- |
| 1.x.x   | ✅        |
| < 1.0   | ❌        |

### 취약점 신고 절차

1. **공개 이슈 생성 금지**
2. 이메일 신고: security@household-ledger.com
3. 포함 정보:
   - 취약점 설명
   - 재현 단계
   - 영향 범위
   - 제안 해결책 (선택)

### 대응 시간

- **긴급 (Critical)**: 24시간 이내
- **높음 (High)**: 72시간 이내
- **중간 (Medium)**: 1주일 이내
- **낮음 (Low)**: 1개월 이내

### 코드 보안 실천사항

```typescript
// ✅ 입력 검증 (Zod)
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

// ✅ SQL 인젝션 방지 (Prisma ORM)
const user = await prisma.user.findUnique({
  where: { email: validatedEmail },
})

// ✅ XSS 방지
const sanitizedInput = DOMPurify.sanitize(userInput)

// ✅ CSRF 방지 (Next.js 기본 제공)
// 자동으로 CSRF 토큰 검증

// ✅ 비밀번호 해싱 (bcrypt)
const hashedPassword = await bcrypt.hash(password, 12)

// ✅ JWT 토큰 보안
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: '15m',
  issuer: 'household-ledger',
  audience: 'household-users',
})
```

### 환경변수 보안

```bash
# ❌ 절대 금지
JWT_SECRET="123456"
DATABASE_PASSWORD="password"

# ✅ 안전한 설정
JWT_SECRET="household-ledger-develop-jwt-secret-key-2025"
DATABASE_PASSWORD="$(openssl rand -base64 32)"

# 환경변수 검증
if [ -z "$JWT_SECRET" ]; then
  echo "JWT_SECRET is required"
  exit 1
fi
```

### API 보안 체크리스트

- [ ] 모든 API 입력 Zod 스키마 검증
- [ ] JWT 토큰 만료 시간 설정 (15분)
- [ ] Refresh 토큰 순환 정책
- [ ] Rate Limiting 적용
- [ ] CORS 정책 설정
- [ ] HTTPS 강제 적용
- [ ] 민감 정보 로깅 방지

---

## 🚀 배포 환경 설정

### Vercel 배포 설정

```bash
# vercel.json
{
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "SENTRY_DSN": "@sentry-dsn"
  },
  "build": {
    "env": {
      "SENTRY_AUTH_TOKEN": "@sentry-auth-token"
    }
  }
}
```

### 환경별 설정

```typescript
// lib/config.ts
const config = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    enableDevTools: true,
    logLevel: 'debug',
  },
  production: {
    apiUrl: 'https://household-ledger.vercel.app/api',
    enableDevTools: false,
    logLevel: 'error',
  },
}

export const getConfig = () => config[process.env.NODE_ENV as keyof typeof config]
```

### 성능 모니터링

```typescript
// lib/monitoring.ts
import { performance } from 'perf_hooks'

export function measureApiPerformance(endpoint: string) {
  const start = performance.now()

  return {
    end: () => {
      const duration = performance.now() - start
      console.log(`API ${endpoint}: ${duration}ms`)

      // Sentry 성능 추적
      if (duration > 1000) {
        Sentry.captureMessage(`Slow API: ${endpoint} (${duration}ms)`, 'warning')
      }
    },
  }
}
```

---

## 🔍 보안 점검 자동화

### 의존성 보안 검사

```bash
# 자동 보안 감사
pnpm audit                # 의존성 취약점 검사
pnpm audit --fix          # 자동 수정 가능한 취약점 해결

# Dependabot 자동 업데이트 (GitHub)
# .github/dependabot.yml 설정 활성화
```

### 코드 보안 검사

```bash
# ESLint 보안 규칙
pnpm lint:security        # 보안 관련 린트 검사

# Semgrep 정적 분석 (옵션)
pnpm security:scan        # 정적 보안 분석
```

### GitHub Actions 보안 워크플로우

```yaml
# .github/workflows/security.yml
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Security Audit
        run: |
          npm audit --audit-level moderate
          npm audit signatures

      - name: SAST Scan
        uses: github/super-linter@v4
        env:
          VALIDATE_JAVASCRIPT_ES: true
          VALIDATE_TYPESCRIPT_ES: true
```

### 운영 보안 모니터링

```typescript
// 실시간 보안 이벤트 모니터링
export function logSecurityEvent(event: SecurityEvent) {
  // Sentry 보안 이벤트 로깅
  Sentry.addBreadcrumb({
    category: 'security',
    message: event.message,
    level: event.severity,
    data: {
      userId: event.userId,
      ip: event.ipAddress,
      userAgent: event.userAgent,
    },
  })

  // 긴급 이벤트 알림
  if (event.severity === 'critical') {
    Sentry.captureException(new Error(`Security Alert: ${event.message}`))
  }
}
```

---

## 🛡️ 보안 체크리스트

### 개발 환경

- [ ] `.env.local` 파일 `.gitignore`에 포함
- [ ] 강력한 JWT 시크릿 키 사용
- [ ] 데이터베이스 접근 권한 최소화
- [ ] HTTPS 로컬 개발 환경 설정 (선택)

### 프로덕션 환경

- [ ] 환경변수 암호화 저장
- [ ] HTTPS 강제 적용
- [ ] CORS 정책 엄격 설정
- [ ] Rate Limiting 활성화
- [ ] 보안 헤더 설정
- [ ] 로그 민감정보 마스킹

### 코드 품질

- [ ] 모든 사용자 입력 검증
- [ ] SQL 인젝션 방지 (Prisma ORM 사용)
- [ ] XSS 방지 (입력 sanitization)
- [ ] CSRF 방지 (Next.js 기본 제공)
- [ ] 에러 메시지 정보 노출 방지

### 모니터링

- [ ] Sentry 에러 추적 활성화
- [ ] 보안 이벤트 로깅
- [ ] 의존성 취약점 자동 검사
- [ ] 정기적 보안 감사

---

## 🚨 사고 대응 가이드

### 보안 사고 발생 시

1. **즉시 대응**
   - 영향 범위 파악
   - 서비스 긴급 중단 (필요시)
   - 로그 수집 및 보존

2. **분석 및 복구**
   - 근본 원인 분석
   - 보안 패치 적용
   - 데이터 무결성 확인

3. **사후 조치**
   - 사용자 통지
   - 보안 정책 업데이트
   - 재발 방지 대책 수립

### 비상 연락망

- **개발팀**: <dev-team@household-ledger.com>
- **보안팀**: <security@household-ledger.com>
- **운영팀**: <ops@household-ledger.com>

---

**🔐 보안은 모든 개발자의 책임입니다. 의심스러운 활동이나 취약점을 발견하면 즉시 보고해주세요.**
