import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchExchangeRates,
  fetchCurrencyPair,
  convertAmount,
  formatCurrency,
  SUPPORTED_CURRENCIES,
  CurrencyApiError,
} from '@/lib/currency-api'

// Mock fetch
global.fetch = vi.fn()
const mockFetch = fetch as vi.MockedFunction<typeof fetch>

describe('Currency API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchExchangeRates', () => {
    it('should fetch exchange rates successfully', async () => {
      const mockResponse = {
        success: true,
        base: 'KRW',
        date: '2024-01-01',
        rates: {
          USD: 0.00075,
          EUR: 0.00068,
          JPY: 0.11,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchExchangeRates('KRW')

      expect(result).toEqual({
        base: 'KRW',
        date: '2024-01-01',
        rates: {
          USD: 0.00075,
          EUR: 0.00068,
          JPY: 0.11,
        },
      })

      expect(mockFetch).toHaveBeenCalledWith('https://api.exchangerate.host/latest?base=KRW', {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'household-ledger/1.0',
        },
      })
    })

    it('should throw error when API returns error', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid base currency',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await expect(fetchExchangeRates('INVALID')).rejects.toThrow(
        'Exchange rate API returned error'
      )
    })

    it('should throw error when HTTP request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(fetchExchangeRates()).rejects.toThrow(
        'Failed to fetch exchange rates: 404 Not Found'
      )
    })
  })

  describe('fetchCurrencyPair', () => {
    it('should fetch currency pair rate successfully', async () => {
      const mockResponse = {
        success: true,
        result: 1334.56,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchCurrencyPair('USD', 'KRW')

      expect(result).toBe(1334.56)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.exchangerate.host/convert?from=USD&to=KRW&amount=1',
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'household-ledger/1.0',
          },
        }
      )
    })
  })

  describe('convertAmount', () => {
    const mockRates = {
      USD: 0.00075,
      EUR: 0.00068,
      JPY: 0.11,
      CNY: 0.0053,
    }

    it('should return same amount for same currency', () => {
      const result = convertAmount(100, 'KRW', 'KRW', mockRates)
      expect(result).toBe(100)
    })

    it('should convert from base currency to other currency', () => {
      const result = convertAmount(1000, 'KRW', 'USD', mockRates)
      expect(result).toBe(0.75) // 1000 * 0.00075
    })

    it('should convert from other currency to base currency', () => {
      const result = convertAmount(1, 'USD', 'KRW', mockRates)
      expect(result).toBeCloseTo(1333.33) // 1 / 0.00075
    })

    it('should convert between two non-base currencies', () => {
      const result = convertAmount(1, 'USD', 'EUR', mockRates)
      // USD -> KRW: 1 / 0.00075 = 1333.33
      // KRW -> EUR: 1333.33 * 0.00068 = 0.9067
      expect(result).toBeCloseTo(0.9067, 4)
    })

    it('should throw error for missing rate', () => {
      expect(() => {
        convertAmount(100, 'KRW', 'GBP', mockRates)
      }).toThrow('Rate not found for GBP')
    })
  })

  describe('formatCurrency', () => {
    it('should format KRW currency correctly', () => {
      const result = formatCurrency(15000, 'KRW')
      expect(result).toMatch(/₩15,000|15,000원/)
    })

    it('should format USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD')
      expect(result).toMatch(/\$1,234\.56/)
    })

    it('should format EUR currency correctly', () => {
      const result = formatCurrency(999.99, 'EUR')
      expect(result).toMatch(/€999\.99/)
    })
  })

  describe('SUPPORTED_CURRENCIES', () => {
    it('should contain required currencies', () => {
      const codes = SUPPORTED_CURRENCIES.map(c => c.code)

      expect(codes).toContain('KRW')
      expect(codes).toContain('USD')
      expect(codes).toContain('EUR')
      expect(codes).toContain('JPY')
      expect(codes).toContain('CNY')
      expect(codes).toContain('GBP')
    })

    it('should have proper structure for each currency', () => {
      SUPPORTED_CURRENCIES.forEach(currency => {
        expect(currency).toHaveProperty('code')
        expect(currency).toHaveProperty('name')
        expect(currency).toHaveProperty('symbol')

        expect(typeof currency.code).toBe('string')
        expect(typeof currency.name).toBe('string')
        expect(typeof currency.symbol).toBe('string')
        expect(currency.code).toHaveLength(3)
      })
    })
  })

  describe('CurrencyApiError', () => {
    it('should create error with message', () => {
      const error = new CurrencyApiError('Test error')

      expect(error.message).toBe('Test error')
      expect(error.name).toBe('CurrencyApiError')
      expect(error.code).toBeUndefined()
      expect(error.status).toBeUndefined()
    })

    it('should create error with code and status', () => {
      const error = new CurrencyApiError('Test error', 'RATE_LIMIT', 429)

      expect(error.message).toBe('Test error')
      expect(error.name).toBe('CurrencyApiError')
      expect(error.code).toBe('RATE_LIMIT')
      expect(error.status).toBe(429)
    })
  })
})
