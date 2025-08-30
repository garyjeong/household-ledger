/**
 * 테스트용 공통 데이터 및 모킹 유틸리티
 */

// 테스트용 사용자 데이터
export const TEST_USERS = {
  primary: {
    email: `primary-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    nickname: '테스트유저1',
  },
  partner: {
    email: `partner-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    nickname: '테스트유저2',
  },
  invalid: {
    email: 'invalid-email',
    password: '123',
    nickname: '',
  },
} as const

// 테스트용 그룹 데이터
export const TEST_GROUPS = {
  family: {
    name: `우리가족${Date.now()}`,
    description: '테스트용 가족 그룹',
  },
  friends: {
    name: `친구모임${Date.now()}`,
    description: '테스트용 친구 그룹',
  },
} as const

// 테스트용 거래 데이터
export const TEST_TRANSACTIONS = {
  expense: {
    amount: '25000',
    description: '점심식사',
    category: '식비',
    memo: 'E2E 테스트용 지출',
    type: 'EXPENSE' as const,
  },
  income: {
    amount: '300000',
    description: '용돈',
    category: '기타수입',
    memo: 'E2E 테스트용 수입',
    type: 'INCOME' as const,
  },
  transfer: {
    amount: '100000',
    description: '계좌이체',
    category: '이체',
    memo: '테스트용 이체',
    type: 'TRANSFER' as const,
  },
} as const

// 테스트용 계좌 데이터
export const TEST_ACCOUNTS = {
  bank: {
    name: 'E2E테스트은행',
    bank: '테스트은행',
    accountNumber: '123-456-789',
    initialBalance: '1000000',
    type: 'BANK' as const,
  },
  card: {
    name: 'E2E테스트카드',
    bank: '테스트카드사',
    accountNumber: '1234-5678-9012-3456',
    initialBalance: '500000',
    type: 'CARD' as const,
  },
  cash: {
    name: 'E2E현금',
    initialBalance: '100000',
    type: 'CASH' as const,
  },
} as const

// 테스트용 카테고리 데이터
export const TEST_CATEGORIES = {
  expense: {
    name: 'E2E테스트지출',
    color: '#EF4444',
    icon: '🛒',
    type: 'EXPENSE' as const,
  },
  income: {
    name: 'E2E테스트수입',
    color: '#10B981',
    icon: '💰',
    type: 'INCOME' as const,
  },
  transfer: {
    name: 'E2E테스트이체',
    color: '#3B82F6',
    icon: '🔄',
    type: 'TRANSFER' as const,
  },
} as const

// API 모킹용 응답 데이터
export const MOCK_API_RESPONSES = {
  auth: {
    login: {
      success: true,
      user: {
        id: '1',
        email: TEST_USERS.primary.email,
        nickname: TEST_USERS.primary.nickname,
        createdAt: new Date().toISOString(),
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
    signUp: {
      success: true,
      user: {
        id: '2',
        email: TEST_USERS.partner.email,
        nickname: TEST_USERS.partner.nickname,
        createdAt: new Date().toISOString(),
      },
    },
  },

  transactions: {
    list: {
      success: true,
      transactions: [
        {
          id: '1',
          type: 'EXPENSE',
          amount: 15000,
          currency: 'KRW',
          categoryId: '1',
          category: { id: '1', name: '식비', color: '#ef4444', type: 'EXPENSE' },
          description: '점심 식사',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        totalCount: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    },
    create: {
      success: true,
      transaction: {
        id: '2',
        type: 'EXPENSE',
        amount: 8500,
        currency: 'KRW',
        categoryId: '2',
        category: { id: '2', name: '카페', color: '#3b82f6', type: 'EXPENSE' },
        description: '아메리카노',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  },

  categories: {
    list: {
      success: true,
      categories: [
        { id: '1', name: '식비', type: 'EXPENSE', color: '#ef4444', isDefault: true },
        { id: '2', name: '카페', type: 'EXPENSE', color: '#3b82f6', isDefault: true },
        { id: '3', name: '급여', type: 'INCOME', color: '#22c55e', isDefault: true },
        { id: '4', name: '용돈', type: 'INCOME', color: '#10b981', isDefault: true },
        { id: '5', name: '이체', type: 'TRANSFER', color: '#6366f1', isDefault: true },
      ],
    },
  },

  accounts: {
    list: {
      success: true,
      accounts: [
        {
          id: '1',
          name: TEST_ACCOUNTS.bank.name,
          bank: TEST_ACCOUNTS.bank.bank,
          accountNumber: TEST_ACCOUNTS.bank.accountNumber,
          balance: parseInt(TEST_ACCOUNTS.bank.initialBalance),
          type: TEST_ACCOUNTS.bank.type,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  },

  groups: {
    list: {
      success: true,
      groups: [
        {
          id: '1',
          name: TEST_GROUPS.family.name,
          description: TEST_GROUPS.family.description,
          memberCount: 2,
          inviteCode: 'ABC1234567',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  },

  statistics: {
    monthly: {
      success: true,
      data: {
        period: new Date().toISOString().substring(0, 7), // YYYY-MM
        totalExpense: 180000,
        totalIncome: 200000,
        netAmount: 20000,
        transactionCount: 15,
        categoryBreakdown: [
          {
            categoryId: '1',
            categoryName: '식비',
            amount: 80000,
            percentage: 44.4,
            color: '#ef4444',
            icon: '🍽️',
            count: 8,
          },
          {
            categoryId: '2',
            categoryName: '생활용품',
            amount: 100000,
            percentage: 55.6,
            color: '#3b82f6',
            icon: '🛒',
            count: 7,
          },
        ],
        dailyTrend: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          expense: Math.floor(Math.random() * 30000) + 5000,
          income: i % 7 === 0 ? Math.floor(Math.random() * 100000) + 50000 : 0,
        })),
      },
    },
  },
} as const

// 오류 응답 데이터
export const MOCK_ERROR_RESPONSES = {
  unauthorized: {
    success: false,
    error: 'UNAUTHORIZED',
    message: '인증이 필요합니다',
    statusCode: 401,
  },
  validation: {
    success: false,
    error: 'VALIDATION_ERROR',
    message: '입력값이 올바르지 않습니다',
    details: {
      email: '올바른 이메일 형식을 입력해주세요',
      password: '비밀번호는 8자 이상이어야 합니다',
      amount: '금액은 0보다 커야 합니다',
    },
    statusCode: 400,
  },
  notFound: {
    success: false,
    error: 'NOT_FOUND',
    message: '요청한 리소스를 찾을 수 없습니다',
    statusCode: 404,
  },
  serverError: {
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: '서버 오류가 발생했습니다',
    statusCode: 500,
  },
} as const

// 환율 API 모킹 데이터
export const MOCK_EXCHANGE_RATES = {
  success: true,
  base: 'KRW',
  date: new Date().toISOString().split('T')[0],
  rates: {
    USD: 0.00075,
    EUR: 0.00068,
    JPY: 0.11,
    CNY: 0.0055,
    GBP: 0.00059,
  },
} as const

// 브라우저 지원 확인용 데이터
export const BROWSER_SUPPORT = {
  features: {
    es6: true,
    webGL: true,
    serviceWorker: true,
    webAssembly: true,
    cssGrid: true,
    flexbox: true,
    intersectionObserver: true,
    resizeObserver: true,
  },
  apis: {
    localStorage: true,
    sessionStorage: true,
    fetch: true,
    promise: true,
    asyncAwait: true,
    modules: true,
  },
} as const

// 디바이스/뷰포트 설정
export const VIEWPORT_SIZES = {
  mobile: {
    iphoneSE: { width: 320, height: 568 },
    iphoneX: { width: 375, height: 812 },
    pixel5: { width: 393, height: 851 },
  },
  tablet: {
    ipad: { width: 768, height: 1024 },
    ipadPro: { width: 1024, height: 1366 },
    surface: { width: 912, height: 1368 },
  },
  desktop: {
    laptop: { width: 1366, height: 768 },
    desktop: { width: 1920, height: 1080 },
    widescreen: { width: 2560, height: 1440 },
  },
} as const

// 성능 벤치마크 기준값
export const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000, // ms
  interaction: 1000, // ms
  api: 500, // ms
  render: 100, // ms
  memory: 50, // MB
} as const
