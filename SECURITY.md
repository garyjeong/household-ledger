# 🔒 Security Guidelines

이 문서는 우리가족가계부 프로젝트의 보안 가이드라인과 실무 지침을 제공합니다.

## 목차

1. [보안 정책](#보안-정책)
2. [의존성 보안 관리](#의존성-보안-관리)
3. [코드 보안 실천사항](#코드-보안-실천사항)
4. [환경 변수 보안](#환경-변수-보안)
5. [배포 보안](#배포-보안)
6. [보안 점검 자동화](#보안-점검-자동화)
7. [취약점 대응](#취약점-대응)

## 보안 정책

### 지원되는 버전

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

### 보안 취약점 신고

보안 취약점을 발견하신 경우:

1. **공개적으로 이슈를 생성하지 마세요**
2. 대신 [security@example.com](mailto:security@example.com)으로 이메일을 보내주세요
3. 다음 정보를 포함해주세요:
   - 취약점 설명
   - 재현 단계
   - 영향 범위
   - 제안하는 해결책 (선택사항)

### 대응 시간

- **긴급 (Critical)**: 24시간 이내
- **높음 (High)**: 72시간 이내
- **중간 (Medium)**: 1주일 이내
- **낮음 (Low)**: 1개월 이내

## 의존성 보안 관리

### 자동화 도구

#### Dependabot 설정

```yaml
# .github/dependabot.yml이 활성화됨
- 매주 월요일 9시 의존성 체크
- 보안 업데이트 우선 처리
- 자동 그룹화로 효율적 관리
```

#### 보안 감사 명령어

```bash
# 의존성 취약점 검사
pnpm run security:audit

# 전체 보안 점검
pnpm run security:check

# 의존성 업데이트 및 취약점 수정
pnpm run security:update
```

### 의존성 선택 기준

#### ✅ 허용되는 라이센스

- MIT
- Apache-2.0
- BSD-2-Clause, BSD-3-Clause
- ISC
- 0BSD, Unlicense, CC0-1.0

#### ❌ 금지되는 패키지 패턴

- `eval` 사용 패키지
- `unsafe-eval` 관련 패키지
- `node-serialize` (안전하지 않은 직렬화)
- 알려진 취약점이 있는 패키지

#### 새 의존성 추가 절차

1. **필요성 검토**: 정말 필요한 기능인가?
2. **대안 검토**: 내장 기능이나 더 안전한 대안은 없는가?
3. **보안 검사**: 알려진 취약점이나 이슈는 없는가?
4. **라이센스 확인**: 프로젝트 라이센스와 호환되는가?
5. **번들 크기 영향**: 번들 크기에 미치는 영향은 적절한가?

## 코드 보안 실천사항

### 입력 검증

#### ✅ 올바른 방법

```typescript
import { z } from 'zod'

// Zod를 사용한 안전한 입력 검증
const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  amount: z.number().min(0).max(1000000),
})

export function validateUser(input: unknown) {
  return UserSchema.safeParse(input)
}
```

#### ❌ 피해야 할 방법

```typescript
// 검증 없이 직접 사용
function updateUser(data: any) {
  // 위험: 검증되지 않은 데이터 사용
  return database.update(data)
}
```

### 인증 및 권한

#### JWT 토큰 보안

```typescript
// 올바른 JWT 처리
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// 안전한 패스워드 해싱
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 12) // 충분한 라운드 수
}
```

#### API 라우트 보안

```typescript
// 모든 API 라우트에 인증 검증
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = verifyToken(token.replace('Bearer ', ''))
    // 권한 확인 후 처리
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
```

### SQL 인젝션 방지

#### ✅ Prisma ORM 사용 (권장)

```typescript
// Prisma는 자동으로 SQL 인젝션을 방지
const user = await prisma.user.findFirst({
  where: {
    email: userEmail, // 자동으로 이스케이프됨
    isActive: true,
  },
})
```

#### ❌ 동적 SQL 구성 금지

```typescript
// 절대 하지 말 것
const query = `SELECT * FROM users WHERE email = '${email}'`
```

### XSS 방지

#### React의 자동 이스케이프 활용

```typescript
// React는 기본적으로 XSS를 방지
function UserProfile({ user }: { user: User }) {
  return (
    <div>
      {/* 자동으로 이스케이프됨 */}
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  )
}
```

#### dangerouslySetInnerHTML 사용 금지

```typescript
// 가능한 한 사용하지 말 것
// 정말 필요한 경우 DOMPurify 등으로 sanitize
import DOMPurify from 'dompurify'

function sanitizeHTML(html: string) {
  return DOMPurify.sanitize(html)
}
```

## 환경 변수 보안

### 환경 변수 관리 원칙

#### ✅ 올바른 방법

```bash
# .env.example (버전 관리에 포함)
DATABASE_URL=your_database_url_here
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here

# .env.local (버전 관리에서 제외)
DATABASE_URL=postgresql://real_connection_string
JWT_SECRET=actual_secret_key_32_chars_long
NEXTAUTH_SECRET=real_nextauth_secret
```

#### ❌ 피해야 할 방법

```bash
# 실제 시크릿을 .env.example에 포함
DATABASE_URL=postgresql://user:password@localhost:5432/db

# 약한 시크릿 사용
JWT_SECRET=123456
```

### 환경 변수 검증

```typescript
// config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export const env = envSchema.parse(process.env)
```

### 클라이언트 노출 최소화

```typescript
// ✅ 서버에서만 사용
const secret = process.env.JWT_SECRET

// ✅ 클라이언트에 안전하게 노출
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL

// ❌ 민감한 정보를 NEXT_PUBLIC_으로 노출 금지
// const secret = process.env.NEXT_PUBLIC_JWT_SECRET // 절대 금지!
```

## 배포 보안

### Next.js 보안 헤더

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          },
        ],
      },
    ]
  },
}
```

### HTTPS 강제

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 프로덕션에서 HTTPS 강제
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`
    )
  }
}
```

### 배포 체크리스트

- [ ] 모든 환경 변수가 프로덕션에 설정됨
- [ ] 기본 비밀번호가 변경됨
- [ ] 불필요한 개발 도구가 제거됨
- [ ] 소스맵이 공개되지 않음
- [ ] 에러 메시지에 민감한 정보가 포함되지 않음
- [ ] 보안 헤더가 설정됨
- [ ] HTTPS가 강제됨

## 보안 점검 자동화

### CI/CD 파이프라인

보안 검사가 다음과 같이 자동화되어 있습니다:

1. **의존성 감사**: `pnpm audit`
2. **고위험 패턴 검사**: 알려진 위험 패턴 스캔
3. **라이센스 확인**: 허용된 라이센스만 사용
4. **번들 분석**: 민감한 정보 노출 검사
5. **Snyk 스캔**: 추가 취약점 검사

### 로컬 보안 점검

```bash
# 전체 보안 점검 실행
pnpm run security:check

# 의존성 감사만 실행
pnpm run security:audit

# 의존성 업데이트 및 취약점 수정
pnpm run security:update
```

### 정기 점검 스케줄

- **매일**: Dependabot 자동 점검
- **매주**: 수동 보안 점검 (`pnpm run security:check`)
- **릴리즈 전**: 전체 보안 감사
- **월간**: 보안 정책 및 가이드라인 검토

## 취약점 대응

### 대응 단계

1. **탐지**: 자동화 도구나 신고를 통한 발견
2. **평가**: 심각도 및 영향 범위 분석
3. **완화**: 임시 조치 또는 즉시 패치
4. **수정**: 근본적 해결책 구현
5. **검증**: 수정 사항 테스트 및 확인
6. **문서화**: 대응 과정 기록 및 공유

### 심각도 분류

#### Critical (긴급)

- 인증 우회 가능
- SQL 인젝션으로 데이터 탈취 가능
- 원격 코드 실행 가능
- **대응**: 즉시 서비스 중단 및 핫픽스

#### High (높음)

- 민감한 정보 노출
- 권한 상승 가능
- DoS 공격 가능
- **대응**: 24시간 내 패치

#### Medium (보통)

- 제한적 정보 노출
- CSRF 공격 가능
- **대응**: 1주일 내 수정

#### Low (낮음)

- 정보 수집 가능
- 마이너한 보안 설정 이슈
- **대응**: 다음 정기 업데이트에 포함

### 핫픽스 프로세스

1. **긴급 브랜치 생성**: `hotfix/security-YYYY-MM-DD`
2. **최소 변경으로 수정**: 부작용 최소화
3. **보안 테스트**: 수정 사항 검증
4. **긴급 배포**: 프로덕션 즉시 적용
5. **사후 분석**: 근본 원인 분석 및 예방책 수립

## 보안 도구 및 리소스

### 사용 중인 도구

- **Dependabot**: 의존성 자동 업데이트
- **pnpm audit**: 의존성 취약점 검사
- **Snyk**: 추가 보안 스캔
- **ESLint**: 코드 품질 및 보안 규칙
- **Prisma**: SQL 인젝션 방지
- **Zod**: 입력 검증

### 추천 리소스

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Guidelines](https://nextjs.org/docs/advanced-features/security-headers)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

## 연락처

보안 관련 문의나 취약점 신고:

- 이메일: security@example.com
- 담당자: Security Team
- 긴급 상황: Slack #security-alerts

## 🚀 성능 최적화 관련 보안

### 이미지 최적화 보안

```typescript
// ✅ 보안 권장사항 - 안전한 이미지 설정
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'trusted-cdn.com' }],
    dangerouslyAllowSVG: false, // SVG 업로드 금지
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}
```

### 성능 기반 DoS 방지

```typescript
// ✅ API 호출 제한으로 서버 보호
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회 요청
  message: 'Too many requests from this IP',
})

// ✅ 리소스 사용량 모니터링
function monitorPerformance() {
  const memUsage = process.memoryUsage()
  if (memUsage.heapUsed > 500 * 1024 * 1024) {
    // 500MB
    console.warn('High memory usage detected')
  }
}
```

### 클라이언트 사이드 보안

```typescript
// ✅ 안전한 동적 import (화이트리스트 방식)
async function loadUserModule(userRole: string) {
  const allowedModules = {
    admin: () => import('./AdminModule'),
    user: () => import('./UserModule'),
  }

  const moduleLoader = allowedModules[userRole as keyof typeof allowedModules]
  if (!moduleLoader) {
    throw new Error('Unauthorized module access')
  }

  return await moduleLoader()
}
```

### 번들 보안 검사

```bash
# 소스맵에서 민감한 정보 검사
if grep -r "password\|secret\|token" .next/static/ --include="*.map"; then
  echo "⚠️ Sensitive information found in source maps!"
  exit 1
fi
```

---

**이 문서는 정기적으로 업데이트됩니다. 마지막 업데이트: 2024년 12월**
