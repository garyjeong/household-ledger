# TODO Roadmap

## Middleware & Auth
- [ ] `isPublicPath`, `isProtectedPath`, `isAdminPath` 로직 완성 및 테스트
- [ ] 인증 실패 시 리다이렉트/JSON 응답 정책 일관화

## Dashboard: Monthly Data
- [x] `useMonthlyStats`가 `year/month` 파라미터로 API 호출하도록 수정
- [x] 월 이동 시 항상 서버 재요청(캐시 비활성화: `staleTime=0`, `refetch*='always'`)
- [ ] `usePrefetchMonthlyStats` 내부도 `year/month` 경로 확인 및 정합성 점검
- [ ] 월 변경 로딩/빈 상태/에러 상태 UI 품질 점검

## Quick Add (빠른 입력)
- [x] 금액 인풋 백스페이스 작동 복구
- [x] 빠른 금액 버튼 누적 및 포커스 유지
- [ ] 금액 입력 로직을 `AmountInput`로 통합하여 중복 제거
- [ ] 거래 `type`(대문자/소문자) 전 구간 정규화

## Pagination
- [ ] 거래 리스트 커서 기반 페이지네이션으로 전환(nextCursor/prevCursor)
- [ ] 프런트 훅/컴포넌트 연동 및 테스트 업데이트

## Optimized Stats (통계 쿼리)
- [ ] 모든 `$queryRaw` 파라미터 바인딩/검증(그룹/비그룹 케이스 포함)
- [ ] `getOptimizedMonthlyStats` 결과에 대한 단위/통합 테스트 추가

## UX & Accessibility
- [ ] 키보드 포커스/ESC/Enter 동작 일관성 강화
- [ ] 주요 컨트롤에 ARIA 라벨/대비 검사 보완
- [ ] 로딩/빈 상태/에러 메시지 카피 통일

## Logging & Observability
- [x] 레거시 페이지네이션 경고 로그(test 외) 억제
- [ ] 로그 레벨 정책 정리(개발/운영), 핵심 API 구조화 로그(요청 파라미터/소요시간)

## Security
- [ ] 쿠키 플래그 재점검(HttpOnly/Secure/SameSite)
- [ ] 민감 경로 레이트 리밋 도입 검토
- [ ] 쿠키 기반 인증의 CSRF 영향 검토 및 대응(필요 시 토큰/헤더)

## Tests
- [ ] E2E: 월 이동, 그룹 필터, 빠른 입력 포커스/누적
- [ ] 유닛: `useMonthlyStats` 파라미터 빌드/키 정합성
- [ ] 계약: `/api/dashboard/monthly-stats` 파라미터/응답 스키마
