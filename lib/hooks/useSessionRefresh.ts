'use client'

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'
import { 
  needsRefresh, 
  isExpired,
  TOKEN_REFRESH_THRESHOLD 
} from '@/lib/utils/session'

// Refresh interval: 5 minutes (300000 ms)
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

interface UseSessionRefreshOptions {
  /** Redirect to this URL when session expires (default: '/login') */
  redirectUrl?: string
  /** Enable/disable automatic refresh (default: true) */
  enabled?: boolean
  /** Callback when session is refreshed successfully */
  onRefresh?: (session: Session) => void
  /** Callback when session refresh fails */
  onRefreshFailure?: () => void
  /** Callback when session expires */
  onExpiry?: () => void
}

interface UseSessionRefreshReturn {
  /** Current session */
  session: Session | null
  /** Is session currently being refreshed */
  isRefreshing: boolean
  /** Last refresh time */
  lastRefreshedAt: Date | null
  /** Manually trigger session refresh */
  refresh: () => Promise<boolean>
  /** Time until session expires in milliseconds */
  timeUntilExpiry: number
}

/**
 * Hook for automatic session refresh
 * 
 * Features:
 * - Auto-refreshes session when approaching expiry
 * - Handles refresh failures gracefully
 * - Redirects to login on session expiry
 * - Runs on interval (every 5 minutes)
 * 
 * @param options - Configuration options
 * @returns Session state and refresh controls
 */
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
  const auth = React.useMemo(() => createClient().auth, [])
  
  const [session, setSession] = useState<Session | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  // Get initial session and set up listener
  useEffect(() => {
    if (!enabled) return

    // Get initial session
    auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        
        if (event === 'SIGNED_OUT') {
          if (onExpiry) {
            onExpiry()
          } else {
            router.push(redirectUrl)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [enabled, redirectUrl, router, onExpiry, auth])

  // Refresh session function
  const refresh = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false
    }

    isRefreshingRef.current = true
    setIsRefreshing(true)

    try {
      const { data: { session: newSession }, error } = await auth.refreshSession()

      if (error) {
        console.error('Session refresh failed:', error.message)
        
        // Session is invalid, redirect to login
        if (onRefreshFailure) {
          onRefreshFailure()
        } else {
          router.push(redirectUrl)
        }
        
        return false
      }

      if (newSession) {
        setSession(newSession)
        setLastRefreshedAt(new Date())
        
        if (onRefresh) {
          onRefresh(newSession)
        }
        
        return true
      }

      return false
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
  }, [auth, router, redirectUrl, onRefresh, onRefreshFailure])

  // Check and refresh if needed
  const checkAndRefresh = useCallback(async () => {
    if (!session) return

    // Check if expired
    if (isExpired(session)) {
      console.warn('Session expired')
      
      if (onExpiry) {
        onExpiry()
      } else {
        router.push(redirectUrl)
      }
      
      return
    }

    // Check if needs refresh
    if (needsRefresh(session, TOKEN_REFRESH_THRESHOLD)) {
      await refresh()
    }
  }, [session, redirectUrl, router, onExpiry, refresh, auth])

  // Set up automatic refresh interval
  useEffect(() => {
    if (!enabled || !session) return

    // Initial check
    checkAndRefresh()

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up interval for periodic checks
    intervalRef.current = setInterval(checkAndRefresh, REFRESH_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, session, checkAndRefresh])

  // Calculate time until expiry
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

