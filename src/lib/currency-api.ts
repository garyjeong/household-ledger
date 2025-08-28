/**
 * Currency Exchange API Service
 * exchangerate.host API를 사용한 환율 정보 조회
 */

export interface ExchangeRate {
  base: string
  date: string
  rates: Record<string, number>
}

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  flag?: string
}

// 지원하는 주요 통화 목록
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'KRW', name: '대한민국 원', symbol: '₩' },
  { code: 'USD', name: '미국 달러', symbol: '$' },
  { code: 'EUR', name: '유로', symbol: '€' },
  { code: 'JPY', name: '일본 엔', symbol: '¥' },
  { code: 'CNY', name: '중국 위안', symbol: '¥' },
  { code: 'GBP', name: '영국 파운드', symbol: '£' },
  { code: 'CAD', name: '캐나다 달러', symbol: 'C$' },
  { code: 'AUD', name: '호주 달러', symbol: 'A$' },
  { code: 'CHF', name: '스위스 프랑', symbol: 'CHF' },
  { code: 'SGD', name: '싱가포르 달러', symbol: 'S$' },
]

/**
 * exchangerate.host API에서 환율 정보 조회
 */
export async function fetchExchangeRates(baseCurrency = 'KRW'): Promise<ExchangeRate> {
  const response = await fetch(`https://api.exchangerate.host/latest?base=${baseCurrency}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'household-ledger/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error('Exchange rate API returned error')
  }

  return {
    base: data.base,
    date: data.date,
    rates: data.rates,
  }
}

/**
 * 특정 통화쌍의 환율 조회
 */
export async function fetchCurrencyPair(from: string, to: string): Promise<number> {
  const response = await fetch(
    `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'household-ledger/1.0',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch currency pair: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error('Currency conversion API returned error')
  }

  return data.result
}

/**
 * 금액 환전 계산
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
  baseCurrency = 'KRW'
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  // 기준 통화가 KRW이고 변환하려는 통화가 KRW인 경우
  if (toCurrency === baseCurrency) {
    const rate = rates[fromCurrency]
    if (!rate) throw new Error(`Rate not found for ${fromCurrency}`)
    return amount / rate
  }

  // 기준 통화가 아닌 통화에서 기준 통화로 변환
  if (fromCurrency === baseCurrency) {
    const rate = rates[toCurrency]
    if (!rate) throw new Error(`Rate not found for ${toCurrency}`)
    return amount * rate
  }

  // 두 통화 모두 기준 통화가 아닌 경우
  const fromRate = rates[fromCurrency]
  const toRate = rates[toCurrency]
  if (!fromRate || !toRate) {
    throw new Error(`Rates not found for ${fromCurrency} or ${toCurrency}`)
  }

  // 기준 통화를 거쳐서 변환
  const baseAmount = amount / fromRate
  return baseAmount * toRate
}

/**
 * 통화 포맷팅
 */
export function formatCurrency(amount: number, currency: string, locale = 'ko-KR'): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency)

  if (currency === 'KRW') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * 환율 캐시 키 생성
 */
export function getCacheKey(baseCurrency = 'KRW'): string {
  return `exchange-rates-${baseCurrency}`
}

/**
 * 환율 API 에러 타입
 */
export class CurrencyApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'CurrencyApiError'
  }
}
