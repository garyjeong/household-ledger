import {
  cn,
  formatCurrency,
  formatDate,
  isValidEmail,
  generateId,
  debounce,
  calculatePercentage,
  sleep,
} from '@/lib/utils'

describe('Utils Library', () => {
  describe('cn (className utility)', () => {
    it('should merge classes correctly', () => {
      const result = cn('text-sm', 'font-bold', 'text-blue-500')
      expect(result).toBe('text-sm font-bold text-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class', 'final-class')
      expect(result).toBe('base-class active-class final-class')
    })

    it('should handle Tailwind class conflicts', () => {
      // tailwind-merge should prioritize later classes
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toBe('text-blue-500')
    })

    it('should handle array of classes', () => {
      const result = cn(['text-sm', 'font-bold'], 'text-blue-500')
      expect(result).toBe('text-sm font-bold text-blue-500')
    })

    it('should handle empty or undefined classes', () => {
      const result = cn('text-sm', undefined, '', null, 'font-bold')
      expect(result).toBe('text-sm font-bold')
    })
  })

  describe('formatCurrency', () => {
    it('should format number to Korean currency', () => {
      const result = formatCurrency(50000)
      expect(result).toBe('₩50,000')
    })

    it('should format string number to Korean currency', () => {
      const result = formatCurrency('50000')
      expect(result).toBe('₩50,000')
    })

    it('should handle decimal numbers', () => {
      const result = formatCurrency(50000.99)
      expect(result).toBe('₩50,001') // rounds to nearest integer
    })

    it('should handle negative numbers', () => {
      const result = formatCurrency(-50000)
      expect(result).toBe('-₩50,000')
    })

    it('should handle zero', () => {
      const result = formatCurrency(0)
      expect(result).toBe('₩0')
    })

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000000)
      expect(result).toBe('₩1,000,000,000')
    })
  })

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z')

    it('should format Date object to Korean locale', () => {
      const result = formatDate(testDate)
      expect(result).toContain('2024')
      expect(result).toContain('1월')
      expect(result).toContain('15')
    })

    it('should format date string to Korean locale', () => {
      const result = formatDate('2024-01-15')
      expect(result).toContain('2024')
      expect(result).toContain('1월')
      expect(result).toContain('15')
    })

    it('should respect custom options', () => {
      const result = formatDate(testDate, {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      expect(result).toContain('2024')
      expect(result).toContain('1월')
      expect(result).toContain('15')
    })

    it('should handle different date formats', () => {
      const result = formatDate(testDate, {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
      })
      expect(result).toContain('24')
      expect(result).toContain('1')
      expect(result).toContain('15')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.kr')).toBe(true)
      expect(isValidEmail('test+tag@example.org')).toBe(true)
      expect(isValidEmail('123@domain.net')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('test.domain.com')).toBe(false)
      expect(isValidEmail('test@domain')).toBe(false)
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('test @domain.com')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true) // minimal valid email
      expect(isValidEmail('test@domain.co')).toBe(true) // two-letter TLD
    })
  })

  describe('generateId', () => {
    it('should generate ID with default length', () => {
      const id = generateId()
      expect(id).toHaveLength(8)
      expect(typeof id).toBe('string')
    })

    it('should generate ID with custom length', () => {
      const id = generateId(12)
      expect(id).toHaveLength(12)
    })

    it('should generate different IDs on multiple calls', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should only contain valid characters', () => {
      const id = generateId(50)
      const validChars = /^[A-Za-z0-9]+$/
      expect(validChars.test(id)).toBe(true)
    })

    it('should handle zero length', () => {
      const id = generateId(0)
      expect(id).toBe('')
    })

    it('should handle large length', () => {
      const id = generateId(100)
      expect(id).toHaveLength(100)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('test')
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledWith('test')
    })

    it('should cancel previous calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      debouncedFn('second')
      debouncedFn('third')

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('third')
    })

    it('should handle multiple arguments', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2', 'arg3')
      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })

    it('should work with different delay times', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 50)

      debouncedFn('test')
      jest.advanceTimersByTime(30)
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(20)
      expect(mockFn).toHaveBeenCalledWith('test')
    })
  })

  describe('calculatePercentage', () => {
    it('should calculate correct percentage', () => {
      expect(calculatePercentage(25, 100)).toBe(25)
      expect(calculatePercentage(50, 200)).toBe(25)
      expect(calculatePercentage(75, 150)).toBe(50)
    })

    it('should handle zero total (safe division)', () => {
      expect(calculatePercentage(25, 0)).toBe(0)
      expect(calculatePercentage(0, 0)).toBe(0)
    })

    it('should round to nearest integer', () => {
      expect(calculatePercentage(33, 100)).toBe(33)
      expect(calculatePercentage(1, 3)).toBe(33) // 33.333... rounds to 33
      expect(calculatePercentage(2, 3)).toBe(67) // 66.666... rounds to 67
    })

    it('should handle decimal inputs', () => {
      expect(calculatePercentage(25.5, 100)).toBe(26)
      expect(calculatePercentage(25, 100.5)).toBe(25)
    })

    it('should handle negative numbers', () => {
      expect(calculatePercentage(-25, 100)).toBe(-25)
      expect(calculatePercentage(25, -100)).toBe(-25)
      expect(calculatePercentage(-25, -100)).toBe(25)
    })

    it('should handle values greater than total', () => {
      expect(calculatePercentage(150, 100)).toBe(150)
    })
  })

  describe('sleep', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should resolve after specified time', async () => {
      const promise = sleep(1000)
      let resolved = false

      promise.then(() => {
        resolved = true
      })

      expect(resolved).toBe(false)
      jest.advanceTimersByTime(1000)
      await promise
      expect(resolved).toBe(true)
    })

    it('should handle zero delay', async () => {
      const promise = sleep(0)
      let resolved = false

      promise.then(() => {
        resolved = true
      })

      jest.advanceTimersByTime(0)
      await promise
      expect(resolved).toBe(true)
    })

    it('should return a Promise', () => {
      const result = sleep(100)
      expect(result).toBeInstanceOf(Promise)
    })

    it('should work with different delay values', async () => {
      const promises = [sleep(100), sleep(200), sleep(300)]

      let resolvedCount = 0
      promises.forEach(p => p.then(() => resolvedCount++))

      jest.advanceTimersByTime(100)
      await promises[0]
      expect(resolvedCount).toBe(1)

      jest.advanceTimersByTime(100)
      await promises[1]
      expect(resolvedCount).toBe(2)

      jest.advanceTimersByTime(100)
      await promises[2]
      expect(resolvedCount).toBe(3)
    })
  })
})
