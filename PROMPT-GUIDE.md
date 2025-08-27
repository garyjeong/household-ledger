# 🚀 Household Ledger AI 프롬프팅 가이드

> **Household Ledger 풀스택 프로젝트를 위한 GPT-5 최적화 프롬프팅 가이드**
>
> OpenAI의 [GPT-5 프롬프팅 가이드](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide)를 기반으로 Household Ledger 프로젝트에 특화된 AI 협업 방법론을 제시합니다.

---

## 🎯 개요

GPT-5는 에이전틱 작업 성능, 코딩, 원시 지능, 조정 가능성에서 상당한 도약을 보여줍니다. 이 가이드는 Household Ledger 프로젝트의 특성에 맞춰 모델 출력의 품질을 최대화하는 프롬프팅 팁들을 제공합니다.

### ✅ **주요 개선 영역**

- 🤖 **에이전틱 작업 성능** - 도구 호출과 지시 준수 향상
- ⚛️ **React/Next.js 풀스택** - 프론트엔드부터 API Routes까지 통합 최적화
- 🗄️ **데이터베이스 설계** - Prisma ORM 모델링과 마이그레이션 관리
- 🎨 **UI/UX 구현** - Tailwind CSS + Radix UI 기반 컴포넌트 설계
- 🔧 **도구 통합** - MCP(Model Context Protocol) 활용 극대화

---

## 🎮 에이전틱 워크플로우 제어

### 📉 **적극성 줄이기 (빠른 실행 우선)**

복잡한 컨텍스트 수집보다 **빠른 결과**를 원할 때:

```markdown
<context_gathering>
목표: 빠르게 충분한 컨텍스트 수집. 병렬 탐색하고 행동할 수 있는 즉시 중단.

방법:

- 넓게 시작한 후 집중된 하위 쿼리로 확장
- 병렬로 다양한 쿼리 실행; 쿼리당 상위 결과 읽기. 경로 중복 제거 및 캐시; 쿼리 반복 금지
- 컨텍스트 과다 검색 방지. 필요시 하나의 병렬 배치에서 타겟 검색 실행

조기 중단 기준:

- 변경할 정확한 코드/설정을 명명할 수 있음
- 상위 결과의 70%가 하나의 모듈/파일에 수렴

한 번 확대:

- 신호가 충돌하거나 범위가 모호한 경우, 하나의 정제된 병렬 배치 실행 후 진행

깊이:

- 수정할 함수/클래스나 의존하는 인터페이스만 추적; 필요하지 않은 경우 전이적 확장 방지

루프:

- 배치 검색 → 최소 계획 → 작업 완료
- 검증 실패하거나 새로운 미지수 등장 시에만 재검색. 더 많은 검색보다 행동 우선
  </context_gathering>
```

**예산 제한 버전:**

```markdown
<context_gathering>

- 검색 깊이: 매우 낮음
- 완전히 정확하지 않을 수 있어도 가능한 한 빠르게 정확한 답변 제공에 강력히 편향
- 일반적으로 최대 2번의 도구 호출 절대 한계
- 더 많은 조사 시간이 필요하다고 생각되면, 최신 발견사항과 열린 질문으로 사용자 업데이트. 사용자 확인 시 진행 가능
  </context_gathering>
```

### 📈 **적극성 높이기 (완전한 자율성)**

철저한 작업 완료와 모델 자율성을 원할 때:

```markdown
<persistence>
- 당신은 에이전트입니다 - 사용자의 쿼리가 완전히 해결될 때까지 계속 진행하세요
- 문제가 해결되었다고 확신할 때만 턴을 종료하세요
- 불확실성에 직면해도 절대 중단하거나 사용자에게 되돌리지 마세요 — 가장 합리적인 접근법을 연구하거나 추론하고 계속하세요
- 인간에게 가정을 확인하거나 명확히 하도록 요청하지 마세요. 항상 나중에 조정할 수 있습니다 — 가장 합리적인 가정이 무엇인지 결정하고, 그것으로 진행하며, 행동을 완료한 후 사용자 참조용으로 문서화하세요
</persistence>
```

### 🔧 **도구 전문(Tool Preambles)**

사용자 경험 향상을 위한 명확한 진행상황 업데이트:

```markdown
<tool_preambles>

- 도구를 호출하기 전에 항상 사용자의 목표를 친근하고 명확하며 간결한 방식으로 다시 표현하세요
- 그런 다음 즉시 따를 각 논리적 단계를 자세히 설명하는 구조화된 계획을 개요로 제시하세요
- 파일 편집이나 데이터베이스 마이그레이션을 실행할 때 각 단계를 간결하고 순차적으로 설명하며 진행상황을 명확히 표시하세요
- 사전 계획과 구별되게 완료된 작업을 요약하여 마무리하세요
  </tool_preambles>
```

---

## ⚛️ 풀스택 코딩 성능 최적화

### 🎯 **Household Ledger 풀스택 코딩 가이드라인**

```markdown
<fullstack_coding_guidelines>
프로젝트 환경:

- Framework: Next.js 15+ (App Router)
- Language: TypeScript (strict mode)
- Database: MySQL 8.0 with Prisma ORM
- Styling: Tailwind CSS + Radix UI
- Authentication: JWT (Access + Refresh Token)
- Form Handling: React Hook Form + Zod
- State Management: React hooks + Context API

핵심 원칙:

1. 근본 원인 해결 - 표면적 패치보다 문제의 뿌리 해결
2. Type Safety - 엄격한 TypeScript 설정과 타입 안전성
3. 컴포넌트 재사용성 - 일관된 디자인 시스템과 재사용 가능한 컴포넌트
4. 보안 우선 - 인증, 입력 검증, XSS/CSRF 방지
5. 성능 최적화 - 코드 스플리팅, 이미지 최적화, 캐싱 전략

TypeScript 코딩 스타일:

- ESLint + Prettier 설정 준수
- 엄격한 타입 정의 (noImplicitAny, strictNullChecks)
- Interface 우선, Type 보조 사용
- 함수명: camelCase, 컴포넌트명: PascalCase
- Import 순서: react → external libraries → internal modules

프론트엔드 패턴:

- 컴포넌트 구조: components/ui/ (재사용) + components/features/ (기능별)
- 상태 관리: Server State (API) + Client State (UI) 분리
- 스타일링: Tailwind utility classes + CSS variables for design tokens
- 폼 처리: React Hook Form + Zod validation

백엔드 패턴 (API Routes):

- RESTful API 설계 원칙 준수
- Server Actions for mutations
- API Routes for data fetching
- Prisma ORM을 통한 타입 안전 데이터베이스 접근

데이터베이스 패턴:

- 테이블명: camelCase in Prisma schema
- Foreign Key: [table]Id (camelCase)
- Timestamp: createdAt, updatedAt, deletedAt
- 인덱스: 복합 인덱스로 쿼리 성능 최적화

금지사항:

- 저작권/라이선스 헤더 추가 (명시적 요청 제외)
- any 타입 사용 (unknown이나 구체적 타입 사용)
- 과도한 인라인 주석 (코드가 자명해야 함)
- Raw SQL 사용 (Prisma ORM 우선)
- Tailwind 임의 값 남발 (design tokens 활용)

검증 단계:

1. git status로 변경사항 점검
2. TypeScript 컴파일 확인 (npm run type-check)
3. ESLint 실행 (npm run lint)
4. Prisma 생성 및 마이그레이션 확인
5. 개발 서버 실행 및 기능 테스트
6. 간단한 작업: 간략한 bullet point 설명
7. 복잡한 작업: 컴포넌트 문서화, API 엔드포인트 설명 포함
   </fullstack_coding_guidelines>
```

### 🔍 **탐색 및 계획**

```markdown
<fullstack_exploration>
코딩 전 항상 수행:

- 요구사항을 UI 컴포넌트, API 엔드포인트, 데이터베이스 스키마로 분해
- 범위 매핑: 관련 컴포넌트, 페이지, API Routes, Prisma 모델 식별
- 종속성 확인: React 컴포넌트 트리, Context/Provider, API 호출 패턴
- 데이터베이스 영향: Prisma 마이그레이션 필요성, 관계 설정, 인덱스 고려
- API 설계: Next.js API Routes vs Server Actions, 상태 코드, 응답 형식 정의
- UI/UX 설계: 컴포넌트 재사용성, 반응형 레이아웃, 접근성 고려
- 보안 고려: 인증/인가, 입력 검증, XSS/CSRF 방지
- 실행 계획 수립: 모델 → API → 컴포넌트 → 페이지 → 테스트 순서
  </fullstack_exploration>
```

### ✅ **검증 및 효율성**

```markdown
<fullstack_verification>
작업 진행 중 검증 사항:

- 컴포넌트 렌더링: 개발 서버에서 실시간 확인
- API 엔드포인트 테스트: Network 탭, Postman, 또는 직접 호출
- 데이터베이스 무결성: Prisma Studio로 데이터 확인
- 마이그레이션 검증: prisma db push/migrate 테스트
- 타입 체크: TypeScript 컴파일러 실행으로 타입 안전성 확인
- UI/UX 테스트: 반응형 디자인, 접근성, 사용자 플로우 확인
- 보안 테스트: 인증 플로우, 권한 검증, 입력 검증 확인

문제가 해결되었다고 확신할 때까지 사용자에게 되돌리지 않음
프론트엔드 성능 최적화 및 불필요한 리렌더링 방지
</fullstack_verification>

<fullstack_efficiency>
효율성이 핵심. 시간 제한이 있음.
풀스택 특성상 UI/UX와 데이터 일관성을 동시에 고려하되, 불필요한 복잡성 방지
컴포넌트 재사용성과 API 응답 시간 최적화 고려
사용자 경험을 최우선으로 하는 직관적인 인터페이스 구현
</fullstack_efficiency>
```

---

## 📝 질문 개선 가이드라인

### 🎯 **효과적인 질문 구조**

#### **Before (개선 전):**

```markdown
❌ "거래 추가 기능 만들어줘"
❌ "로그인 페이지 안 돼"
❌ "데이터베이스 연결 문제"
```

#### **After (개선 후):**

```markdown
✅ "거래 생성 폼에서 submit 시 Prisma validation error 발생
환경: Next.js 15 (localhost:3000), MySQL with Prisma
증상: /api/transactions POST 요청에서 amount 필드 타입 불일치
목적: 수입/지출 거래 정상 등록 기능 구현"

✅ "그룹 정산 계산 로직 구현 필요
목적: 그룹 내 거래 분할 및 정산 자동화
요구사항: 비율/정액 분할, 사용자별 정산 금액 계산, 정산 스냅샷 생성
연관: Transaction, TransactionParticipant, Settlement 모델"
```

### 🔄 **질문 개선 템플릿**

#### **1. API/백엔드 문제 해결**

```markdown
**문제:** [구체적인 API 오류나 서버 사이드 이슈]
**환경:** [Next.js 버전, TypeScript 설정, Prisma 버전]
**증상:** [HTTP 상태 코드, 오류 메시지, 브라우저 콘솔]
**재현 방법:** [API 호출 방법이나 사용자 액션]
**목적:** [달성하고자 하는 API 동작]
```

#### **2. 데이터베이스/모델 개발**

```markdown
**기능:** [구현하려는 데이터베이스 기능]
**모델:** [관련 Prisma 모델명과 스키마]
**관계:** [모델 간 관계 설정 (@relation)]
**제약사항:** [데이터 무결성, 성능 요구사항]
**마이그레이션:** [Prisma migrate 필요 여부]
```

#### **3. UI/컴포넌트 개발**

```markdown
**컴포넌트:** [구현할 컴포넌트명과 위치]
**목적:** [해결할 UI/UX 문제]
**요구사항:** [디자인 시스템, 반응형, 접근성]
**상태 관리:** [필요한 상태와 Context]
**스타일링:** [Tailwind classes, 특별한 디자인 요구사항]
```

#### **4. API Routes/Server Actions 설계**

```markdown
**엔드포인트:** [구현할 API 경로와 HTTP 메서드]
**목적:** [API가 해결할 비즈니스 문제]
**입력:** [request body, query parameters, path parameters]
**출력:** [response 스키마와 상태 코드]
**보안:** [인증/인가 요구사항]
```

---

## 🏠 Household Ledger 특화 프롬프트

### 🎯 **풀스택 프로젝트 컨텍스트**

```markdown
<household_ledger_context>
프로젝트: Household Ledger - 개인 및 그룹 가계부 웹 애플리케이션
핵심 가치: 직관적인 거래 관리와 그룹 내 투명한 정산 시스템

주요 기능:

- 거래 관리 시스템 (Transaction CRUD) - MVP 핵심
- JWT 기반 인증 시스템 (Access + Refresh Token)
- 그룹 기반 가계부 관리 (Groups, GroupMembers)
- 거래 분할 및 정산 자동화 (Settlement 시스템)
- 예산 관리 및 분석 대시보드 (Budget, Analytics)
- CSV 가져오기/내보내기 기능

기술 스택:

- Framework: Next.js 15+ (App Router)
- Language: TypeScript (strict mode)
- Database: MySQL 8.0 with Prisma ORM
- Styling: Tailwind CSS + Radix UI
- Authentication: JWT (HS256)
- Form Handling: React Hook Form + Zod
- State Management: React hooks + Context API
- Package Manager: pnpm

페이지 우선순위:

1. 인증 페이지 (/login, /signup)
2. 대시보드 (/dashboard)
3. 거래 관리 (/transactions)
4. 그룹 관리 (/groups)
5. 정산 시스템 (/groups/:id/settlements)

데이터베이스 핵심:

- 중심 관계: User ← GroupMember → Group
- 거래 관계: User → Transaction ← Account, Category
- 정산 관계: Group → Settlement → SettlementItem
- 분할 관계: Transaction → TransactionParticipant → User
  </household_ledger_context>
```

### 🗄️ **데이터베이스 아키텍처**

```markdown
<database_architecture>
핵심 모델 구조:

1. User (사용자 기본 정보)
   - id (BigInt), email, passwordHash, nickname
   - avatarUrl, createdAt
   - Relations: ownedGroups, groupMembers, transactions

2. Group (그룹 정보)
   - id (BigInt), name, ownerId, createdAt
   - Relations: owner (User), members (GroupMember[]), transactions

3. GroupMember (그룹 멤버십)
   - groupId, userId, role (OWNER/ADMIN/MEMBER), joinedAt
   - Composite key: [groupId, userId]

4. Transaction (거래 - MVP 핵심)
   - id, groupId, ownerUserId, type (EXPENSE/INCOME/TRANSFER)
   - date, amount, accountId, categoryId, merchant, memo
   - isSettled, createdAt, updatedAt
   - Relations: participants[], tags[], attachments[]

5. Account (계좌)
   - id, ownerType (USER/GROUP), ownerId, name
   - type (CASH/CARD/BANK), currency, balance, isActive

6. Settlement (정산)
   - id, groupId, title, periodFrom, periodTo
   - createdBy, status (OPEN/CLOSED), createdAt, closedAt
   - Relations: items (SettlementItem[])

관계 패턴:

- BigInt ID 사용으로 대용량 데이터 대응
- 복합 인덱스로 쿼리 성능 최적화 (group_date, owner_date)
- 소프트 삭제 미적용 (명시적 삭제만)
- Enum 타입으로 데이터 무결성 보장

마이그레이션 전략:

- Prisma migrate: dev 환경 스키마 변경
- 안전한 스키마 변경: 하위 호환성 유지
- 데이터 무결성: @relation 제약조건과 cascade 설정
- 인덱스 최적화: @@index, @@unique 활용
  </database_architecture>
```

### 🔐 **보안 및 API 패턴**

```markdown
<security_api_patterns>
인증/인가 구조:

- JWT 기반 인증: HS256 algorithm
- Access Token: 30분 만료, Authorization header
- Refresh Token: 14일 만료, HttpOnly cookie
- Next.js middleware를 통한 route protection
- CORS: Next.js 기본 설정

보안 체크리스트:

1. Input Validation: Zod 스키마로 모든 입력 검증
2. SQL Injection: Prisma ORM으로 방지
3. XSS Prevention: Next.js 기본 보호 + 사용자 입력 이스케이프
4. CSRF Protection: SameSite cookie 설정
5. Rate Limiting: Next.js middleware로 구현 예정
6. Sensitive Data: 환경변수 (.env.local) 관리

API Routes 패턴:

- 성공: 200 (GET), 201 (POST), 204 (DELETE)
- 실패: 400 (validation), 401 (auth), 403 (permission), 404 (not found)
- 오류 응답: NextResponse.json({ error: "message", code: "CODE" })
- 민감 정보 제외: passwordHash, internal tokens 노출 방지

Server Actions 패턴:

- Form submissions과 mutations에 사용
- revalidatePath/revalidateTag로 캐시 관리
- redirect() 함수로 페이지 이동 처리
- 에러 처리는 try-catch + return { error } 패턴
  </security_api_patterns>
```

---

## 🔧 MCP 활용 가이드

### 🚀 **풀스택 MCP 원칙**

```markdown
<fullstack_mcp_principles>
MCP (Model Context Protocol): 풀스택 개발 시 UI/UX, API 설계, 데이터베이스 스키마,
비즈니스 로직의 일관성을 유지하며 코드 품질과 사용자 경험을 보장하는 프로토콜

풀스택 특화 요소:

1. UI/UX 일관성: 컴포넌트 설계, 디자인 시스템, 사용자 플로우의 표준화
2. API 일관성: Next.js API Routes, Server Actions, 응답 형식의 표준화
3. 데이터베이스 무결성: Prisma 스키마 변경, 마이그레이션, 관계 설정의 추적
4. 상태 관리: Client/Server state 분리, Context 관리, 캐싱 전략
5. 보안 준수: 인증/인가, 입력 검증, XSS/CSRF 방지의 체계적 관리
6. 성능 모니터링: 컴포넌트 렌더링, 번들 크기, 쿼리 최적화 추적
7. 문서 동기화: 컴포넌트 문서, API 문서, README 업데이트

추적 항목:

- UI 변경사항: 새 컴포넌트, 페이지 추가, 디자인 시스템 수정
- API 변경사항: 새 엔드포인트, Server Actions, 스키마 수정
- 데이터베이스: Prisma 모델 생성/수정, 인덱스 추가, 마이그레이션
- 보안 패치: 인증 로직 변경, 권한 관리, 취약점 수정
- 성능 개선: 컴포넌트 최적화, 쿼리 최적화, 번들 최적화
  </fullstack_mcp_principles>
```

### 📋 **풀스택 MCP 워크플로우**

```markdown
<fullstack_mcp_workflow>

1. 요구사항 분석
   - UI/UX 설계 요구사항 파악
   - API 설계 요구사항 파악
   - 데이터베이스 스키마 영향 분석
   - 보안 및 성능 고려사항 식별

2. 설계 및 계획
   - 컴포넌트 구조 및 페이지 플로우 설계
   - API Routes vs Server Actions 선택
   - Prisma 스키마 설계 및 최적화
   - 상태 관리 전략 수립

3. 구현
   - 모델 → API → 컴포넌트 → 페이지 순서
   - 타입 안전성 확보 (TypeScript)
   - 폼 처리 (React Hook Form + Zod)
   - 스타일링 (Tailwind + Radix UI)

4. 검증 및 테스트
   - 타입 체크, ESLint, 테스트 실행
   - Prisma 마이그레이션 테스트
   - UI/UX 반응형 테스트
   - API 엔드포인트 검증

5. 문서화 및 기록
   - 컴포넌트 사용법 문서화
   - API 엔드포인트 문서 업데이트
   - Prisma 스키마 변경사항 기록
   - 사용자 플로우 문서 갱신
     </fullstack_mcp_workflow>
```

---

## 🎯 질문 개선 실행 프로세스

### 📝 **풀스택 질문 개선 단계**

```markdown
<fullstack_question_improvement>

1. 질문 유형 분석:
   - UI/UX 개발: 컴포넌트, 페이지, 사용자 플로우
   - API 개발: Next.js API Routes, Server Actions, 스키마
   - 데이터베이스: Prisma 모델링, 마이그레이션, 쿼리 최적화
   - 인증/보안: JWT, 권한 관리, 입력 검증
   - 성능/배포: 컴포넌트 최적화, 번들링, 환경 설정

2. 컨텍스트 확인:
   - 현재 컴포넌트 구조와 페이지 플로우
   - API 구조와 Prisma 스키마
   - 관련 컴포넌트, 페이지, API 파일
   - 기존 스타일링과 디자인 시스템

3. 개선 적용:
   - UI/UX 세부사항 명시 (컴포넌트, 상태, 이벤트 처리)
   - 기술적 세부사항 명시 (HTTP 메서드, 상태 코드, 스키마)
   - 보안 고려사항 포함 (인증, 검증, XSS/CSRF 방지)
   - 성능 영향 분석 (렌더링, 쿼리, 번들 크기)

4. 풀스택 특화 가이드:
   - Next.js App Router 베스트 프랙티스 적용
   - React 컴포넌트 재사용성 최적화
   - Tailwind + Radix UI 디자인 시스템 일관성
   - Prisma 관계 설정 및 타입 안전성 확보
     </fullstack_question_improvement>
```

### 🔄 **지속적 개선**

```markdown
<fullstack_continuous_improvement>
각 질문 세션 후:

1. UI/UX 사용성 평가 및 디자인 시스템 일관성 확인
2. API 설계 품질 평가 및 Next.js 패턴 준수 확인
3. 데이터베이스 정규화 및 Prisma 최적화 점검
4. 보안 취약점 및 코드 품질 검토
5. 테스트 커버리지 및 문서화 완성도 평가

피드백 루프:

- 사용자 경험 → UI/UX 개선 방향성
- 컴포넌트 재사용성 → 디자인 시스템 강화
- API 응답 시간 → 쿼리 최적화 방향성
- 번들 크기 → 코드 스플리팅 및 최적화
- 테스트 실패율 → 코드 품질 개선
- 보안 이슈 → 인증/인가 로직 강화
- 개발 효율성 → 컴포넌트 템플릿 개선
  </fullstack_continuous_improvement>
```

---

## 📚 참고 자료

- [OpenAI GPT-5 Prompting Guide](https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide)
- [Household Ledger GOAL.md](./GOAL.md)
- [Household Ledger README.md](./README.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

---

> **💡 기억하세요!**
>
> 풀스택에서 좋은 프롬프트는 UI/UX 사용성, API 설계의 명확성, 데이터베이스 무결성, 보안 고려사항을 모두 포함합니다. 이 가이드를 활용하여 더 일관되고 효율적인 풀스택 개발을 경험하세요.
