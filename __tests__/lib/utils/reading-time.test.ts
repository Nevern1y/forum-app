import { calculateReadingTime, formatReadingTime } from '@/lib/utils/reading-time'

describe('Reading Time Utils', () => {
  describe('calculateReadingTime', () => {
    it('calculates reading time for short text', () => {
      const text = 'This is a short text with about ten words.'
      const time = calculateReadingTime(text)
      expect(time).toBe(1) // Minimum is 1 minute
    })

    it('calculates reading time for longer text', () => {
      const words = Array(500).fill('word').join(' ')
      const time = calculateReadingTime(words)
      // 500 words / 200 words per minute ≈ 2.5 minutes
      expect(time).toBeGreaterThan(2)
      expect(time).toBeLessThan(4)
    })

    it('handles empty text', () => {
      expect(calculateReadingTime('')).toBe(1)
    })
  })

  describe('formatReadingTime', () => {
    it('formats single minute correctly', () => {
      expect(formatReadingTime(1)).toBe('1 мин')
    })

    it('formats multiple minutes correctly', () => {
      expect(formatReadingTime(5)).toBe('5 мин')
    })

    it('handles zero minutes', () => {
      expect(formatReadingTime(0)).toBe('0 мин')
    })
  })
})
