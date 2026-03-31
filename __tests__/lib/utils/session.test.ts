import { getSessionExpiry, needsRefresh, timeUntilExpiry, isExpired } from '@/lib/utils/session'

const createMockSession = (expiresAt: number) => ({
  access_token: 'access_token',
  refresh_token: 'refresh_token',
  expires_in: 604800,
  expires_at: expiresAt,
  token_type: 'bearer',
  user: {
    id: 'user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'user@example.com',
    email_confirmed_at: Date.now().toString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: Date.now().toString(),
    updated_at: Date.now().toString(),
  },
} as any)

describe('session utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getSessionExpiry', () => {
    it('returns expires_at timestamp from session', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 604800
      const session = createMockSession(expiresAt)

      const result = getSessionExpiry(session)

      expect(result).toBe(expiresAt)
    })

    it('returns 0 for null session', () => {
      const result = getSessionExpiry(null as any)
      expect(result).toBe(0)
    })

    it('returns 0 for session without expires_at', () => {
      const session = { ...createMockSession(0), expires_at: undefined }
      const result = getSessionExpiry(session as any)
      expect(result).toBe(0)
    })
  })

  describe('needsRefresh', () => {
    it('returns true when session expires within threshold', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + 1800
      const session = createMockSession(expiresAt)

      const result = needsRefresh(session)

      expect(result).toBe(true)
    })

    it('returns false when session expires after threshold', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + 7200
      const session = createMockSession(expiresAt)

      const result = needsRefresh(session)

      expect(result).toBe(false)
    })

    it('returns true when session is expired', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now - 3600
      const session = createMockSession(expiresAt)

      const result = needsRefresh(session)

      expect(result).toBe(true)
    })

    it('returns true for null session', () => {
      const result = needsRefresh(null as any)
      expect(result).toBe(true)
    })

    it('uses custom threshold when provided', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + 1800
      const session = createMockSession(expiresAt)

      const result = needsRefresh(session, 1200)
      expect(result).toBe(true)

      const result2 = needsRefresh(session, 3600)
      expect(result2).toBe(true)

      const result3 = needsRefresh(session, 600)
      expect(result3).toBe(false)
    })
  })

  describe('timeUntilExpiry', () => {
    it('returns positive seconds when session is active', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + 3600
      const session = createMockSession(expiresAt)

      const result = timeUntilExpiry(session)

      expect(result).toBe(3600)
    })

    it('returns negative seconds when session is expired', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now - 1800
      const session = createMockSession(expiresAt)

      const result = timeUntilExpiry(session)

      expect(result).toBe(-1800)
    })

    it('returns 0 for null session', () => {
      const result = timeUntilExpiry(null as any)
      expect(result).toBe(0)
    })
  })

  describe('isExpired', () => {
    it('returns true when session is expired', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now - 60
      const session = createMockSession(expiresAt)

      const result = isExpired(session)

      expect(result).toBe(true)
    })

    it('returns false when session is active', () => {
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = now + 3600
      const session = createMockSession(expiresAt)

      const result = isExpired(session)

      expect(result).toBe(false)
    })

    it('returns false when session expires exactly now', () => {
      const now = Math.floor(Date.now() / 1000)
      const session = createMockSession(now)

      const result = isExpired(session)

      expect(result).toBe(false)
    })
  })
})
