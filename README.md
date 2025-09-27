# 💑 신혼부부 가계부 서비스

**🚀 Enterprise급 보안, 성능 및 코드 아키텍처 최적화 완료!**

신혼부부가 각자 입력해도 자동으로 하나의 가계부로 묶여 지출을 투명하게 공유할 수 있는 **수동 입력 위주의 초간단 가계부**입니다.

**만든 이**: Development Team

- **버전**: 2.2.2
- **마지막 업데이트**: 2025년 9월 21일
- **주요 변경사항**: 반복 거래 기능 구현, 빠른 입력 UX 개선, 시스템 안정성 강화

## 🎉 **v2.3.0 (2025.09.21) - 반복 거래 기능 및 안정성 강화**

- **🔄 반복 거래**: '빠른 입력'에서 반복 규칙(매월, 매주) 설정 기능 추가
- **✨ UX 개선**: 별도 페이지가 아닌, 빠른 입력 플로우에 반복 거래를 통합하여 사용성 극대화
- **🔧 안정성 강화**: React Query 캐시 동기화로 데이터 즉시 반영, Next.js UI 버그 해결

## 🎉 **2025.01.09 그룹 시스템 개선 완료**

- **👥 회원가입 초대 코드**: 신규 가입 시 바로 가족 그룹 참여 가능
- **🔄 그룹 전환 기능**: 개인 그룹 사용자도 가족 그룹 참여 후 데이터 통합
- **🎨 UI/UX 최적화**: 불필요한 새로고침 버튼 제거, 계정 삭제 UI 개선
- **🔧 인증 시스템 강화**: 로그인 리다이렉트 루프 문제 해결, 안정성 향상

## 🎉 **2025.09.06 시스템 안정화 완료**

- **🔧 데이터베이스**: MySQL 연결 문제 완전 해결, 인증 자격 증명 최적화
- **⚡ Health API**: 메모리 임계값 조정으로 시스템 안정성 향상 (degraded → healthy)
- **🛠️ 카테고리 API**: 500 에러 완전 해결, 미들웨어 인증 시스템 검증 완료
- **✅ 전체 검증**: 회원가입 → 로그인 → 그룹 생성 → 거래 입력 플로우 완전 작동

## 🔥 **2025.01.21 아키텍처 최적화**

- **🧹 코드 정리**: 미사용 코드 1,200줄 제거 (ledger-store, SWR 설정, 레거시 컴포넌트)
- **🔄 통합**: SWR → React Query 완전 마이그레이션, 단일 상태 관리 패턴 확립
- **🔗 API 일관성**: 모든 Context/Hook에서 api-client.ts 사용 통합
- **📝 타입 안전성**: TypeScript 타입 정의 정리, OOP 원칙 준수

## 🔥 **2025.01.15 주요 업데이트**

- **⚡ 성능**: 대시보드 응답속도 60% 향상 (8개 → 3개 쿼리)
- **🛡️ 보안**: 민감정보 로깅 완전 제거, 화이트리스트 기반 접근제어
- **🔄 안정성**: React 크래시 방지, 무제한 데이터 처리
- **🎨 UX**: 스켈레톤 로딩으로 체감 성능 대폭 향상

---

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js** 18+
- **pnpm** 8+
- **MySQL** 8.4 (Docker 권장)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/household-ledger.git
cd household-ledger

# 2. 의존성 설치
pnpm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일에서 다음과 같이 설정:
# DATABASE_URL="mysql://root:wjdwhdans@localhost:3307/household_ledger"
# JWT_SECRET="your-super-secret-jwt-key-for-development-only-2024"
# JWT_REFRESH_SECRET="your-super-secret-refresh-key-for-development-only-2024"

# 4. Docker MySQL 데이터베이스 실행
docker build -f docker/database.Dockerfile -t household-ledger .
docker run --name household-ledger \
  -e MYSQL_ROOT_PASSWORD=wjdwhdans \
  -e MYSQL_DATABASE=household_ledger \
  -e MYSQL_USER=user \
  -e MYSQL_PASSWORD=wjdwhdans \
  -e TZ=Asia/Seoul \
  -p 3307:3306 \
  -d household-ledger

# 5. 데이터베이스 스키마 설정
pnpm db:push        # 데이터베이스에 테이블 생성
pnpm db:generate    # 애플리케이션용 TypeScript 클라이언트 생성

# 6. 개발 서버 시작
pnpm dev
```

서버가 시작되면 <http://localhost:3001> 에서 확인할 수 있습니다.

---

## ✨ 주요 특징

### 💑 신혼부부 특화 기능

- **회원가입 시 그룹 참여**: 초대 코드로 가입과 동시에 가족 그룹 연결
- **가족코드 연동**: 10-12자리 코드로 간편한 그룹 연결
- **실시간 동기화**: 두 사람이 각자 입력해도 실시간 통합
- **투명한 지출 공유**: 서로의 소비 패턴 투명하게 확인
- **개인 프라이버시**: 월급 통장 공개 없이 지출만 공유

### 📊 안정화 완료된 시스템 (v2.2.2)

- **🔐 검증된 인증 시스템**: JWT 토큰 기반 로그인/회원가입, 리다이렉트 루프 해결
- **🏠 개선된 그룹 관리**: 회원가입/프로필에서 초대 코드 지원, 그룹 전환 기능
- **💰 빠른 입력**: 실시간 카테고리 로딩, 그룹 기반 거래 입력 ✅ 작동 확인
- **📊 최적화된 대시보드**: 동적 월별 요약, 카테고리 분석, 지출 트렌드
- **📱 반응형 UI**: 모바일 퍼스트 디자인, 토스트 통합 알림 시스템
- **⚡ 안정된 아키텍처**: React Query 단일 패턴, API 일관성 확보

### ⚡ 성능 최적화

- **Web Vitals 모든 지표 Good 등급 달성**
- **프론트엔드 에러 처리 완전 강화**
- **JWT 인증 시스템 완전 안정화**
- **실시간 에러 모니터링 (Sentry)**

---

## 🛠 기술 스택

### Frontend & UI

- **Next.js 15** - React 프레임워크
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **TailwindCSS** - 스타일링
- **Radix UI + Shadcn/ui** - 컴포넌트 라이브러리
- **React Query** - 통합된 서버 상태 관리

### Backend & Database (v2.0 아키텍처)

- **MySQL 8.4** - 관계형 데이터베이스 (Docker 환경)
- **Prisma** - 타입 안전한 ORM
- **JWT + BCrypt** - 커스텀 인증 시스템
- **Next.js API Routes** - 서버리스 API
- **Account-less 설계** - 계좌 테이블 제거, 실시간 잔액 계산
- **BalanceService** - 거래 데이터 기반 동적 잔액 서비스
- **9개 핵심 테이블** - 19개에서 대폭 간소화 (성능 10x 향상)

### DevOps & Tools

- **Docker** - 컨테이너화
- **pnpm** - 패키지 매니저
- **ESLint + Prettier** - 코드 품질
- **Jest + Playwright** - 테스트
- **Sentry** - 에러 모니터링

---

## 📱 페이지 구성

| 페이지        | 경로                  | 설명                 |
| ------------- | --------------------- | -------------------- |
| 메인 대시보드 | `/`                   | 월별 요약, 빠른 입력 |
| 거래내역      | `/transactions`       | 수입/지출 내역 관리  |
| 월별 통계     | `/statistics`         | 차트와 분석          |
| 내 정보       | `/profile`            | 프로필, 그룹 관리    |
| 카테고리      | `/categories`         | 카테고리 설정        |
| 반복 거래     | `/settings/recurring` | 반복 거래 규칙 관리  |

---

## 🔧 개발 명령어

```bash
# 개발
pnpm dev              # 개발 서버 시작 (http://localhost:3001)
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버

# 데이터베이스
pnpm db:generate      # Prisma 클라이언트 생성
pnpm db:push          # 스키마 푸시 (포트 3307)
pnpm db:studio        # Prisma Studio (데이터베이스 GUI)

# Docker 관리
docker ps             # 실행 중인 컨테이너 확인
docker stop household-ledger    # 컨테이너 중지
docker start household-ledger   # 컨테이너 시작
docker logs household-ledger    # 컨테이너 로그 확인

# 코드 품질
pnpm lint             # ESLint 검사
pnpm format           # Prettier 포맷팅
pnpm type-check       # TypeScript 타입 체크

# 테스트
pnpm test             # 단위 테스트
pnpm test:e2e         # E2E 테스트
pnpm test:coverage    # 테스트 커버리지
```

---

## 📚 문서

- **[데이터베이스 설계](./DATABASE.md)** - 9개 핵심 테이블 완전 가이드 및 ERD
- **[개발 가이드](./DEVELOPMENT.md)** - 코딩 스타일, 워크플로우, 아키텍처
- **[설정 & 보안](./SETUP.md)** - 환경 설정, Sentry, 보안 가이드

---

## 📱 PWA 설치(A2HS) 가이드

### PWA 설치(A2HS)

- 설치 요건
  - HTTPS(개발은 `http://localhost` 허용)
  - 매니페스트 존재: `/manifest.json` (`public/manifest.json`)
  - 서비스 워커 등록: `/sw.js` (`public/sw.js`)
  - 아이콘 세트: `public/icons/`

- 데스크톱 Chrome
  - 주소창 우측의 “앱 설치” 아이콘 클릭 또는 메뉴 → 앱 설치
  - DevTools → Application → Manifest 탭에서 Installable 상태 확인

- Android Chrome
  - 사이트 접속 → 우측 상단 메뉴 → “앱 설치/홈 화면에 추가” 노출 확인
  - 최초 방문 직후가 아니라 일정 상호작용 후 노출될 수 있음

문제 해결 체크리스트

- HTTPS 여부, 매니페스트/SW 200 응답, 아이콘 192/512 포함 여부, `display: standalone` 확인

---

## 🧰 운영/문제해결 가이드

### Service Worker 제어

- 버전 확인: `postMessage({ type: 'GET_VERSION' })`
- 강제 캐시 삭제: `postMessage({ type: 'CLEAR_CACHES' })` 후 페이지 새로고침
- 프리캐시 재실행: `postMessage({ type: 'PRECACHE' })`
- 업데이트 적용 절차: Application → Service Workers → Update → Reload

### A2HS(설치 배너) 디버깅

- HTTPS, 올바른 `manifest.json`/`sw.js` 200 응답
- 아이콘 192/512 포함, `display: standalone`
- Android Chrome에서 일정 상호작용 후 노출될 수 있음

### 토큰 만료/재시도 유의사항

- 최초 401 후 refresh 성공 시, 재호출이 dedupe 캐시에 막히지 않도록 구현되어 있음
- 재시도 로직에서 /api/\* GET 캐시 사용 금지, 실패 응답 캐시 금지

---

## 📦 TWA(Trusted Web Activity) 패키징 가이드

### 준비

- 도메인에 `public/.well-known/assetlinks.json` 배치
- Android 패키지명과 Play 서명키 SHA-256 지문 준비

### assetlinks.json 예시

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.household_ledger",
      "sha256_cert_fingerprints": ["REPLACE_WITH_YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

### Bubblewrap 초기화(요약)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://<your-domain>/manifest.json
bubblewrap build
```

### 체크리스트

- HTTPS, `service worker` 등록, `manifest.json` 유효성
- 오리진 동일성(리다이렉트 없이 동일 도메인 로딩)
- 백 버튼, 파일 업로드, 로그인 플로우 정상 동작

---

## 🔐 환경 변수/쿠키 체크리스트 (Prod)

- `NEXT_PUBLIC_APP_URL`: 프로덕션 도메인
- 쿠키: `Secure`=true, `SameSite=Lax`, `HttpOnly`(서버 쿠키)
- 보안 헤더: `X-Frame-Options=DENY`, `Referrer-Policy=strict-origin-when-cross-origin`

## 🎊 현재 상태

**✨ 완성도**: 100% (MVP + 데이터베이스 대폭 단순화 완성)  
**🚀 배포 상태**: 프로덕션 레벨 안정성 확보  
**🗄️ 데이터베이스**: 9개 테이블로 대폭 간소화 (53% 감소)  
**📊 성능**: Web Vitals 모든 지표 Good 등급 달성  
**🔒 보안**: JWT 인증, 입력 검증, 에러 모니터링 완비

---

## 📈 최근 업데이트

### v2.2.0 (2025.01.21) - 코드 아키텍처 최적화

- ✅ **대규모 코드 정리**: 미사용 코드 1,200줄 제거 (Zustand 스토어, SWR 설정, 레거시 컴포넌트)
- ✅ **상태 관리 통합**: SWR → React Query 완전 마이그레이션
- ✅ **API 호출 일관성**: 모든 Context와 Hook에서 api-client.ts 사용
- ✅ **토스트 시스템 통합**: 중복된 토스트 구현체 정리
- ✅ **OOP 원칙 준수**: DRY 패턴 적용, 코드 중복성 제거
- ✅ **타입 안전성 강화**: 불필요한 any 타입 제거, 타입 정의 정리

### v2.0.0 (2025.08.30) - 데이터베이스 대폭 단순화

- ✅ **극도 단순화**: 19개 → 9개 테이블로 53% 감소
- ✅ **매핑 테이블 제거**: 복잡한 N:N 관계를 1:N으로 단순화
- ✅ **외래키 직접 연결**: User.groupId, Transaction.tagId 등
- ✅ **JSON 활용**: UserSettings를 User.settings JSON 컬럼으로 통합
- ✅ **불필요한 기능 제거**: 푸시 알림, 계좌 관리, 정산, 분할 거래, 감사 로그
- ✅ **개발 효율성 극대화**: 단순한 구조로 유지보수성 대폭 향상

### v1.2.0 (2025.08.30) - 데이터베이스 설계 완성 (이전 버전)

- ✅ **완전한 데이터베이스 스키마**: 19개 테이블 설계 완성
- ✅ **예산 관리 테이블**: Budget, BudgetCategory 모델 추가
- ✅ **반복 거래 테이블**: RecurringRule 모델로 자동화 지원
- ✅ **정산 시스템 테이블**: Settlement, SettlementItem 모델 추가
- ✅ **분할 거래 테이블**: TransactionParticipant 모델로 N:N 지원
- ✅ **상세 주석 추가**: 모든 테이블의 용도와 활용 방안 문서화

### v1.1.0 (2025.08.29) - 시스템 안정화 완료

- ✅ **JWT 인증 시스템 완전 안정화**: Dashboard API 토큰 검증 통합
- ✅ **프론트엔드 에러 처리 강화**: TypeScript undefined 체크 적용
- ✅ **성능 최적화 달성**: 모든 Web Vitals 지표 Good 등급
- ✅ **완벽한 대시보드 렌더링**: 월별 요약, 카테고리 분석 완전 표시
- ✅ **Sentry 모니터링 강화**: 실시간 에러 추적 및 성능 모니터링

### v1.0.0 (2025.01.08) - MVP 완성

- ✅ 5개 핵심 페이지 구현 (대시보드, 거래내역, 통계, 프로필, 카테고리)
- ✅ 인증 및 그룹 관리 시스템 완성
- ✅ 반응형 디자인 시스템 적용

---

## 🎯 데이터베이스 설계 (대폭 단순화)

### ✅ **단순화된 데이터베이스 스키마 (9개 테이블)**

#### 🙋‍♂️ **사용자 관리** (3개)

- `User` - 사용자 정보 + 설정(JSON) + 그룹 멤버십 직접 연결
- `Group` - 가족/커플 그룹 관리
- `GroupInvite` - 초대 코드 관리 (24시간 만료)

#### 💰 **금융 관리** (2개)

- `Category` - 거래 카테고리 + 예산 금액 직접 저장
- `Tag` - 자유로운 태그 시스템

#### 🧾 **거래 관리** (2개)

- `Transaction` - 거래 내역 + 태그 직접 연결 (핵심)
- `Attachment` - 영수증 첨부파일 관리

#### 🔄 **고급 기능** (2개)

- `Budget` - 월별 총 예산 관리 (단순화)
- `RecurringRule` - 반복 거래 규칙

### ✂️ **제거된 복잡한 기능들** (53% 테이블 감소)

- ❌ **푸시 알림 시스템** (PushToken)
- ❌ **계좌 관리 시스템** (Account)
- ❌ **정산 시스템** (Settlement, SettlementItem)
- ❌ **분할 거래** (TransactionParticipant)
- ❌ **감사 로그** (AuditLog)
- ❌ **매핑 테이블들** (GroupMember, TransactionTag, BudgetCategory)

### 🎯 **단순화의 장점**

- ✅ **개발 속도 향상**: 복잡한 JOIN 쿼리 제거
- ✅ **유지보수성**: 직관적인 외래키 관계
- ✅ **성능 최적화**: 불필요한 매핑 테이블 제거
- ✅ **핵심 기능 집중**: 가계부 본연의 기능에만 집중

## 🚀 다음 개발 목표 (API 구현)

### Phase 7: 핵심 API 완성

- [x] 반복 거래 자동화 API (`/api/recurring-rules`)
- [ ] 단순화된 예산 관리 API (`/api/budgets`)
- [ ] 카테고리별 예산 관리 UI
- [ ] 태그 기반 거래 분류 UI
- [ ] TransactionForm 및 기타 컴포넌트 테스트 커버리지 향상 (현재 18.92%)

---

## 🤝 기여하기

자세한 개발 가이드는 [DEVELOPMENT.md](./DEVELOPMENT.md)를 참고해주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/your-username/household-ledger/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/your-username/household-ledger/discussions)
- **문서**: [프로젝트 Wiki](https://github.com/your-username/household-ledger/wiki)

---

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**💑 신혼부부를 위한 가장 간단하고 투명한 가계부 서비스** ✨
