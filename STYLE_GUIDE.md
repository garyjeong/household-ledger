# 코드 스타일 가이드

이 문서는 우리가족가계부 프로젝트의 코드 스타일과 품질 관리 가이드라인을 설명합니다.

## 목차

1. [개요](#개요)
2. [코드 포맷팅 (Prettier)](#코드-포맷팅-prettier)
3. [코드 품질 (ESLint)](#코드-품질-eslint)
4. [커밋 프로세스](#커밋-프로세스)
5. [네이밍 컨벤션](#네이밍-컨벤션)
6. [파일 구조](#파일-구조)
7. [예외 상황 처리](#예외-상황-처리)

## 개요

이 프로젝트는 다음 도구들을 사용하여 코드 품질을 관리합니다:

- **ESLint**: 코드 품질 및 스타일 검사
- **Prettier**: 자동 코드 포맷팅
- **Husky**: Git hooks 관리
- **lint-staged**: 스테이징된 파일만 검사

## 코드 포맷팅 (Prettier)

### 기본 설정

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "endOfLine": "lf",
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "quoteProps": "as-needed",
  "jsxSingleQuote": true
}
```

### 주요 규칙

- **세미콜론**: 사용하지 않음
- **따옴표**: 싱글 쿼트 사용 (JSX 포함)
- **들여쓰기**: 2칸 스페이스
- **줄 길이**: 최대 100자
- **후행 쉼표**: ES5 스타일
- **화살표 함수**: 매개변수가 하나일 때 괄호 생략

### 예시

```typescript
// ✅ 올바른 예시
const userService = {
  async fetchUser(id: string) {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  },
}

const handleSubmit = (data: FormData) => {
  console.log('Form submitted:', data)
}

// ❌ 잘못된 예시
const userService = {
  async fetchUser(id: string) {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  },
}

const handleSubmit = (data: FormData) => {
  console.log('Form submitted:', data)
}
```

## 코드 품질 (ESLint)

### 주요 규칙

#### TypeScript 규칙

- `@typescript-eslint/no-explicit-any`: "warn" - any 타입 사용 경고
- `@typescript-eslint/no-unused-vars`: "warn" - 미사용 변수 경고 (\_로 시작하는 변수 제외)
- `@typescript-eslint/no-empty-object-type`: "error" - 빈 객체 타입 금지
- `@typescript-eslint/no-require-imports`: "error" - require 문 금지

#### React 규칙

- `react-hooks/exhaustive-deps`: "warn" - useEffect 의존성 배열 검사
- `react/no-unescaped-entities`: "error" - 이스케이프되지 않은 엔티티 금지
- `react/jsx-key`: "error" - 리스트 아이템에 key prop 필수

#### 일반 규칙

- `prefer-const`: "error" - 재할당되지 않는 변수는 const 사용
- `no-var`: "error" - var 키워드 금지
- `no-console`: "warn" - console.log 사용 경고 (warn, error 제외)

### 예시

```typescript
// ✅ 올바른 예시
const users = ['Alice', 'Bob', 'Charlie']
const userList = users.map(user => <li key={user}>{user}</li>)

useEffect(() => {
  fetchUsers()
}, [fetchUsers])

// ❌ 잘못된 예시
var users = ['Alice', 'Bob', 'Charlie'] // var 사용 금지
const userList = users.map(user => <li>{user}</li>) // key 누락

useEffect(() => {
  fetchUsers()
}, []) // 의존성 누락
```

## 커밋 프로세스

### 자동 검사

모든 커밋은 다음 단계를 거칩니다:

1. **lint-staged 실행**: 스테이징된 파일에 대해서만 검사
2. **ESLint 자동 수정**: `eslint --fix` 실행
3. **Prettier 포맷팅**: `prettier --write` 실행
4. **커밋 완료**: 검사를 통과한 경우에만 커밋

### 커밋 전 수동 검사

```bash
# 전체 프로젝트 lint 검사
npm run lint

# Lint 오류 자동 수정
npm run lint:fix

# 전체 프로젝트 포맷팅
npm run format

# 타입 검사
npm run type-check
```

### 커밋 실패 시 대처

커밋이 실패하면 다음과 같이 대처하세요:

1. **Lint 오류**: 오류 메시지를 확인하고 수동으로 수정
2. **포맷팅 오류**: `npm run format` 실행 후 재커밋
3. **타입 오류**: TypeScript 타입 문제 해결

```bash
# 오류 확인
npm run lint

# 자동 수정 시도
npm run lint:fix

# 수동 수정 후 재커밋
git add .
git commit -m "fix: resolve lint errors"
```

## 네이밍 컨벤션

### 파일명

- **컴포넌트**: PascalCase (`UserProfile.tsx`)
- **페이지**: camelCase (`userProfile.tsx`) 또는 kebab-case (`user-profile.tsx`)
- **유틸리티**: camelCase (`dateUtils.ts`)
- **타입 정의**: camelCase (`userTypes.ts`)

### 변수 및 함수

```typescript
// ✅ 올바른 예시
const userName = 'Alice'
const userAge = 25
const isLoggedIn = true

function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

const handleButtonClick = () => {
  console.log('Button clicked')
}

// ❌ 잘못된 예시
const UserName = 'Alice' // 변수는 camelCase
const user_age = 25 // snake_case 금지
const IsLoggedIn = true // 불린 변수도 camelCase
```

### 컴포넌트

```typescript
// ✅ 올바른 예시
export function UserProfile({ userId }: { userId: string }) {
  return <div>User Profile</div>
}

export const AccountBalance = ({ balance }: { balance: number }) => {
  return <span>₩{balance.toLocaleString()}</span>
}

// ❌ 잘못된 예시
export function userProfile({ userId }: { userId: string }) {
  return <div>User Profile</div>
}
```

## 파일 구조

### 컴포넌트 구조

```
src/components/
├── ui/              # 재사용 가능한 기본 UI 컴포넌트
├── balance/         # 잔액 관련 컴포넌트
├── transactions/    # 거래 관련 컴포넌트
└── ...
```

### 각 컴포넌트 디렉토리

```
components/balance/
├── BalanceCard.tsx      # 메인 컴포넌트
├── BalanceWidget.tsx    # 서브 컴포넌트
└── index.ts             # export 파일 (선택사항)
```

### Import 순서

```typescript
// 1. Node modules
import React, { useState, useEffect } from 'react'
import { NextPage } from 'next'

// 2. 내부 라이브러리
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

// 3. 상대 경로
import './styles.css'
```

## 예외 상황 처리

### ESLint 규칙 비활성화

특별한 경우에만 다음과 같이 규칙을 비활성화할 수 있습니다:

```typescript
// 한 줄 비활성화
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response.data

// 파일 전체 비활성화 (지양)
/* eslint-disable @typescript-eslint/no-explicit-any */
```

### Prettier 무시

```typescript
// prettier-ignore
const matrix = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
]
```

### 허용되는 console 사용

```typescript
// ✅ 허용
console.warn('이것은 경고입니다')
console.error('에러가 발생했습니다')

// ❌ 경고 발생
console.log('디버그 메시지') // 개발 중에만 사용, 배포 전 제거 필요
```

## 도구 설정

### VSCode 설정 (권장)

`.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.quoteStyle": "single",
  "javascript.preferences.quoteStyle": "single"
}
```

### 권장 VSCode 확장

- ESLint
- Prettier - Code formatter
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer

## 문제 해결

### 자주 발생하는 문제

1. **커밋이 계속 실패하는 경우**

   ```bash
   # husky 재설정
   rm -rf .husky
   npx husky init
   echo "npx lint-staged" > .husky/pre-commit
   ```

2. **ESLint와 Prettier 충돌**
   - 이 프로젝트는 충돌하지 않도록 설정되어 있습니다
   - 문제가 있다면 `npm run lint:fix && npm run format` 실행

3. **대용량 파일 포맷팅 시간**
   - `.prettierignore`에 파일 추가
   - `lint-staged` 설정으로 변경된 파일만 검사

### 도움 요청

스타일 가이드 관련 질문이나 문제가 있다면:

1. 팀 내 코드 리뷰 시 논의
2. ESLint/Prettier 공식 문서 참고
3. 프로젝트 이슈로 등록

---

## 🚀 성능 최적화 가이드라인

### React 성능 최적화

#### 메모이제이션 사용 기준

```typescript
// ✅ 좋은 예 - 비용이 큰 계산
const expensiveValue = useMemo(() => {
  return heavyComputation(data)
}, [data])

// ❌ 나쁜 예 - 단순한 계산
const simpleValue = useMemo(() => {
  return data.length > 0
}, [data])

// ✅ 좋은 예 - 자식 컴포넌트 최적화
const handleClick = useCallback(() => {
  onItemClick(item.id)
}, [item.id, onItemClick])
```

### SWR 데이터 캐싱 패턴

#### 캐시 키 명명 규칙

```typescript
// ✅ 좋은 예 - 구조화된 캐시 키
export const CACHE_KEYS = {
  BALANCE: (ownerType: string, ownerId: string) =>
    `/api/balance?ownerType=${ownerType}&ownerId=${ownerId}`,

  TRANSACTIONS: (ownerType: string, ownerId: string, page?: number) =>
    `/api/transactions?ownerType=${ownerType}&ownerId=${ownerId}&page=${page || 1}`,
}
```

#### SWR 훅 최적화

```typescript
// ✅ 좋은 예 - 최적화된 SWR 설정
function useBalance(ownerType: string, ownerId: string) {
  const { data, error, mutate } = useSWR(
    ownerId ? CACHE_KEYS.BALANCE(ownerType, ownerId) : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
      errorRetryCount: 3,
    }
  )

  // 낙관적 업데이트
  const optimisticUpdate = async (newBalance: number) => {
    await mutate({ ...data, totalBalance: newBalance }, false)
    setTimeout(() => mutate(), 1000)
  }

  return { data, error, optimisticUpdate }
}
```

### 이미지 최적화

#### OptimizedImage 컴포넌트 사용

```typescript
// ✅ 좋은 예 - 최적화된 이미지
<OptimizedImage
  src="/images/user-avatar.jpg"
  alt="사용자 아바타"
  width={120}
  height={120}
  priority={false}
  placeholder="blur"
  fallbackSrc="/images/default-avatar.png"
/>

// ❌ 나쁜 예 - 일반 img 태그 사용
<img src="/images/large-image.jpg" alt="이미지" />
```

### Web Vitals 최적화

#### CLS 방지 (Cumulative Layout Shift)

```typescript
// ✅ 좋은 예 - 크기 지정으로 레이아웃 이동 방지
<div className="min-h-[200px]">
  <OptimizedImage
    src="/images/content.jpg"
    alt="콘텐츠 이미지"
    width={400}
    height={200} // 명시적 크기 지정
  />
</div>

// ❌ 나쁜 예 - 크기 미지정
<div>
  <img src="/images/content.jpg" alt="이미지" />
</div>
```

#### 성능 안티패턴 방지

```typescript
// ❌ 나쁜 예 - 무한 루프 의존성
const expensiveValue = useMemo(() => {
  return heavyComputation(count)
}, [count, heavyComputation]) // 매번 새로 생성됨

// ✅ 좋은 예 - 올바른 의존성
const heavyComputation = useCallback(value => {
  return value * 2
}, [])

const expensiveValue = useMemo(() => {
  return heavyComputation(count)
}, [count, heavyComputation])
```

---

## 📋 코드 리뷰 체크리스트

### ✅ 기본 검증 (모든 PR 필수)

- [ ] PR 제목이 명확하고 변경사항을 잘 설명하는가?
- [ ] 관련 이슈가 올바르게 링크되어 있는가?
- [ ] 모든 CI 체크가 통과했는가?
- [ ] 코드 변경량이 적절한가? (500줄 이하 권장)
- [ ] 커밋 메시지가 컨벤션을 따르는가?

### 🔍 상세 리뷰 가이드

#### 1. 🚀 기능성 검토

**핵심 기능**

- [ ] **요구사항 충족**: 기능이 요구사항/이슈에서 명시한 대로 동작하는가?
- [ ] **정상 시나리오**: 기본적인 사용자 플로우가 올바르게 작동하는가?
- [ ] **엣지 케이스**: 예외적인 상황들이 적절히 처리되는가?

**에러 처리**

- [ ] **사용자 친화적 에러**: 에러 메시지가 사용자가 이해할 수 있는가?
- [ ] **적절한 에러 레벨**: Critical/High/Medium/Low 분류가 적절한가?
- [ ] **에러 복구**: 사용자가 에러 상황에서 복구할 수 있는 방법이 있는가?
- [ ] **에러 로깅**: Sentry로 적절히 에러가 전송되는가?

#### 2. 🏗️ 코드 품질 검토

**가독성 & 구조**

- [ ] **명명 규칙**: 변수, 함수, 컴포넌트명이 명확하고 일관적인가?
- [ ] **함수 크기**: 함수가 하나의 책임만 가지며 적절한 크기인가? (20줄 이하 권장)
- [ ] **컴포넌트 구조**: React 컴포넌트가 적절히 분리되어 있는가?
- [ ] **주석**: 복잡한 비즈니스 로직에 적절한 주석이 있는가?

**SOLID 원칙 준수**

- [ ] **단일 책임**: 각 함수/컴포넌트가 하나의 책임만 가지는가?
- [ ] **개방-폐쇄**: 확장에는 열려있고 수정에는 닫혀있는가?
- [ ] **의존성 역전**: 구체적 구현보다 인터페이스에 의존하는가?

#### 3. 🔒 보안 검토

**인증 & 권한**

- [ ] **인증 검증**: 모든 보호된 엔드포인트에서 인증을 확인하는가?
- [ ] **권한 검사**: 사용자가 해당 리소스에 접근 권한이 있는지 확인하는가?
- [ ] **토큰 관리**: JWT 토큰이 안전하게 저장되고 관리되는가?

**입력 검증**

- [ ] **서버 측 검증**: 모든 사용자 입력이 서버에서 검증되는가?
- [ ] **Zod 스키마**: 입력 검증 스키마가 적절히 정의되어 있는가?
- [ ] **XSS 방지**: 사용자 입력이 적절히 이스케이프되는가?

#### 4. ⚡ 성능 검토

**렌더링 최적화**

- [ ] **불필요한 리렌더링**: React.memo, useMemo, useCallback이 적절히 사용되었는가?
- [ ] **컴포넌트 분리**: 무거운 컴포넌트가 적절히 분리되어 있는가?
- [ ] **지연 로딩**: 큰 컴포넌트나 이미지가 필요할 때 로드되는가?

**데이터 처리**

- [ ] **API 호출 최적화**: 불필요한 API 호출이 없는가?
- [ ] **캐싱**: 자주 사용되는 데이터가 적절히 캐싱되는가?

#### 5. 📱 UI/UX 검토

**사용성**

- [ ] **반응형**: 모바일, 태블릿, 데스크톱에서 적절히 동작하는가?
- [ ] **접근성**: WCAG 가이드라인을 준수하는가?
- [ ] **로딩 상태**: 로딩 중일 때 적절한 피드백이 있는가?

**디자인 일관성**

- [ ] **디자인 시스템**: 정의된 색상, 타이포그래피, 간격을 따르는가?
- [ ] **컴포넌트 재사용**: 기존 UI 컴포넌트를 최대한 재사용했는가?

#### 6. 🧪 테스트 검토

**테스트 커버리지**

- [ ] **단위 테스트**: 핵심 비즈니스 로직에 테스트가 있는가?
- [ ] **통합 테스트**: API 엔드포인트 테스트가 있는가?
- [ ] **컴포넌트 테스트**: UI 컴포넌트 렌더링 테스트가 있는가?

### 📊 리뷰 승인 기준

**✅ 승인 조건**

- 모든 필수 체크리스트 항목 통과
- CI/CD 파이프라인 성공
- 최소 1명의 코드 리뷰어 승인
- 보안 취약점 없음

**⚠️ 주의사항**

- 큰 변경사항은 단계별로 나누어 리뷰
- 성능에 영향을 주는 변경은 별도 성능 테스트
- 데이터베이스 스키마 변경은 마이그레이션 검토

---

이 가이드는 프로젝트 진행에 따라 업데이트될 수 있습니다. 모든 팀원이 일관된 코드 스타일을 유지할 수 있도록 협조해 주시기 바랍니다.
