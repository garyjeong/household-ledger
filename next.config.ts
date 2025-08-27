import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // 기존 설정 옵션들
  
  // Sentry와 호환성을 위한 설정 (Next.js 15.5.0+에서 이동됨)
  serverExternalPackages: ['@sentry/nextjs'],
  
  // 이미지 최적화 설정
  images: {
    // 최적화된 이미지 형식 사용
    formats: ['image/webp', 'image/avif'],
    
    // 이미지 크기 설정
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 외부 이미지 도메인 허용 (CDN 사용 시)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.household-ledger.com', // 추후 CDN 도메인
      },
    ],
    
    // 이미지 최적화 품질은 Next.js Image 컴포넌트에서 개별 설정
    
    // 이미지 로딩 최적화
    minimumCacheTTL: 60, // 1분 캐시
    dangerouslyAllowSVG: false, // 보안상 SVG 비허용
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Source maps 활성화 (Sentry에서 스택 추적을 위해 필요)
  productionBrowserSourceMaps: true,
  
  // Webpack 설정
  webpack: (config, { isServer }) => {
    // Sentry와 호환성을 위한 webpack 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
};

// Sentry 설정 옵션
const sentryWebpackPluginOptions = {
  // Sentry organization과 project 정보
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // 인증 토큰
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Source maps 업로드 설정
  silent: process.env.NODE_ENV === 'production', // 프로덕션에서는 로그 출력 최소화
  widenClientFileUpload: true, // 클라이언트 파일 업로드 범위 확대
  
  // 릴리즈 설정
  automaticVercelMonitors: false, // Vercel 모니터링 자동 생성 비활성화
  
  // 번들 분석기 비활성화 (성능 향상)
  disableLogger: process.env.NODE_ENV === 'production',
  
  // Source maps 숨기기 (보안)
  hideSourceMaps: true,
  
  // 트리 쉐이킹 적용
  treeshake: {
    preset: 'minimal',
  },
};

// Sentry 설정을 적용한 Next.js 설정 내보내기
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
