# 🚀 성능 모니터링 및 최적화 가이드

이 문서는 우리가족가계부 프로젝트의 성능 최적화 전략과 모니터링 시스템을 설명합니다.

## 📊 구현된 성능 최적화 기능

### 1. Web Vitals 실시간 모니터링

#### 🎯 측정 지표

- **LCP (Largest Contentful Paint)**: 목표 ≤2.5초
- **FID (First Input Delay)**: 목표 ≤100ms
- **CLS (Cumulative Layout Shift)**: 목표 ≤0.1
- **FCP (First Contentful Paint)**: 목표 ≤1.8초
- **TTFB (Time to First Byte)**: 목표 ≤800ms
- **INP (Interaction to Next Paint)**: 목표 ≤200ms

#### 🔧 구현 세부사항

```typescript
// Web Vitals 자동 측정 및 보고
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter'

// 전역 레이아웃에 통합
<WebVitalsReporter />
```

#### 📈 모니터링 대상

- **Sentry 통합**: 성능 메트릭 자동 전송
- **로컬 스토리지**: 개발 환경 디버깅용 데이터 저장
- **Google Analytics**: 사용자 성능 데이터 수집 (선택사항)

### 2. React 성능 최적화

#### ⚡ 메모이제이션 적용

```typescript
// 컴포넌트 레벨 최적화
const BalanceWidget = memo(function BalanceWidget({ ... }) {
  // useMemo를 활용한 계산 최적화
  const formatCurrency = useMemo(() =>
    (amount: number) => new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: safeBalanceData.currency,
    }).format(amount),
    [safeBalanceData.currency]
  )

  // 조건부 렌더링 최적화
  const isPositive = useMemo(() =>
    balanceData?.totalBalance >= 0,
    [balanceData?.totalBalance]
  )
})
```

#### 🔧 적용된 컴포넌트

- ✅ `Button` - UI 컴포넌트 메모이제이션
- ✅ `BalanceWidget` - 잔액 위젯 최적화
- ✅ `OptimizedImage` - 이미지 컴포넌트 최적화

### 3. 데이터 캐싱 전략 (SWR)

#### 🗄️ 캐싱 설정

```typescript
// SWR 전역 설정
export const swrConfig: SWRConfiguration = {
  dedupingInterval: 2000, // 2초 내 중복 요청 방지
  focusThrottleInterval: 5000, // 5초 내 포커스 재검증 방지
  revalidateOnFocus: true, // 포커스 시 자동 재검증
  errorRetryCount: 3, // 최대 3회 재시도
}
```

#### 📡 구현된 훅

- ✅ `useBalance` - 잔액 데이터 캐싱
- ✅ `useTransactions` - 거래 내역 캐싱
- ✅ `useRecentTransactions` - 최근 거래 캐싱

#### 🔄 캐시 무효화 패턴

```typescript
// 거래 추가 시 관련 캐시 자동 무효화
const CACHE_INVALIDATION_PATTERNS = {
  TRANSACTION_CHANGE: (ownerType, ownerId) => [
    CACHE_KEYS.BALANCE(ownerType, ownerId),
    CACHE_KEYS.TRANSACTIONS(ownerType, ownerId),
  ],
}
```

#### ⚡ 낙관적 업데이트

```typescript
// 즉시 UI 업데이트 후 서버 동기화
const optimisticUpdate = async (balanceChange: number) => {
  // 1. 즉시 UI 업데이트
  await mutateSingle(optimisticData, false)

  // 2. 1초 후 서버 동기화
  setTimeout(() => mutateSingle(), 1000)
}
```

### 4. 이미지 최적화

#### 🖼️ Next.js 이미지 설정

```typescript
// next.config.ts
images: {
  formats: ['image/webp', 'image/avif'],  // 현대적 이미지 형식
  quality: 80,                            // 최적화된 품질
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  minimumCacheTTL: 60,                   // 1분 캐시
}
```

#### 🧩 최적화된 컴포넌트

```typescript
// 최적화된 이미지 컴포넌트
<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  priority={false}
  placeholder="blur"
  fallbackSrc="/fallback.jpg"
  showLoading={true}
/>

// 아바타 전용 컴포넌트
<Avatar
  src="/user-avatar.jpg"
  size={40}
  alt="User Avatar"
/>
```

#### 🛠️ 이미지 유틸리티

- ✅ 반응형 sizes 자동 생성
- ✅ 클라이언트 이미지 압축
- ✅ 다양한 CDN 지원 (Cloudinary 등)
- ✅ 프리로딩 및 지연 로딩

### 5. Lighthouse CI 성능 모니터링

#### 📋 자동 측정 항목

```json
{
  "assertions": {
    "categories:performance": ["warn", { "minScore": 0.85 }],
    "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
    "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
    "total-blocking-time": ["warn", { "maxNumericValue": 200 }]
  }
}
```

#### 🎯 측정 페이지

- ✅ 메인 페이지 (`/`)
- ✅ 로그인 페이지 (`/login`)
- ✅ 가계부 페이지 (`/ledger`)
- ✅ 그룹 페이지 (`/groups`)

#### 📊 성능 임계값

| 지표        | 좋음   | 개선 필요 | 나쁨   |
| ----------- | ------ | --------- | ------ |
| Performance | ≥85    | 65-84     | <65    |
| LCP         | ≤2.5s  | 2.5-4.0s  | >4.0s  |
| FID         | ≤100ms | 100-300ms | >300ms |
| CLS         | ≤0.1   | 0.1-0.25  | >0.25  |

## 🔧 사용 가이드

### 개발 환경에서 성능 모니터링

#### 1. Web Vitals 실시간 확인

```bash
# 개발 서버 실행
pnpm dev

# 브라우저 콘솔에서 성능 데이터 확인
console.log('📊 Web Vitals Summary')
```

#### 2. 성능 대시보드 접근

- 개발 모드에서만 표시되는 성능 대시보드
- 실시간 Web Vitals 데이터 시각화
- 성능 개선 권장사항 제공

#### 3. SWR 캐시 상태 확인

```typescript
// 캐시된 데이터 조회
const { balance, isLoading, error } = useBalance('USER', userId)

// 수동 새로고침
await refreshBalance()

// 관련 캐시 무효화
await invalidateRelatedCache()
```

### 프로덕션 성능 측정

#### 1. Lighthouse CI 실행

```bash
# 로컬 성능 측정
pnpm build
pnpm start
lhci autorun

# CI/CD에서 자동 실행
# .github/workflows/test-coverage.yml 참조
```

#### 2. 성능 보고서 분석

- **Performance**: 85점 이상 목표
- **LCP**: 2.5초 이하 목표
- **CLS**: 0.1 이하 목표
- **TBT**: 200ms 이하 목표

## 📈 성능 최적화 체크리스트

### ✅ 완료된 최적화

- [x] Web Vitals 실시간 모니터링
- [x] React 컴포넌트 메모이제이션
- [x] SWR 데이터 캐싱 전략
- [x] 이미지 최적화 (WebP, AVIF)
- [x] Lighthouse CI 자동 측정
- [x] 성능 대시보드 구축

### 🔄 추가 최적화 기회

- [ ] 번들 분석 및 코드 스플리팅
- [ ] Service Worker 캐싱
- [ ] 프리로딩 전략 고도화
- [ ] CDN 통합 (이미지, 정적 자원)
- [ ] Database 쿼리 최적화
- [ ] API 응답 압축

## 🚨 성능 경고 대응

### LCP 개선 방법

1. **이미지 최적화**: WebP/AVIF 형식 사용
2. **중요 리소스 프리로드**: `<link rel="preload">`
3. **서버 응답 시간 개선**: 캐싱, CDN 활용
4. **렌더링 차단 리소스 최소화**: CSS/JS 최적화

### FID 개선 방법

1. **JavaScript 번들 크기 줄이기**: 코드 스플리팅
2. **장시간 작업 분할**: Web Workers 활용
3. **사용하지 않는 코드 제거**: Tree shaking
4. **Third-party 스크립트 최적화**: 지연 로딩

### CLS 개선 방법

1. **이미지/광고 크기 지정**: width, height 속성
2. **폰트 최적화**: font-display: swap
3. **동적 콘텐츠 영역 예약**: min-height 설정
4. **애니메이션 최적화**: transform, opacity 사용

## 📊 모니터링 대시보드

### 개발 환경 접근

```url
http://localhost:3001/performance-dashboard
```

### 주요 기능

- ✅ 실시간 Web Vitals 표시
- ✅ 성능 등급 시각화
- ✅ 개선 권장사항 제공
- ✅ 히스토리 추적 및 분석

## 🔗 관련 리소스

### 공식 문서

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [SWR Documentation](https://swr.vercel.app/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### 성능 측정 도구

- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/performance/)

---

**마지막 업데이트**: $(date)  
**버전**: 1.0.0  
**담당자**: Development Team
