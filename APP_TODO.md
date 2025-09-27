# PWA 구현 계획 (Minimal Change, 문서 우선)

## 목표

- 기존 Next.js 앱을 설치 가능한 PWA로 완성하고, 이후 TWA(Play 스토어) 패키징까지 확장 가능한 기반을 구축한다.
- 변경 범위 최소화(MCP-원칙), 보안/호환성 유지.

---

### 0단계 — 준비/점검

- [ ] 프로덕션 도메인/HTTPS 준비(필수)
- [ ] Lighthouse 현재 점수 측정(성능/접근성/베프/SEO, PWA 항목)
- [ ] 쿠키 정책 확인: `SameSite=Lax`, `Secure`(prod) 유지

산출물: 초기 진단 기록(Lighthouse 리포트 파일/숫자)

---

### 1단계 — PWA 베이스라인 완성

- [x] `public/manifest.json` 추가(앱명, 색상, start_url, display, orientation, categories)
- [x] 아이콘 세트 추가: `public/icons/` 72, 96, 128, 144, 152, 192, 384, 512 및 maskable 192/512
- [x] `src/app/layout.tsx`에 매니페스트/테마컬러 반영(Next Metadata 또는 `<link rel="manifest">`)
- [x] 경량 Registrar 컴포넌트 도입: 초기 로드 시 1회 `registerServiceWorker()` 호출
- [x] `public/sw.js`의 알림/배지 아이콘 경로를 실제 아이콘으로 교체
- [ ] Android 크롬에서 “홈 화면에 추가” 확인, Lighthouse PWA Pass 달성 (기기에서 확인 필요)

산출물: manifest.json, icons/, Registrar 컴포넌트, 스크린샷/체크리스트

---

### 2단계 — 오프라인/캐시 전략(선택)

- [ ] `sw.js`에 기본 캐시 전략 정의(필수 자원 사전 캐시 또는 network-first 전략)
- [ ] 주요 경로(`/`, `/transactions`, `/statistics`)의 최소 오프라인 경험 제공
- [x] SW 업데이트 전략/버전 관리(activate 시 clients.claim, skipWaiting 메시지 처리)

산출물: 캐시 전략 요약, 테스트 시나리오

---

### 3단계 — 브라우저 푸시(선택)

- [ ] 서버에 `web-push` 도입, VAPID 키 생성(퍼블릭/프라이빗)
- [ ] 구독 저장/해제/테스트 발송 API 추가(`/api/notifications/*`)
- [ ] 환경변수 설정: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- [ ] `NotificationSettings`에서 `setupPushNotifications()` 연결(권한 요청→SW 등록→구독 저장)
- [ ] 테스트 알림 시나리오(1~2개) 검증
  - 현재 요구사항: 웹 푸시는 사용하지 않음 → 전체 섹션 보류 권장

산출물: 구독 저장 테이블/엔드포인트, VAPID 키, 테스트 로그

---

### 4단계 — TWA(Trusted Web Activity) 패키징(옵션)

- [ ] `/.well-known/assetlinks.json` 배치(Play 서명키 SHA-256 지문)
- [ ] `@bubblewrap/cli`로 Android 프로젝트 생성/빌드
- [ ] Play Internal Testing 업로드 후 설치/로그인/백 버튼 확인

산출물: AAB/APK, 테스트 결과

---

### 5단계 — 문서/운영

- [x] README에 PWA 설치/TWA 배포 가이드 섹션 추가
- [x] CI에 Lighthouse CI 도입(임계치 설정)
- [ ] 장애 대응 메모: 토큰 만료, SW 업데이트 루프, 아이콘 누락 등

산출물: 문서 갱신, CI 설정

---

### 수용 기준(Definition of Done)

- 1단계 완료: Android에서 설치 배너 노출, Lighthouse PWA Pass
- 2단계 선택: 핵심 페이지 최소 오프라인 경험
- 3단계 선택: 구독 생성/저장/테스트 알림 발송 성공
- 4단계 옵션: TWA 설치 및 로그인 정상 동작

---

### 작업 메모(참고 코드/파일)

- 서비스워커: `public/sw.js`
- SW 등록 유틸: `src/lib/push-notifications.ts` (`registerServiceWorker`, `setupPushNotifications`)
- 레이아웃/메타데이터: `src/app/layout.tsx`
- 미들웨어 예외 경로: `src/middleware.ts` (manifest, sw.js 제외 설정 있음)
