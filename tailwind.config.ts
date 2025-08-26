import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        sm: '960px',
        md: '1200px',
        lg: '1200px',
        xl: '1200px',
        '2xl': '1200px',
      },
    },
    extend: {
      // 신혼부부 가계부 전용 폰트
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'Noto Sans KR', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'Monaco', 'Menlo', 'monospace'],
      },

      // 신혼부부 가계부 색상 시스템 (하드코딩된 값으로 수정)
      colors: {
        // 메인 컬러 팔레트
        primary: '#3B82F6', // Blue 500
        success: '#10B981', // Emerald 500
        warning: '#F59E0B', // Amber 500
        danger: '#EF4444', // Red 500

        // 텍스트 색상
        text: {
          primary: '#111827', // Gray 900
          secondary: '#6B7280', // Gray 500
          muted: '#9CA3AF', // Gray 400
          white: '#FFFFFF',
          900: '#111827', // Gray 900 (text-text-900 호환)
          700: '#374151', // Gray 700
          500: '#6B7280', // Gray 500
          400: '#9CA3AF', // Gray 400
        },

        // 배경 및 서피스
        surface: {
          primary: '#FFFFFF', // White
          secondary: '#F9FAFB', // Gray 50
          tertiary: '#F3F4F6', // Gray 100
          card: '#FFFFFF', // Card background
          hover: '#F8FAFC', // Slate 50
        },

        // 보더 색상
        border: {
          primary: '#E5E7EB', // Gray 200
          secondary: '#D1D5DB', // Gray 300
          focus: '#3B82F6', // Blue 500
        },

        // 스트로크 색상 (border와 동일하지만 별도 정의)
        stroke: {
          100: '#F3F4F6', // Gray 100
          200: '#E5E7EB', // Gray 200
          300: '#D1D5DB', // Gray 300
        },

        // 상태별 배경색 (밝은 버전)
        state: {
          'success-light': '#D1FAE5', // Emerald 100
          'warning-light': '#FEF3C7', // Amber 100
          'danger-light': '#FEE2E2', // Red 100
          'info-light': '#DBEAFE', // Blue 100
        },

        // 신혼부부 특화 색상
        couple: {
          me: '#3B82F6', // 내 지출 (Blue)
          partner: '#EC4899', // 배우자 지출 (Pink)
          shared: '#10B981', // 공동 지출 (Green)
          'me-light': '#DBEAFE', // 내 지출 밝은 버전
          'partner-light': '#FCE7F3', // 배우자 지출 밝은 버전
          'shared-light': '#D1FAE5', // 공동 지출 밝은 버전
        },

        // Shadcn/ui 호환 색상 (하드코딩된 값으로 수정)
        background: '#FFFFFF',
        foreground: '#111827',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#111827',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#111827',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        accent: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        input: '#E2E8F0',
        ring: '#3B82F6',
        chart: {
          '1': '#3B82F6',
          '2': '#10B981',
          '3': '#F59E0B',
          '4': '#EF4444',
          '5': '#8B5CF6',
        },
      },

      // 신혼부부 가계부 전용 브레이크포인트
      screens: {
        xs: '360px', // 최소 모바일
        'sm-mobile': '428px', // 큰 모바일 (iPhone 12 Pro Max)
        sm: '768px', // 태블릿
        md: '1024px', // 데스크탑
        lg: '1440px', // 큰 데스크탑
        xl: '1920px', // 초대형
        // 유틸리티 브레이크포인트
        'mobile-only': { max: '767px' },
        'tablet-up': { min: '768px' },
        'desktop-up': { min: '1024px' },
      },

      // 신혼부부 가계부 전용 간격
      spacing: {
        '4.5': '1.125rem', // 18px
        '5.5': '1.375rem', // 22px
        '13': '3.25rem', // 52px
        '15': '3.75rem', // 60px
        '17': '4.25rem', // 68px
        '18': '4.5rem', // 72px
        '19': '4.75rem', // 76px
        '21': '5.25rem', // 84px
        '22': '5.5rem', // 88px
        '23': '5.75rem', // 92px
        '25': '6.25rem', // 100px
        '26': '6.5rem', // 104px
        '27': '6.75rem', // 108px
        '29': '7.25rem', // 116px
        '30': '7.5rem', // 120px
      },

      // 신혼부부 가계부 전용 borderRadius
      borderRadius: {
        lg: '0.75rem', // 12px
        xl: '1rem', // 16px
        '2xl': '1.25rem', // 20px
        '3xl': '1.5rem', // 24px
      },

      // 신혼부부 가계부 전용 그림자
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        floating: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },

      // 신혼부부 가계부 전용 애니메이션
      animation: {
        'bounce-gentle': 'bounce 2s infinite',
        'pulse-soft': 'pulse 3s infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.2s ease-out',
      },

      // 신혼부부 가계부 전용 키프레임
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },

      // 신혼부부 가계부 전용 백드롭 필터
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
