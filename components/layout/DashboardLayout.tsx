'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { IdleWarningDialog, CompactIdleWarning } from '@/components/ui/IdleWarningDialog'
import { useIdleTimeout, getIdleTimeoutConfig } from '@/lib/hooks/useIdleTimeout'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

type UserRole = 'super_admin' | 'guru' | 'siswa'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    id?: string
    nama: string | null
    username?: string
    role: string
    nisn?: string
  }
  className?: string
}

function getUserRole(role: string): UserRole {
  if (role === 'super_admin') return 'super_admin'
  if (role === 'guru') return 'guru'
  return 'siswa'
}

/**
 * DashboardLayout with built-in idle timeout detection
 * Automatically logs out users after period of inactivity
 */
export function DashboardLayout({ children, user, className }: DashboardLayoutProps) {
  const router = useRouter()
  const role = getUserRole(user.role)

  // Get role-based timeout configuration
  const timeoutConfig = getIdleTimeoutConfig(role)

  // Handle idle timeout
  const handleTimeout = useCallback(() => {
    console.log('[IdleTimeout] User logged out due to inactivity')
    // Auto logout via API
    fetch('/api/auth/logout', { method: 'POST' })
      .finally(() => {
        router.push('/login?reason=idle_timeout')
      })
  }, [router])

  // Handle warning countdown
  const [showWarning, setShowWarning] = React.useState(false)
  const [remainingSeconds, setRemainingSeconds] = React.useState(0)

  const handleWarning = useCallback((remaining: number) => {
    setRemainingSeconds(remaining)
    setShowWarning(remaining <= 120) // Show warning in last 2 minutes
  }, [])

  // Idle timeout hook
  const { reset, isPaused, pause, resume } = useIdleTimeout({
    timeout: timeoutConfig.timeout,
    warningTime: timeoutConfig.warningTime,
    enabled: true,
    onTimeout: handleTimeout,
    onWarning: handleWarning,
    debug: process.env.NODE_ENV === 'development',
  })

  // Pause idle detection on beforeunload (prevents timeout during page navigation)
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      pause()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pause])

  // Stay logged in handler
  const handleStayLoggedIn = React.useCallback(() => {
    reset()
    setShowWarning(false)
    console.log('[IdleTimeout] User stayed logged in - timer reset')
  }, [reset])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar role={role} />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <Header user={user} />

          <main
            className={cn(
              'flex-1 bg-slate-50 p-4 lg:p-8 overflow-y-auto',
              className
            )}
          >
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>

      {/* Idle Warning Dialog */}
      {showWarning && !isMobile && (
        <IdleWarningDialog
          open={showWarning}
          remainingSeconds={remainingSeconds}
          onStayLoggedIn={handleStayLoggedIn}
          title="Sesi Anda Hampir Berakhir"
          description="Karena tidak ada aktivitas, Anda akan keluar otomatis segera."
          stayLoggedInText="Tetap Masuk"
          showLogoutButton={true}
        />
      )}

      {/* Mobile: Use compact warning banner */}
      {showWarning && isMobile && (
        <CompactIdleWarning
          remainingSeconds={remainingSeconds}
          onStayLoggedIn={handleStayLoggedIn}
        />
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-40 bg-black/80 text-white text-xs px-3 py-2 rounded-lg font-mono">
          <div>Idle: {isPaused ? '⏸️ Paused' : '✅ Active'}</div>
          <div>Warning: {showWarning ? '⚠️ Yes' : '❌ No'}</div>
          {showWarning && <div>Remaining: {remainingSeconds}s</div>}
        </div>
      )}
    </>
  )
}
