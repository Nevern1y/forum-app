import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (classNames utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('base', 'additional')
      expect(result).toContain('base')
      expect(result).toContain('additional')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('base', isActive && 'active')
      expect(result).toContain('active')
    })

    it('filters out falsy values', () => {
      const result = cn('base', false, null, undefined, 'valid')
      expect(result).not.toContain('false')
      expect(result).not.toContain('null')
      expect(result).toContain('valid')
    })

    it('handles empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })
})
