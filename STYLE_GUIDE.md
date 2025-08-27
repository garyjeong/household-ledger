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

이 가이드는 프로젝트 진행에 따라 업데이트될 수 있습니다. 모든 팀원이 일관된 코드 스타일을 유지할 수 있도록 협조해 주시기 바랍니다.
