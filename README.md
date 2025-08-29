# 💑 신혼부부 가계부 서비스

**프로덕션 레벨 안정성을 갖춘 완성된 가계부 MVP!**

신혼부부가 각자 입력해도 자동으로 하나의 가계부로 묶여 지출을 투명하게 공유할 수 있는 **수동 입력 위주의 초간단 가계부**입니다.

**만든 이**: Development Team  
**버전**: 1.1.0  
**마지막 업데이트**: 2025년 8월

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
# .env.local 파일을 편집하여 데이터베이스 URL 등 설정

# 4. 데이터베이스 설정
pnpm db:generate
pnpm db:push

# 5. 개발 서버 시작
pnpm dev
```

서버가 시작되면 <http://localhost:3001> 에서 확인할 수 있습니다.

---

## ✨ 주요 특징

### 💑 신혼부부 특화 기능

- **가족코드 연동**: 10자리 코드로 간편한 그룹 연결
- **실시간 동기화**: 두 사람이 각자 입력해도 실시간 통합
- **투명한 지출 공유**: 서로의 소비 패턴 투명하게 확인
- **개인 프라이버시**: 월급 통장 공개 없이 지출만 공유

### 📊 완성된 MVP 시스템

- **🔐 인증 시스템**: JWT 토큰 기반 로그인/회원가입
- **🏠 그룹 관리**: 초대 코드를 통한 그룹 생성/참여
- **💰 가계부 기능**: 수입/지출 등록, 카테고리/계좌 관리
- **📊 대시보드**: 월별 요약, 카테고리 분석, 지출 트렌드
- **📱 반응형 UI**: 모바일 퍼스트 디자인, 5개 핵심 페이지

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

### Backend & Database

- **MySQL 8.4** - 관계형 데이터베이스 (Docker 환경)
- **Prisma** - 타입 안전한 ORM
- **JWT + BCrypt** - 커스텀 인증 시스템
- **Next.js API Routes** - 서버리스 API

### DevOps & Tools

- **Docker** - 컨테이너화
- **pnpm** - 패키지 매니저
- **ESLint + Prettier** - 코드 품질
- **Jest + Playwright** - 테스트
- **Sentry** - 에러 모니터링

---

## 📱 페이지 구성

| 페이지        | 경로            | 설명                 |
| ------------- | --------------- | -------------------- |
| 메인 대시보드 | `/`             | 월별 요약, 빠른 입력 |
| 거래내역      | `/transactions` | 수입/지출 내역 관리  |
| 월별 통계     | `/statistics`   | 차트와 분석          |
| 내 정보       | `/profile`      | 프로필, 그룹 관리    |
| 카테고리      | `/categories`   | 카테고리 설정        |

---

## 🔧 개발 명령어

```bash
# 개발
pnpm dev              # 개발 서버 시작 (http://localhost:3001)
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버

# 데이터베이스
pnpm db:generate      # Prisma 클라이언트 생성
pnpm db:push          # 스키마 푸시
pnpm db:seed          # 시드 데이터

# 코드 품질
pnpm lint             # ESLint 검사
pnpm format           # Prettier 포맷팅
pnpm type-check       # TypeScript 타입 체크

# 테스트
pnpm test             # 단위 테스트
pnpm e2e              # E2E 테스트
```

---

## 📚 문서

- **[개발 가이드](./DEVELOPMENT.md)** - 코딩 스타일, 워크플로우, 아키텍처
- **[프로젝트 현황](./STATUS.md)** - 진행상황, 완료 기능, 개발 계획
- **[설정 & 보안](./SETUP.md)** - 환경 설정, Sentry, 보안 가이드

---

## 🎊 현재 상태

**✨ 완성도**: 95% (MVP 완료 + 시스템 안정화)  
**🚀 배포 상태**: 프로덕션 레벨 안정성 확보  
**📊 성능**: Web Vitals 모든 지표 Good 등급 달성  
**🔒 보안**: JWT 인증, 입력 검증, 에러 모니터링 완비

---

## 📈 최근 업데이트

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

## 🔄 개발 예정 기능

### Phase 7: 분할 및 정산 시스템 (다음 목표)

- [ ] 그룹 거래 분할 계산 로직
- [ ] 정산 스냅샷 생성 시스템
- [ ] 정산 UI 및 관리 페이지
- [ ] 자동 정산 알림 기능

### Phase 8: 예산 관리 시스템

- [ ] 월별 예산 CRUD API
- [ ] 카테고리별 예산 설정
- [ ] 예산 진행률 UI
- [ ] 예산 초과 경고 알림

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
