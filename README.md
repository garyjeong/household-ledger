# 🏠 Household Ledger

개인 및 그룹 가계부 관리 웹 애플리케이션 프로젝트

## 📖 프로젝트 개요

Household Ledger는 개인과 2인 이상의 그룹이 함께 사용할 수 있는 가계부 웹 애플리케이션입니다. 주요 화폐는 KRW(원화)이며, 직관적이고 아름다운 UI/UX를 제공합니다.

### 🎨 디자인 컨셉
- **메인 컬러**: Purple 계열
- **그라디언트**: Magenta gradient 
- **카드**: White background with rounded corners (12-16px)
- **뱃지/칩**: Lavender 색상
- **차트**: Pastel 계열의 Donut/Line 차트

## 🚀 기술 스택

### Frontend & Backend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Radix UI
- **State Management**: React Context API
- **Form Management**: React Hook Form + Zod

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

### 👥 그룹 관리
- [x] 그룹 생성 및 관리
- [x] 초대 코드를 통한 그룹 참여
- [x] 멤버 역할 관리 (Owner, Admin, Member)
- [x] 그룹 전환 기능

### 💳 계좌 및 거래 관리
- [ ] 개인/그룹별 계좌 관리
- [ ] 수입/지출/이체 거래 기록
- [ ] 카테고리 및 태그 시스템
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

```
household-ledger/
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router
│   │   ├── 📁 api/            # API Routes
│   │   ├── 📁 (auth)/         # 인증 관련 페이지
│   │   └── 📄 page.tsx        # 홈페이지
│   ├── 📁 components/          # 재사용 컴포넌트
│   │   ├── 📁 ui/             # UI 컴포넌트 (Radix UI)
│   │   └── 📁 layouts/        # 레이아웃 컴포넌트
│   ├── 📁 contexts/           # React Context
│   ├── 📁 lib/                # 유틸리티 라이브러리
│   └── 📁 types/              # TypeScript 타입 정의
├── 📁 prisma/                 # 데이터베이스 스키마
├── 📁 docker/                 # Docker 설정
├── 📁 tests/                  # 테스트 파일
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

애플리케이션이 http://localhost:3000 에서 실행됩니다.

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

```
tests/
├── api/            # API 엔드포인트 테스트
├── lib/            # 유틸리티 함수 테스트
├── components/     # 컴포넌트 테스트
├── integration/    # 통합 테스트
└── utils/          # 테스트 헬퍼 함수
```

## 📋 개발 진행 상황

### ✅ 완료된 기능
- [x] **프로젝트 초기 설정**: Next.js + TypeScript + Tailwind CSS
- [x] **데이터베이스 스키마**: Prisma + MySQL 15개 테이블 설계
- [x] **인증 시스템**: JWT 기반 회원가입/로그인/토큰 갱신
- [x] **UI 시스템**: Radix UI 기반 컴포넌트 라이브러리
- [x] **그룹 관리**: 그룹 생성/초대/멤버 관리
- [x] **테스트 환경**: Jest + Testing Library (50+ 테스트 케이스)
- [x] **Docker 환경**: MySQL 8.4 컨테이너 설정

### 🚧 진행 예정
- [ ] **사용자 프로필 관리**: 개인 정보 수정, 비밀번호 변경
- [ ] **계좌 및 카테고리**: 계좌 관리, 카테고리 시스템
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

<div align="center">

**🏠 Household Ledger - 스마트한 가계부 관리의 시작**

Made with ❤️ using Next.js, TypeScript, and Modern Web Technologies

</div>