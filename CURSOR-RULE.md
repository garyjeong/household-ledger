# 🎯 Cursor AI Rules - Household Ledger Project

> **Household Ledger 프로젝트를 위한 Cursor AI 작업 규칙**
>
> 모든 AI 어시스턴트 세션에서 일관되게 적용되어야 하는 핵심 규칙들을 정의합니다.

---

## 📋 **기본 원칙 (Always Rules)**

### 1. **MCP (Model Context Protocol) 기본 원칙**

- MCP는 Model이 코드를 생성·수정할 때 최신 문맥(구조, 규칙)을 반영하여 코드·문서·설계·질문 흐름을 일관되게 관리하는 표준 프로토콜
- 질문, 작업, 설계, 수정의 모든 단계에서 문맥 관리와 이력 추적을 철저히 수행
- Rule 위반, 예외 처리, 컨텍스트 전파, 질문 품질 평가·개선(PQS/PFP)까지 MCP 체계 내에서 관리

### 2. **PROMPT-GUIDE.md 기준 준수**

- **모든 작업은 PROMPT-GUIDE.md의 가이드라인을 기반으로 진행**
- 풀스택 개발 워크플로우: **모델 → API → 컴포넌트 → 페이지** 순서 진행
- TypeScript strict mode 적용
- 보안 우선 설계 (소유권 검증, Zod 스키마 검증)

### 3. **작업 완료 시 마크다운 업데이트**

- **작업이 완료될 때마다 관련 마크다운 파일들을 반드시 업데이트**
- 업데이트 대상: `README.md`, `GOAL.md`, `TODO.md`
- 완료된 기능은 체크박스로 표시 (✅)
- 새로 추가된 구조나 기능은 문서에 반영

---

## 🏗️ **프로젝트 구조 규칙**

### 1. **기술 스택 고정**

```typescript
// 절대 변경하지 말 것
Framework: Next.js 15+ (App Router)
Language: TypeScript (strict mode)
Styling: Tailwind CSS v4 + Radix UI
Database: MySQL 8.4 + Prisma ORM
Authentication: JWT (Access + Refresh Token)
Testing: Jest + Testing Library
Container: Docker
```

### 2. **폴더 구조 규칙**

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes만
│   ├── settings/       # 설정 페이지들
│   └── (auth)/         # 인증 관련 페이지
├── components/         # 재사용 컴포넌트
│   ├── ui/            # 기본 UI 컴포넌트 (Radix UI)
│   └── [domain]/      # 도메인별 컴포넌트 (accounts, categories 등)
├── lib/               # 유틸리티 라이브러리
│   ├── schemas/       # Zod 스키마
│   └── utils/         # 유틸리티 함수
└── contexts/          # React Context
```

---

## 🔒 **보안 및 검증 규칙**

### 1. **API 보안 필수사항**

```typescript
// 모든 API 엔드포인트에 필수 적용
✅ JWT 토큰 인증 확인
✅ Zod 스키마 입력 검증
✅ 소유권 검증 (개인/그룹)
✅ 에러 처리 및 적절한 HTTP 상태 코드
✅ BigInt 안전 처리 (id, balance 등)
```

### 2. **클라이언트 검증 규칙**

```typescript
// React Hook Form + Zod 조합 필수
✅ 폼 검증은 반드시 Zod 스키마 사용
✅ 실시간 검증 및 에러 메시지 표시
✅ 로딩 상태 및 비활성화 처리
✅ 사용자 경험 최적화 (자동 포커스, 엔터 제출 등)
```

---

## 🎨 **UI/UX 디자인 규칙**

### 1. **브랜드 컬러 시스템**

```css
/* 절대 변경하지 말 것 */
brand: { 600: "#8B5CF6", 50: "#F5F3FF" }
accent: { magenta: "#D957FF" }
chip: { lavender: "#EDE7FF" }
text: { 900: "#1D2230", 700: "#373C48" }
stroke: { 200: "#E8EAF0" }
surface: { card: "#FFFFFF", page: "#FAFAFB" }
```

### 2. **컴포넌트 디자인 규칙**

```typescript
// 모든 UI 컴포넌트에 적용
✅ Radix UI 프리미티브 기반 구현
✅ 12-16px 라운드 모서리
✅ 반응형 디자인 (모바일 우선)
✅ 접근성 고려 (aria-label, 키보드 네비게이션)
✅ 로딩/에러/빈 상태 처리
✅ 실시간 미리보기 (색상, 금액 포맷팅 등)
```

---

## 📝 **코딩 컨벤션 규칙**

### 1. **파일 명명 규칙**

```
컴포넌트: PascalCase (AccountForm.tsx)
페이지: kebab-case (account-settings/page.tsx)
유틸리티: camelCase (formatCurrency.ts)
API Routes: kebab-case ([id]/route.ts)
스키마: camelCase (account.ts)
```

### 2. **import 순서 규칙**

```typescript
// 항상 이 순서로 import
1. React 관련
2. Next.js 관련  
3. 외부 라이브러리
4. 내부 컴포넌트 (@/components)
5. 내부 라이브러리 (@/lib)
6. 타입 정의 (type)
```

### 3. **함수 작성 규칙**

```typescript
// 모든 함수에 적용
✅ async/await 사용 (Promise.then 금지)
✅ 에러 처리 필수 (try-catch)
✅ TypeScript 타입 명시
✅ JSDoc 주석 (복잡한 로직의 경우)
✅ 단일 책임 원칙 적용
```

---

## 🧪 **테스트 규칙**

### 1. **테스트 작성 필수사항**

```typescript
// 새로운 기능 구현 시 필수 작성
✅ 유틸리티 함수 단위 테스트
✅ API 엔드포인트 테스트
✅ 핵심 컴포넌트 테스트
✅ 에러 케이스 테스트
```

### 2. **테스트 파일 구조**

```
tests/
├── lib/           # 유틸리티 함수 테스트
├── api/           # API 엔드포인트 테스트  
├── components/    # 컴포넌트 테스트
└── integration/   # 통합 테스트
```

---

## 📊 **데이터베이스 규칙**

### 1. **Prisma 스키마 규칙**

```prisma
// 절대 변경하지 말 것
✅ BigInt 사용 (id, 금액)
✅ 적절한 인덱스 설정
✅ 외래키 제약 조건
✅ 기본값 설정
✅ 날짜 필드는 DateTime
```

### 2. **시드 데이터 관리**

```typescript
// 기본 데이터 관리 규칙
✅ 기본 카테고리 15개 고정
✅ 시드 데이터 업데이트 시 마이그레이션 필요
✅ 기본 데이터 수정/삭제 방지
```

---

## 🚀 **개발 워크플로우 규칙**

### 1. **Phase별 개발 순서**

```markdown
1. **모델 확인** → Prisma 스키마 검토
2. **API 구현** → Zod 검증 + 보안 검증 
3. **컴포넌트 개발** → Radix UI 기반
4. **페이지 통합** → App Router 활용
5. **테스트 작성** → Jest + Testing Library
6. **문서 업데이트** → README, GOAL, TODO
```

### 2. **TODO 관리 규칙**

```typescript
// todo_write 도구 적극 활용
✅ 복잡한 작업은 반드시 TODO로 분해
✅ 작업 완료 시 즉시 상태 업데이트
✅ 진행 중인 작업은 1개만 유지
✅ 의존성 관계 명시
```

---

## ⚠️ **금지 사항 (Never Rules)**

### 1. **절대 하지 말 것**

```typescript
❌ 기술 스택 변경 제안
❌ 브랜드 컬러 변경
❌ Prisma 스키마 기본 구조 변경
❌ 기본 카테고리 수정/삭제
❌ 보안 검증 생략
❌ TypeScript any 타입 사용
❌ 인라인 스타일 사용 (Tailwind CSS 사용)
❌ console.log 남기기 (개발용 제외)
```

### 2. **문서 작성 금지사항**

```markdown
❌ 마크다운 문법 오류
❌ 완료되지 않은 기능을 완료로 표시
❌ 실제 구현과 다른 내용 기재
❌ 버전 정보 불일치
```

---

## 🎯 **질문 품질 관리 (PQS/PFP)**

### 1. **Prompt 품질 평가 기준 (PQS)**

- **명확성**: 요구사항이 모호하지 않은가? (80점 이상 목표)
- **문맥성**: 현재 프로젝트 상태를 반영했는가?
- **구체성**: 입력, 출력, 제한조건이 충분히 명시되었는가?
- **실행성**: 즉시 실행 가능한 수준인가?
- **역할 분리**: 설계, 구현, 리뷰가 혼재하지 않았는가?

### 2. **Prompt 개선 프로토콜 (PFP)**

```markdown
1. 질문 수신 후 PQS 점수 부여
2. 부족한 항목별 개선 제안  
3. 개선 예시 제시
4. 다음 질문 작성 시 개선안 적용
5. 개선 이력 문서화
```

---

## 📚 **참고 문서**

- **기본 가이드**: `PROMPT-GUIDE.md` - 상세한 프롬프팅 가이드라인
- **프로젝트 목표**: `GOAL.md` - 프로젝트 전체 계획 및 마일스톤
- **작업 목록**: `TODO.md` - 현재 진행 상황 및 다음 작업
- **설정 가이드**: `README.md` - 프로젝트 설명 및 개발 환경 설정

---

## 🔄 **규칙 업데이트**

이 규칙들은 프로젝트 진행에 따라 업데이트될 수 있습니다:

1. **Always Rules**: 절대 변경되지 않는 핵심 규칙
2. **Context Rules**: 상황에 따라 적용되는 동적 규칙  
3. **Manual Rules**: 수동 검토가 필요한 규칙
4. **Scope Rules**: 특정 범위에만 적용되는 규칙

---

> **💡 핵심 메시지**
>
> 이 규칙들은 **Household Ledger 프로젝트의 일관성과 품질**을 보장하기 위한 것입니다.  
> 모든 AI 세션에서 이 규칙들을 참조하여 작업해주세요.

**Made with ❤️ for Household Ledger Project**
