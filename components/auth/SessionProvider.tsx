'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { 
  needsRefresh, 
  isExpired,
  TOKEN_REFRESH_THRESHOLD 
} from '@/lib/utils/session'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

interface SessionContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  isRefreshing: boolean
  refresh: () => Promise<boolean>
  signOut: () => Promise<void>
  timeUntilExpiry: number
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: React.ReactNode
  redirectUrl?: string
}

export function SessionProvider({ children, redirectUrl = '/login' }: SessionProviderProps) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const supabase = useMemo(() => createClient(), [])
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error initializing session:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)

        if (event === 'SIGNED_OUT') {
          router.push(redirectUrl)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, router, redirectUrl])

  const refresh = useCallback(async (): Promise<boolean> => {
    if (isRefreshing) return false

    setIsRefreshing(true)

    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()

      if (error || !newSession) {
        console.error('Session refresh failed:', error?.message)
        router.push(redirectUrl)
        return false
      }

      setSession(newSession)
      setUser(newSession.user)
      return true
    } catch (error) {
      console.error('Session refresh error:', error)
      router.push(redirectUrl)
      return false
    } finally {
      setIsRefreshing(false)
    }
  }, [supabase.auth, isRefreshing, router, redirectUrl])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push(redirectUrl)
  }, [supabase.auth, router, redirectUrl])

  const checkAndRefresh = useCallback(async () => {
    if (!session) return

    if (isExpired(session)) {
      console.warn('Session expired')
      router.push(redirectUrl)
      return
    }

    if (needsRefresh(session, TOKEN_REFRESH_THRESHOLD)) {
      await refresh()
    }
  }, [session, redirectUrl, router, refresh])

  useEffect(() => {
    if (!session || isLoading) return

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
  }, [session, isLoading, checkAndRefresh])

  const timeUntilExpiry = useMemo(() => {
    if (!session?.expires_at) return 0
    const now = Math.floor(Date.now() / 1000)
    return (session.expires_at - now) * 1000
  }, [session])

  const value = useMemo(() => ({
    session,
    user,
    isLoading,
    isRefreshing,
    refresh,
    signOut,
    timeUntilExpiry,
  }), [session, user, isLoading, isRefreshing, refresh, signOut, timeUntilExpiry])

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
