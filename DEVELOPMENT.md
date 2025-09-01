# 👨‍💻 개발 가이드

신혼부부 가계부 프로젝트의 종합 개발 가이드입니다.

---

## 📋 목차

1. [개발 환경 설정](#-개발-환경-설정)
2. [코드 스타일 & 품질](#-코드-스타일--품질)
3. [개발 워크플로우](#-개발-워크플로우)
4. [아키텍처 가이드](#-아키텍처-가이드)
5. [테스트 가이드](#-테스트-가이드)
6. [AI 프롬프트 가이드](#-ai-프롬프트-가이드)

---

## 🛠 개발 환경 설정

### 필수 도구

```bash
# Node.js 18+ & pnpm
node --version  # >= 18.0.0
pnpm --version  # >= 8.0.0

# 개발 도구
pnpm install
pnpm dev
```

### 환경 변수

```bash
# .env.local 설정
cp .env.example .env.local

# 필수 환경변수
DATABASE_URL="mysql://user:wjdwhdans@localhost:3307/household_ledger"
JWT_SECRET="household-ledger-develop-jwt-secret-key-2025"
JWT_REFRESH_SECRET="household-ledger-develop-refresh-token-secret-2025"
NEXTAUTH_SECRET="household-ledger-develop-nextauth-secret-2025"
NEXTAUTH_URL="http://localhost:3001"
```

---

## 🎨 코드 스타일 & 품질

### Prettier 설정

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "endOfLine": "lf",
  "arrowParens": "avoid"
}
```

### ESLint 규칙

```javascript
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals', '@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-console': 'warn',
  },
}
```

### 네이밍 컨벤션

```typescript
// ✅ 올바른 네이밍
const userBalance = 1000 // camelCase 변수
const MAX_RETRY_COUNT = 3 // UPPER_SNAKE_CASE 상수
function calculateTotal() {} // camelCase 함수
interface UserProfile {} // PascalCase 인터페이스
class TransactionService {} // PascalCase 클래스
type ApiResponse<T> = {} // PascalCase 타입

// 파일명
UserProfile.tsx // 컴포넌트: PascalCase
userService.ts // 서비스: camelCase
api - client.ts // 유틸리티: kebab-case
```

### 코드 품질 체크

```bash
# 린팅 및 포맷팅
pnpm lint          # ESLint 검사
pnpm lint:fix      # ESLint 자동 수정
pnpm format        # Prettier 포맷팅
pnpm type-check    # TypeScript 타입 체크

# 전체 품질 체크
pnpm quality:check # 모든 품질 검사 실행
```

---

## 🔄 개발 워크플로우

### 브랜치 전략

```text
main                    # 프로덕션 브랜치
├── develop            # 개발 브랜치
├── feature/auth-system # 새로운 기능
├── bugfix/login-error  # 버그 수정
├── hotfix/security-fix # 긴급 수정
└── release/v1.1.0     # 릴리즈 준비
```

### 커밋 컨벤션

```bash
# 형식: <type>(<scope>): <description>
feat(auth): add OAuth2 Google login
fix(api): resolve memory leak in session cleanup
docs(readme): update installation guide
style(ui): improve button hover effects
refactor(utils): extract validation helpers
perf(db): optimize user query performance
test(auth): add unit tests for login flow
chore(deps): update dependencies
```

### PR 체크리스트

- [ ] 기능성: 요구사항 충족 여부
- [ ] 코드 품질: 가독성, 유지보수성
- [ ] 보안: 보안 취약점 점검
- [ ] 성능: 성능 영향 분석
- [ ] 테스트: 적절한 테스트 커버리지
- [ ] 문서: 코드 및 API 문서화

### 개발 프로세스

1. **이슈 생성**: 새로운 기능이나 버그 리포트
2. **브랜치 생성**: `feature/기능명` 또는 `bugfix/버그명`
3. **TDD 개발**: 테스트 우선 개발 방식
4. **PR 생성**: 코드 리뷰 및 자동 테스트 실행
5. **머지**: 모든 검증 통과 후 main 브랜치에 병합

---

## 🏗 아키텍처 가이드

### 프로젝트 구조

```text
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── api/               # API 라우트
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── ui/                # 기본 UI 컴포넌트
│   ├── couple-ledger/     # 가계부 컴포넌트
│   └── error/             # 에러 처리 컴포넌트
├── hooks/                 # 커스텀 훅
├── lib/                   # 유틸리티 및 설정
├── services/              # 비즈니스 로직
└── types/                 # TypeScript 타입 정의
```

### 컴포넌트 구조

```typescript
// ✅ 함수형 컴포넌트 구조
interface Props {
  title: string
  onSubmit?: () => void
}

export function MyComponent({ title, onSubmit }: Props) {
  // 1. 상태 관리
  const [loading, setLoading] = useState(false)

  // 2. 커스텀 훅
  const { user } = useAuth()

  // 3. 이벤트 핸들러
  const handleSubmit = async () => {
    setLoading(true)
    await onSubmit?.()
    setLoading(false)
  }

  // 4. 렌더링
  return (
    <div className="p-4">
      <h1>{title}</h1>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? '처리중...' : '제출'}
      </button>
    </div>
  )
}
```

### API 설계 원칙

```typescript
// ✅ API 라우트 구조
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    // 1. 입력 검증
    const body = await request.json()
    const { email, password } = requestSchema.parse(body)

    // 2. 인증 확인
    const user = await verifyAuth(request)

    // 3. 비즈니스 로직
    const result = await createTransaction({ email, password, userId: user.id })

    // 4. 응답 반환
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 상태 관리 패턴

```typescript
// Context + Zustand 패턴
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  login: async (credentials) => {
    set({ isLoading: true })
    const user = await authService.login(credentials)
    set({ user, isLoading: false })
  },
  logout: () => set({ user: null })
}))

// React Context 래퍼
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={useAuthStore()}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

## 🧪 테스트 가이드

### 단위 테스트 (Jest)

```typescript
// utils/formatCurrency.test.ts
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('should format Korean won correctly', () => {
    expect(formatCurrency(1000)).toBe('₩1,000')
    expect(formatCurrency(0)).toBe('₩0')
    expect(formatCurrency(-500)).toBe('-₩500')
  })
})
```

### 컴포넌트 테스트

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E 테스트 (Playwright)

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can login successfully', async ({ page }) => {
  await page.goto('/login')

  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="login-button"]')

  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
})
```

### 테스트 실행

```bash
# 단위 테스트
pnpm test              # 테스트 실행
pnpm test:watch        # 감시 모드
pnpm test:coverage     # 커버리지 확인

# E2E 테스트
pnpm e2e               # Playwright 실행
pnpm e2e:headed        # UI 모드로 실행
pnpm e2e:report        # 리포트 확인
```

---

## 🤖 AI 프롬프트 가이드

### 프롬프트 품질 평가 기준 (PQS)

#### 목표: 80점 이상 확보

1. **명확성 (20점)**: 요구사항이 모호하지 않은가?
2. **문맥성 (20점)**: 프로젝트 컨텍스트를 반영했는가?
3. **구체성 (20점)**: 입력, 출력, 제한조건이 충분히 명시되었는가?
4. **실행성 (20점)**: AI가 즉시 실행 가능한 수준인가?
5. **역할 분리 (20점)**: 설계, 구현, 리뷰가 혼재하지 않았는가?

### 효과적인 프롬프트 패턴

```markdown
# ✅ 좋은 프롬프트 예시

## 요구사항

사용자 인증 API 엔드포인트를 구현해주세요.

## 상세 명세

- 경로: POST /api/auth/login
- 입력: { email: string, password: string }
- 출력: { success: boolean, user?: User, token?: string }
- 에러: 400 (잘못된 입력), 401 (인증 실패)

## 제약조건

- JWT 토큰 사용
- bcrypt로 비밀번호 검증
- Zod로 입력 검증
- Next.js API Routes 사용

## 예상 결과

로그인 성공 시 JWT 토큰을 쿠키에 저장하고 사용자 정보 반환
```

### MCP 프로토콜 적용

```markdown
# MCP 기반 작업 흐름

1. **모델 확인** → Prisma 스키마 검토 및 최적화
2. **API 구현** → Next.js API Routes, Zod 검증, 보안 검증
3. **컴포넌트 개발** → Radix UI 기반, 재사용성 우선
4. **페이지 통합** → App Router, Server Actions 활용
5. **테스트 작성** → Jest + Testing Library

## 보안 우선 원칙

- 모든 API 입력 Zod 스키마 검증
- 소유권 및 그룹 멤버십 검증
- XSS/CSRF 방지 패턴 적용
- JWT 토큰 만료 및 갱신 관리
```

---

## 🔧 개발 도구 및 명령어

### 주요 명령어

```bash
# 개발 서버
pnpm dev              # 개발 서버 시작 (포트 3001)
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버 시작

# Docker MySQL 데이터베이스 관리
docker build -f docker/database.Dockerfile -t household-ledger .
docker run --name household-ledger \
  -e MYSQL_ROOT_PASSWORD=wjdwhdans \
  -e MYSQL_DATABASE=household_ledger \
  -e MYSQL_USER=user \
  -e MYSQL_PASSWORD=wjdwhdans \
  -e TZ=Asia/Seoul \
  -p 3307:3306 \
  -d household-ledger

docker ps             # 컨테이너 상태 확인
docker stop household-ledger    # 컨테이너 중지
docker start household-ledger   # 컨테이너 시작
docker logs household-ledger    # 로그 확인

# 데이터베이스
pnpm db:generate      # Prisma 클라이언트 생성
pnpm db:push          # 스키마를 DB에 푸시 (포트 3307)
pnpm db:studio        # Prisma Studio (데이터베이스 GUI)

# 코드 품질
pnpm lint             # ESLint 검사
pnpm format           # Prettier 포맷팅
pnpm type-check       # TypeScript 타입 체크

# 테스트
pnpm test             # 단위 테스트
pnpm test:e2e         # E2E 테스트
pnpm test:coverage    # 테스트 커버리지
```

### IDE 설정 (VS Code)

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### 권장 확장 프로그램

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

---

## 🚀 배포 가이드

### 환경별 설정

```bash
# 개발 환경
NEXT_PUBLIC_APP_ENV=development
DATABASE_URL=mysql://user:wjdwhdans@localhost:3307/household_ledger

# 프로덕션 환경
NEXT_PUBLIC_APP_ENV=production
DATABASE_URL=mysql://user:password@production-host:3306/household_ledger
```

### 성능 최적화

```typescript
// 컴포넌트 메모이제이션
export const ExpensiveComponent = memo(function ExpensiveComponent(props) {
  return <div>{/* 복잡한 렌더링 로직 */}</div>
})

// 데이터 최적화
const memoizedCalculation = useMemo(() => {
  return expensiveCalculation(data)
}, [data])

// 이미지 최적화
import Image from 'next/image'

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  priority={true}
/>
```

---

## 📚 참고 자료

### **프로젝트 문서**

- **[데이터베이스 설계 문서](./DATABASE.md)** - 19개 테이블 완전 가이드
- **[프로젝트 현황](./STATUS.md)** - 개발 진행 상황 및 완료 기능
- **[프로젝트 개요](./README.md)** - 전체 서비스 소개 및 사용법

### **기술 문서**

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs)
- [TailwindCSS 문서](https://tailwindcss.com/docs)
- [Prisma 문서](https://www.prisma.io/docs)
- [Jest 테스팅 가이드](https://jestjs.io/docs/getting-started)
- [Playwright 문서](https://playwright.dev/docs/intro)

---

**📋 이 가이드는 팀의 개발 효율성과 코드 품질 향상을 위해 지속적으로 업데이트됩니다.**

