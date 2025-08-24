# 🏠 Household Ledger

개인 및 그룹 가계부 관리 웹 애플리케이션 프로젝트

## 📖 프로젝트 개요

Household Ledger는 개인과 2인 이상의 그룹이 함께 사용할 수 있는 가계부 웹 애플리케이션입니다. 주요 화폐는 KRW(원화)이며, 직관적이고 아름다운 UI/UX를 제공합니다.

### 🎨 디자인 컨셉 ✨

- **스타일**: 트렌디한 글라스모피즘 (Glassmorphism) 2024 🆕
- **메인 컬러**: Purple-Pink 그라데이션 계열
- **배경**: 다이나믹 그라데이션 + 애니메이션 오브젝트 🆕
- **카드**: 반투명 블러 효과 + 그라데이션 보더 🆕
- **애니메이션**: Fade-in, Slide-up, Bounce, Pulse 효과 (270라인 CSS) 🆕
- **상호작용**: Hover 스케일, 트랜지션, 마이크로인터랙션 🆕
- **차트**: 미래 Pastel 계열의 Donut/Line 차트

## 🚀 기술 스택

### Frontend & Backend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Radix UI + 트렌디한 애니메이션 시스템 🆕
- **State Management**: React Context API + Zustand (가계부용) 🆕
- **Form Management**: React Hook Form + Zod
- **UI 패턴**: 글라스모피즘, 다이나믹 배경, 마이크로인터랙션 🆕

### Database & ORM

- **Database**: MySQL 8.4 (Latest LTS)
- **ORM**: Prisma
- **Container**: Docker

### Authentication

- **Method**: JWT (Access + Refresh Token)
- **Password**: BCrypt hashing
- **Storage**: HTTP-only cookies

### Testing

- **Framework**: Jest + Testing Library
- **Types**: Unit tests, Integration tests, API tests

## ✨ 주요 기능

### 🔐 인증 시스템

- [x] 이메일/비밀번호 회원가입/로그인
- [x] 자동 로그인 (Remember Me)
- [x] 이메일 저장 기능
- [x] JWT 토큰 기반 인증
- [x] 토큰 자동 갱신
- [x] **트렌디한 로그인/회원가입 UI** (글라스모피즘 + 애니메이션) 🆕
- [x] **비밀번호 강도 표시** (실시간 검증) 🆕
- [x] **BCrypt 암호화** (솔트 12라운드) 🆕

### 👥 그룹 관리

- [x] 그룹 생성 및 관리
- [x] 초대 코드를 통한 그룹 참여
- [x] 멤버 역할 관리 (Owner, Admin, Member)
- [x] 그룹 전환 기능

### 💳 계좌 및 거래 관리

- [x] 개인/그룹별 계좌 관리 (CRUD, 검색, 필터링)
- [x] 계좌 타입별 관리 (현금, 카드, 은행, 기타)
- [x] 실시간 금액 포맷팅 및 잔액 표시
- [x] 카테고리 시스템 (기본 15개 + 커스텀)
- [x] 거래 타입별 카테고리 분류 (수입/지출/이체)
- [x] 카테고리 색상 설정 및 미리보기
- [x] **MVP 가계부 시스템** (Zustand 기반 로컬 스토어) 🆕
- [x] **빠른 거래 입력 바** (QuickAddBar 컴포넌트) 🆕
- [x] **거래 내역 리스트** (InboxList 컴포넌트) 🆕
- [x] **프리셋 시스템** (PresetPanel 컴포넌트) 🆕
- [x] **벌크 입력** (BulkInput 컴포넌트) 🆕
- [ ] 수입/지출/이체 거래 기록 (API 연동 대기)
- [ ] 거래 내역 검색 및 필터링
- [ ] 첨부파일 관리

### 💰 분할 및 정산

- [ ] 공동 지출 분할 계산
- [ ] 정산 내역 관리
- [ ] 정산 완료 처리

### 📊 예산 및 분석

- [ ] 월별 예산 설정 및 관리
- [ ] 예산 진행률 추적
- [ ] 지출 분석 대시보드
- [ ] 차트 및 그래프

### 🔄 추가 기능

- [ ] 정기 거래 관리
- [ ] CSV 가져오기/내보내기
- [ ] 사용자 프로필 관리
- [ ] 감사 로그 (선택사항)

## 🏗️ 프로젝트 구조

```text
household-ledger/
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router
│   │   ├── 📁 api/            # API Routes
│   │   │   ├── 📁 auth/       # 인증 API
│   │   │   ├── 📁 groups/     # 그룹 API
│   │   │   ├── 📁 accounts/   # 계좌 API ✨
│   │   │   ├── 📁 categories/ # 카테고리 API ✨
│   │   │   └── 📁 transactions/ # 거래 API ✨ 새로 추가
│   │   ├── 📁 settings/       # 설정 페이지 ✨
│   │   │   ├── 📁 accounts/   # 계좌 관리 페이지
│   │   │   └── 📁 categories/ # 카테고리 관리 페이지
│   │   ├── 📁 ledger/         # MVP 가계부 페이지 🆕
│   │   ├── 📁 login/          # 트렌디한 로그인 페이지 🆕
│   │   ├── 📁 signup/         # 트렌디한 회원가입 페이지 🆕
│   │   └── 📄 page.tsx        # 트렌디한 홈페이지 (3단계 상태별 UI) 🆕
│   ├── 📁 components/          # 재사용 컴포넌트
│   │   ├── 📁 ui/             # UI 컴포넌트 (Radix UI)
│   │   ├── 📁 accounts/       # 계좌 관련 컴포넌트 ✨
│   │   ├── 📁 categories/     # 카테고리 관련 컴포넌트 ✨
│   │   ├── 📁 ledger/         # 가계부 컴포넌트 (4개 컴포넌트) 🆕
│   │   └── 📁 layouts/        # 레이아웃 컴포넌트
│   ├── 📁 contexts/           # React Context
│   ├── 📁 stores/             # Zustand 스토어 (가계부) 🆕
│   ├── 📁 lib/                # 유틸리티 라이브러리
│   │   ├── 📁 schemas/        # Zod 스키마 ✨
│   │   ├── 📁 utils/          # 유틸리티 함수 ✨
│   │   └── 📁 adapters/       # Context-Zustand 브릿지 🆕
│   └── 📁 types/              # TypeScript 타입 정의 + 가계부 타입 🆕
├── 📁 prisma/                 # 데이터베이스 스키마 (15개 테이블)
├── 📁 docker/                 # Docker 설정
├── 📁 tests/                  # 테스트 파일 (50+ 테스트)
└── 📄 package.json
```

## 🐳 Docker로 데이터베이스 실행

### 자동화 스크립트 사용 (권장)

```bash
# Docker 폴더로 이동
cd docker

# MySQL 시작 (이미지가 없으면 자동 빌드)
./run-mysql.sh start

# 상태 확인
./run-mysql.sh status

# MySQL 접속
./run-mysql.sh connect

# 도움말
./run-mysql.sh help
```

### 수동 Docker 명령어

```bash
# 이미지 빌드
cd docker
docker build -f database.Dockerfile -t household-ledger-mysql .

# 컨테이너 실행
docker run -d \
  --name household-ledger-mysql \
  -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=household_ledger_root_password \
  -e MYSQL_DATABASE=household_ledger \
  -e MYSQL_USER=household_user \
  -e MYSQL_PASSWORD=household_password \
  -e TZ=Asia/Seoul \
  -v mysql_data:/var/lib/mysql \
  --restart unless-stopped \
  household-ledger-mysql
```

### 데이터베이스 연결 정보

- **Host**: `localhost`
- **Port**: `3307`
- **Database**: `household_ledger`
- **Username**: `household_user`
- **Password**: `household_password`

## 🛠️ 개발 환경 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd household-ledger
pnpm install
```

### 2. 환경 변수 설정

```bash
# .env.local 파일 생성
cp env.example .env.local

# 필요한 환경 변수 설정
DATABASE_URL="mysql://household_user:household_password@localhost:3307/household_ledger"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### 3. 데이터베이스 설정

```bash
# Docker로 MySQL 실행
cd docker
./run-mysql.sh start

# Prisma 마이그레이션 및 시드 데이터
pnpm db:push
pnpm db:seed
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

애플리케이션이 <http://localhost:3000> 에서 실행됩니다.

### 🎯 현재 서비스 상태 (2024.08.24 업데이트) 🆕

✅ **모든 페이지 정상 작동**

- **메인 페이지**: `http://localhost:3000` - 트렌디한 3단계 상태별 UI
- **로그인**: `http://localhost:3000/login` - 글라스모피즘 디자인
- **회원가입**: `http://localhost:3000/signup` - 비밀번호 강도 표시
- **가계부 MVP**: `http://localhost:3000/ledger` - Zustand 기반 빠른 입력
- **설정**: `http://localhost:3000/settings/accounts` - 계좌/카테고리 관리

🚀 **시스템 완전 복구 완료** - 모든 오류 해결, 의존성 재설치, 서버 안정화

## 🧪 테스트

### 테스트 실행

```bash
# 모든 테스트 실행
pnpm test

# 테스트 파일 감시 모드
pnpm test:watch

# 커버리지 확인
pnpm test:coverage

# 특정 타입 테스트만 실행
pnpm test:api        # API 테스트
pnpm test:lib        # 라이브러리 테스트
pnpm test:components # 컴포넌트 테스트
```

### 테스트 구조

```text
tests/
├── api/            # API 엔드포인트 테스트
├── lib/            # 유틸리티 함수 테스트
├── components/     # 컴포넌트 테스트
├── integration/    # 통합 테스트
└── utils/          # 테스트 헬퍼 함수
```

## 📋 개발 진행 상황

### ✅ 완료된 기능

#### **🎯 핵심 시스템**

- [x] **프로젝트 초기 설정**: Next.js 15 + TypeScript + Tailwind CSS v4
- [x] **데이터베이스 스키마**: Prisma + MySQL 15개 테이블 설계
- [x] **인증 시스템**: JWT 기반 회원가입/로그인/토큰 갱신 + BCrypt 암호화 🆕
- [x] **UI 시스템**: Radix UI 기반 컴포넌트 라이브러리
- [x] **그룹 관리**: 그룹 생성/초대/멤버 관리/그룹 전환
- [x] **테스트 환경**: Jest + Testing Library (50+ 테스트 케이스)
- [x] **Docker 환경**: MySQL 8.4 컨테이너 설정

#### **🎨 트렌디한 디자인 시스템 (2024 업그레이드)** 🆕

- [x] **글라스모피즘**: 반투명 블러 카드, 그라데이션 보더, 배경 효과
- [x] **애니메이션 시스템**: 270라인 CSS (fade-in, slide-up, bounce, pulse, spin)
- [x] **다이나믹 배경**: 3개의 떠다니는 컬러 오브젝트 + 그라데이션
- [x] **상호작용**: 호버 스케일, 트랜지션, 마이크로인터랙션
- [x] **상태별 테마**: 로그인 필요/그룹 생성/대시보드 각각 다른 색상 테마
- [x] **모던 로그인/회원가입**: 비밀번호 강도 표시, 애니메이션 UX

#### **💰 MVP 가계부 시스템** 🆕

- [x] **Zustand 스토어**: 로컬 상태 관리 + localStorage 퍼시스트
- [x] **빠른 입력 바**: 날짜/타입/금액/카테고리/계좌/메모 원클릭 입력
- [x] **거래 내역 리스트**: 최신순, 테이블/카드 반응형 디자인
- [x] **프리셋 시스템**: 자주 사용하는 거래 템플릿 관리
- [x] **벌크 입력**: 텍스트 붙여넣기로 일괄 거래 등록
- [x] **타입 정의**: 완전한 TypeScript 타입 시스템

#### **⚙️ 관리 시스템**

- [x] **계좌 관리**: CRUD, 타입별 관리, 검색/필터링, 소유권 검증
- [x] **카테고리 관리**: 기본 15개 시드, 커스텀 생성, 색상 설정, CRUD
- [x] **설정 페이지**: 통합 설정 레이아웃, 계좌/카테고리 관리 UI

#### **🔧 시스템 안정성** 🆕

- [x] **완전 복구**: 포트 충돌, 캐시 이슈, 의존성 문제 모두 해결
- [x] **서버 안정화**: HTTP 200 OK 모든 페이지 정상 작동
- [x] **의존성 관리**: pnpm + postinstall 스크립트 + Prisma 생성 자동화

### 🚧 진행 예정

- [ ] **사용자 프로필 관리**: 개인 정보 수정, 비밀번호 변경
- [ ] **거래 관리**: CRUD, 검색/필터링, 첨부파일
- [ ] **분할 및 정산**: 공동 지출 계산, 정산 관리
- [ ] **예산 관리**: 월별 예산, 진행률 추적
- [ ] **분석 대시보드**: 차트, 통계, 리포트
- [ ] **가져오기/내보내기**: CSV 파일 처리
- [ ] **성능 최적화**: 코드 분할, 캐싱, 배포 준비

## 📚 추가 문서

- [📋 GOAL.md](./GOAL.md) - 프로젝트 목표 및 상세 계획
- [📝 TODO.md](./TODO.md) - 상세 작업 목록
- [🐳 docker/README.md](./docker/README.md) - Docker 설정 가이드
- [🔧 docker/docker-commands.md](./docker/docker-commands.md) - Docker 명령어 참고서

## 🤝 기여 방법

1. 이슈 생성 또는 기존 이슈 확인
2. 브랜치 생성: `git checkout -b feature/새기능`
3. 변경사항 커밋: `git commit -m '새기능: 설명'`
4. 브랜치 푸시: `git push origin feature/새기능`
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 🎊 **최신 업데이트 완료!** (2024.08.24) 🆕

### ✨ **트렌디한 2024 디자인 시스템 완전 적용**

- 🌟 **글라스모피즘 + 애니메이션**: 270라인 CSS로 구현된 모던한 UI/UX
- 🎨 **3단계 상태별 테마**: 비로그인/그룹생성/대시보드 각각 다른 색상 시스템
- 🚀 **완전 안정화**: 모든 시스템 오류 해결, 의존성 재설치, 서버 정상화

### 💰 **MVP 가계부 시스템 준비 완료**

- ⚡ **Zustand 스토어**: 빠른 로컬 상태 관리 + 퍼시스트
- 🎯 **4개 핵심 컴포넌트**: QuickAdd/InboxList/Preset/BulkInput
- 🔗 **API 연동 대기**: 백엔드 API와 연결만 남음

---

🏠 **Household Ledger - 스마트한 가계부 관리의 시작**

Made with ❤️ using Next.js, TypeScript, Glassmorphism and Modern Web Technologies
