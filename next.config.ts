import type { NextConfig } from "next";

// Bundle analyzer 설정
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  
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
  
  // 성능 최적화 설정
  compiler: {
    // React 컴포넌트에서 불필요한 속성 제거
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // console.log 제거 (프로덕션)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // 번들 최적화
  experimental: {
    // 번들 크기 최적화
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },

  // 성능 관련 설정
  poweredByHeader: false, // X-Powered-By 헤더 제거 (보안)
  
};

export default withBundleAnalyzer(nextConfig);
