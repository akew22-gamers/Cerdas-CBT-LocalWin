import { shuffleWithSeed, generateRandomSeed } from '@/lib/utils/randomize'

describe('randomize utilities', () => {
  describe('shuffleWithSeed', () => {
    it('returns same order for same seed', () => {
      const array = [1, 2, 3, 4, 5]
      const seed = 42

      const result1 = shuffleWithSeed(array, seed)
      const result2 = shuffleWithSeed(array, seed)

      expect(result1).toEqual(result2)
    })

    it('returns different order for different seeds', () => {
      const array = [1, 2, 3, 4, 5]

      const result1 = shuffleWithSeed(array, 42)
      const result2 = shuffleWithSeed(array, 123)

      expect(result1).not.toEqual(result2)
    })

    it('returns a new array (does not mutate original)', () => {
      const array = [1, 2, 3, 4, 5]
      const seed = 42

      const result = shuffleWithSeed(array, seed)

      expect(result).not.toBe(array)
      expect(array).toEqual([1, 2, 3, 4, 5])
    })

    it('handles empty arrays', () => {
      const array: number[] = []
      const seed = 42

      const result = shuffleWithSeed(array, seed)

      expect(result).toEqual([])
    })

    it('handles single element arrays', () => {
      const array = [1]
      const seed = 42

      const result = shuffleWithSeed(array, seed)

      expect(result).toEqual([1])
    })

    it('works with different data types', () => {
      const array = ['a', 'b', 'c', 'd']
      const seed = 42

      const result = shuffleWithSeed(array, seed)

      expect(result.length).toBe(array.length)
      expect(result.sort()).toEqual(array.sort())
    })

    it('deterministically shuffles complex objects', () => {
      const array = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]
      const seed = 123

      const result1 = shuffleWithSeed(array, seed)
      const result2 = shuffleWithSeed(array, seed)

      expect(result1).toEqual(result2)
    })
  })

  describe('generateRandomSeed', () => {
    it('returns a number', () => {
      const result = generateRandomSeed()
      expect(typeof result).toBe('number')
    })

    it('returns an integer', () => {
      const result = generateRandomSeed()
      expect(Number.isInteger(result)).toBe(true)
    })

    it('returns a positive number', () => {
      const result = generateRandomSeed()
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('returns a number within 32-bit signed integer range', () => {
      const maxInt32 = 2147483647
      const result = generateRandomSeed()
      expect(result).toBeLessThanOrEqual(maxInt32)
    })

    it('returns different values on multiple calls', () => {
      const result1 = generateRandomSeed()
      const result2 = generateRandomSeed()
      const result3 = generateRandomSeed()

      expect(result1).not.toBe(result2)
      expect(result2).not.toBe(result3)
    })
  })
})
