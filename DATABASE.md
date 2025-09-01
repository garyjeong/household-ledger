# 🗄️ 데이터베이스 설계 문서 (단순화)

**최종 업데이트**: 2025.08.30  
**스키마 버전**: v2.0.0 (대폭 단순화)  
**총 테이블 수**: 9개 (19개 → 9개로 간소화)

---

## 📊 데이터베이스 개요

신혼부부 가계부 서비스를 위한 **극도로 단순화된** 관계형 데이터베이스 설계입니다.
**MySQL 8.4 + Prisma ORM**을 사용하여 최소한의 테이블로 최대한의 기능을 구현합니다.

### 🎯 **단순화 설계 원칙**

- **KISS (Keep It Simple, Stupid)**: 복잡한 매핑 테이블 제거
- **외래키 직접 연결**: N:N 관계를 1:N으로 단순화
- **JSON 활용**: 설정 정보는 JSON으로 유연하게 저장
- **핵심 기능 집중**: 불필요한 고급 기능 테이블 제거

### ✂️ **제거된 복잡한 기능들**

- ❌ 푸시 알림 시스템 (PushToken)
- ❌ 계좌 관리 시스템 (Account)
- ❌ 정산 시스템 (Settlement, SettlementItem)
- ❌ 분할 거래 (TransactionParticipant)
- ❌ 감사 로그 (AuditLog)
- ❌ 매핑 테이블들 (GroupMember, TransactionTag, BudgetCategory)

---

## 🏗️ **단순화된 테이블 구조 (9개)**

### 🙋‍♂️ **1. 사용자 관리 영역** (3개)

#### **`users` - 사용자 기본 정보 + 설정**

```sql
-- 사용자 기본 정보 및 계정 관리
-- - 이메일/비밀번호 기반 인증
-- - 사용자 프로필 및 설정 정보 저장 (JSON)
-- - 그룹 멤버십 직접 연결 (groupId 외래키)
```

| 필드            | 타입               | 설명                          |
| --------------- | ------------------ | ----------------------------- |
| `id`            | BigInt PK          | 사용자 고유 ID                |
| `email`         | String(255) UNIQUE | 로그인 이메일                 |
| `password_hash` | String(255)        | BCrypt 해시된 비밀번호        |
| `nickname`      | String(60)         | 사용자 닉네임                 |
| `avatar_url`    | String(500)        | 프로필 이미지 URL             |
| `group_id`      | BigInt FK          | **소속 그룹 직접 연결**       |
| `settings`      | JSON               | **설정 정보 (테마, 언어 등)** |
| `created_at`    | DateTime           | 계정 생성 일시                |

**✨ 단순화 포인트**: UserSettings 테이블을 JSON 컬럼으로 통합, GroupMember 매핑 테이블 제거

#### **`groups` - 그룹 관리**

```sql
-- 가족/커플 그룹 관리
-- - 공동 가계부를 위한 그룹 생성
-- - 그룹 소유자와 멤버 관계 관리
-- - 거래 공유의 기본 단위
```

#### **`group_invites` - 초대 코드**

```sql
-- 그룹 초대 코드 관리
-- - 10자리 영문+숫자 초대 코드 생성
-- - 24시간 만료 시간 설정
-- - 안전한 그룹 참여를 위한 일회성 코드
```

---

### 💰 **2. 금융 관리 영역** (2개)

#### **`categories` - 카테고리 + 예산**

```sql
-- 거래 분류 카테고리 관리
-- - 수입/지출별 거래 분류 체계
-- - 기본 카테고리 + 사용자 정의 카테고리
-- - 예산 금액 직접 저장 (budgetAmount)
```

| 필드            | 타입        | 설명                               |
| --------------- | ----------- | ---------------------------------- |
| `budget_amount` | BigInt      | **카테고리별 예산 금액 직접 저장** |
| `name`          | String(120) | 카테고리 이름                      |
| `type`          | Enum        | EXPENSE/INCOME/TRANSFER            |
| `color`         | String(7)   | 카테고리 색상                      |

**✨ 단순화 포인트**: BudgetCategory 매핑 테이블 제거, 예산을 카테고리에 직접 저장

#### **`tags` - 태그 시스템**

```sql
-- 거래 태그 시스템
-- - 카테고리 외 추가적인 거래 분류
-- - 자유로운 태그 방식으로 유연한 분류
```

---

### 🧾 **3. 거래 관리 영역** (2개)

#### **`transactions` - 거래 내역 + 태그** ⭐

```sql
-- 거래 내역 중심 테이블
-- - 수입/지출/이체 모든 거래 기록
-- - 개인/그룹 거래 구분
-- - 태그 직접 연결 (tagId 외래키)
```

| 필드       | 타입      | 설명               |
| ---------- | --------- | ------------------ |
| `tag_id`   | BigInt FK | **태그 직접 연결** |
| `amount`   | BigInt    | 거래 금액          |
| `merchant` | String    | 상점명             |
| `memo`     | String    | 메모               |

**✨ 단순화 포인트**: TransactionTag 매핑 테이블 제거, Account 참조 제거 (계좌 개념 제거)

#### **`attachments` - 첨부파일**

```sql
-- 거래 첨부파일 관리
-- - 영수증, 사진 등 거래 증빙 자료
-- - 파일 URL, MIME 타입, 크기 정보 저장
```

---

### 📊 **4. 예산/반복 거래 영역** (2개)

#### **`budgets` - 월별 예산 (단순화)**

```sql
-- 월별 예산 관리 (단순화)
-- - 사용자/그룹별 월단위 총 예산 설정
-- - 세부 예산은 Category 테이블에서 관리
```

**✨ 단순화 포인트**: 복잡한 예산 분배 로직 제거, 총액만 관리

#### **`recurring_rules` - 반복 거래 규칙**

```sql
-- 반복 거래 규칙 정의
-- - 월세, 구독료 등 정기 지출 자동화
-- - 매월/매주 등 반복 주기 및 날짜 규칙 설정
```

**✨ 단순화 포인트**: Account 참조 제거, 단순한 금액 반복만 지원

---

## 🔗 **단순화된 관계도**

### **핵심 관계 흐름 (매우 단순함)**

```
User ─┬─ Group (N:1, groupId로 직접 연결)
      ├─ Transaction (1:N) ─┬─ Category (N:1)
      │                     ├─ Tag (N:1, tagId로 직접 연결)
      │                     └─ Attachment (1:N)
      └─ GroupInvite (1:N)

Category ─┬─ Transaction (1:N)
          ├─ RecurringRule (1:N)
          └─ budgetAmount (직접 저장)

Budget ── 독립적 (총 예산만 관리)
```

**🎯 핵심 변화:**

- ❌ 복잡한 N:N 매핑 테이블 모두 제거
- ✅ 외래키 직접 연결로 단순화
- ✅ JSON 컬럼 활용으로 유연성 확보

---

## 📁 **파일 위치**

### **Prisma 스키마 파일**

```text
📄 /prisma/schema.prisma (9개 테이블만 포함)
```

### **스키마 확인 명령어**

```bash
# 스키마 파일 직접 보기
cat prisma/schema.prisma

# Prisma Studio로 GUI 확인
pnpm db:studio

# 스키마 검증
npx prisma validate

# 데이터베이스에 스키마 적용
npx prisma db push
```

---

## 🚀 **단순화의 장점**

### **개발 속도 향상**

- ✅ 테이블 수 53% 감소 (19개 → 9개)
- ✅ 복잡한 JOIN 쿼리 제거
- ✅ 매핑 테이블 관리 부담 제거
- ✅ API 개발 복잡도 대폭 감소

### **유지보수성 향상**

- ✅ 직관적인 데이터 구조
- ✅ 외래키 관계 명확화
- ✅ 비즈니스 로직 단순화
- ✅ 데이터 마이그레이션 용이

### **성능 최적화**

- ✅ 불필요한 JOIN 연산 제거
- ✅ 인덱스 최적화 용이
- ✅ 쿼리 플래닝 단순화
- ✅ 캐싱 전략 단순화

---

## 💡 **개발 가이드**

### **데이터 접근 패턴**

```typescript
// 사용자의 그룹 정보 가져오기 (매우 단순)
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { group: true },
})

// 거래 내역 + 카테고리 + 태그 가져오기 (JOIN 최소화)
const transactions = await prisma.transaction.findMany({
  where: { ownerUserId: userId },
  include: {
    category: true,
    tag: true,
  },
})

// 카테고리별 예산 확인 (직접 저장)
const categories = await prisma.category.findMany({
  where: { ownerId: userId },
  select: { name: true, budgetAmount: true },
})
```

### **설정 관리 (JSON 활용)**

```typescript
// 사용자 설정 저장/조회
const userSettings = {
  theme: 'dark',
  currency: 'KRW',
  language: 'ko',
}

await prisma.user.update({
  where: { id: userId },
  data: { settings: userSettings },
})
```

### **보안 고려사항**

- 모든 API에서 소유권 검증 필수
- `ownerType + ownerId` 조합으로 데이터 접근 제어
- 그룹 멤버십은 `User.groupId`로 단순하게 확인

---

## 🎊 **결론**

### **단순화 성과**

- **테이블 수**: 19개 → 9개 (53% 감소)
- **매핑 테이블**: 3개 → 0개 (100% 제거)
- **관계 복잡도**: N:N → 1:N (대폭 단순화)
- **개발 복잡도**: 고급 → 기본 (유지보수성 향상)

### **트레이드오프**

- ❌ 일부 고급 기능 제거 (정산, 분할 거래 등)
- ❌ 유연성 일부 감소
- ✅ 개발 및 유지보수 비용 대폭 절감
- ✅ 성능 및 안정성 향상

---

**🎉 핵심 가계부 기능에 집중한 극도로 단순하고 효율적인 데이터베이스 설계 완성!**

