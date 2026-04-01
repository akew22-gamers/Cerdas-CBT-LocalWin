'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  username: string
  nama: string | null
  role: 'super_admin' | 'guru' | 'siswa'
}

interface SessionContextType {
  user: User | null
  isLoading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: React.ReactNode
  redirectUrl?: string
}

export function SessionProvider({ children, redirectUrl = '/login' }: SessionProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.user) {
          setUser(data.data.user)
          return
        }
      }

      setUser(null)
    } catch (error) {
      console.error('Error fetching session:', error)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      await fetchSession()
      if (mounted) {
        setIsLoading(false)
      }
    }

    initSession()

    return () => {
      mounted = false
    }
  }, [fetchSession])

  const refresh = useCallback(async () => {
    await fetchSession()
  }, [fetchSession])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push(redirectUrl)
    }
  }, [router, redirectUrl])

  const value = {
    user,
    isLoading,
    refresh,
    signOut
  }

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