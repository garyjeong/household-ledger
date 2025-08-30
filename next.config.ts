import type { NextConfig } from "next";

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
  
};

export default nextConfig;
