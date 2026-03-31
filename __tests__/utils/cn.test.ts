import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  describe('class merging', () => {
    it('should merge multiple classes', () => {
      expect(cn('bg-red-500', 'text-white', 'p-4')).toBe('bg-red-500 text-white p-4')
    })

    it('should merge tailwind classes with tailwind-merge', () => {
      expect(cn('px-4 py-2', 'p-4')).toBe('p-4')
    })

    it('should handle conflicting tailwind classes', () => {
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500')
    })

    it('should merge base classes with overrides', () => {
      expect(cn('btn btn-primary', 'btn-lg')).toBe('btn btn-primary btn-lg')
    })
  })

  describe('conditional classes', () => {
    it('should handle falsy values', () => {
      expect(cn('base', false, null, undefined, '')).toBe('base')
    })

    it('should handle object with boolean conditions', () => {
      expect(cn('base', { 'is-active': true, 'is-disabled': false })).toBe('base is-active')
    })

    it('should handle array of classes', () => {
      expect(cn(['base', 'variant'])).toBe('base variant')
    })

    it('should handle nested arrays', () => {
      expect(cn(['base', ['nested', 'classes']])).toBe('base nested classes')
    })

    it('should handle complex conditional logic', () => {
      const isActive = true
      const isDisabled = false
      const size = 'large'

      expect(
        cn(
          'btn',
          isActive && 'active',
          isDisabled && 'disabled',
          size === 'large' && 'btn-lg'
        )
      ).toBe('btn active btn-lg')
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })

    it('should handle single class', () => {
      expect(cn('single')).toBe('single')
    })

    it('should deduplicate classes', () => {
      expect(cn('foo', 'foo', 'bar')).toBe('foo bar')
    })
  })
})
