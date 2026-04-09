'use client'

import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  needsRefresh, 
  isExpired,
  TOKEN_REFRESH_THRESHOLD 
} from '@/lib/utils/session'

export interface SessionUser {
  id: string
  username: string
  nama: string | null
  role: 'super_admin' | 'guru' | 'siswa'
  nisn?: string
}

export interface Session {
  user: SessionUser
  expires_at?: number
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

interface UseSessionRefreshOptions {
  redirectUrl?: string
  enabled?: boolean
  onRefresh?: (session: Session) => void
  onRefreshFailure?: () => void
  onExpiry?: () => void
}

interface UseSessionRefreshReturn {
  session: Session | null
  isRefreshing: boolean
  lastRefreshedAt: Date | null
  refresh: () => Promise<boolean>
  timeUntilExpiry: number
}

export function useSessionRefresh(
  options: UseSessionRefreshOptions = {}
): UseSessionRefreshReturn {
  const {
    redirectUrl = '/login',
    enabled = true,
    onRefresh,
    onRefreshFailure,
    onExpiry,
  } = options

  const router = useRouter()
  
  const [session, setSession] = useState<Session | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    if (!enabled) return

    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const result = await res.json()
        
        if (result.success && result.data?.user) {
          const apiSession: Session = {
            user: result.data.user,
            expires_at: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000)
          }
          setSession(apiSession)
        } else {
          setSession(null)
          if (onExpiry) {
            onExpiry()
          } else {
            router.push(redirectUrl)
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error)
        setSession(null)
      }
    }

    fetchSession()

    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/check-session')
        const result = await res.json()
        
        if (!result.isActive) {
          setSession(null)
          if (onExpiry) {
            onExpiry()
          } else {
            router.push(redirectUrl)
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }, 60000)

    return () => {
      clearInterval(checkInterval)
    }
  }, [enabled, redirectUrl, router, onExpiry])

  const refresh = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false
    }

    isRefreshingRef.current = true
    setIsRefreshing(true)

    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' })
      const result = await res.json()

      if (!result.success) {
        console.error('Session refresh failed:', result.error?.message)
        
        if (onRefreshFailure) {
          onRefreshFailure()
        } else {
          router.push(redirectUrl)
        }
        
        return false
      }

      const newSession: Session = {
        user: session?.user || { id: '', username: '', nama: null, role: 'siswa' },
        expires_at: Math.floor(new Date(result.data?.expires_at).getTime() / 1000)
      }
      
      setSession(newSession)
      setLastRefreshedAt(new Date())
      
      if (onRefresh) {
        onRefresh(newSession)
      }
      
      return true
    } catch (error) {
      console.error('Session refresh error:', error)
      
      if (onRefreshFailure) {
        onRefreshFailure()
      } else {
        router.push(redirectUrl)
      }
      
      return false
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
    }
  }, [session, router, redirectUrl, onRefresh, onRefreshFailure])

  const checkAndRefresh = useCallback(async () => {
    if (!session) return

    if (isExpired(session)) {
      console.warn('Session expired')
      
      if (onExpiry) {
        onExpiry()
      } else {
        router.push(redirectUrl)
      }
      
      return
    }

    if (needsRefresh(session, TOKEN_REFRESH_THRESHOLD)) {
      await refresh()
    }
  }, [session, redirectUrl, router, onExpiry, refresh])

  useEffect(() => {
    if (!enabled || !session) return

    checkAndRefresh()

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(checkAndRefresh, REFRESH_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, session, checkAndRefresh])

  const timeUntilExpiry = useMemo(() => {
    if (!session?.expires_at) return 0
    const now = Math.floor(Date.now() / 1000)
    return (session.expires_at - now) * 1000
  }, [session])

  return {
    session,
    isRefreshing,
    lastRefreshedAt,
    refresh,
    timeUntilExpiry,
  }
}
