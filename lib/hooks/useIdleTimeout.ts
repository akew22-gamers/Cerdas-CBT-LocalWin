'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'mousemove',
  'keypress',
  'touchmove',
  'wheel',
]

export interface UseIdleTimeoutOptions {
  /** Timeout in milliseconds before auto logout (default: 15 minutes) */
  timeout?: number
  
  /** Warning time before timeout in milliseconds (default: 2 minutes) */
  warningTime?: number
  
  /** Callback when user becomes idle */
  onIdle?: () => void
  
  /** Callback when warning starts (shows countdown) */
  onWarning?: (remainingSeconds: number) => void
  
  /** Callback when timeout occurs (before redirect) */
  onTimeout?: () => void
  
  /** Enable/disable idle detection (default: true) */
  enabled?: boolean
  
  /** Activity events to track (default: mouse, keyboard, scroll, touch) */
  events?: string[]
  
  /** Enable debug logging (default: false) */
  debug?: boolean
  
  /** Custom redirect URL (default: '/login?reason=idle_timeout') */
  redirectUrl?: string
  
  /** Skip idle check if no activity ever (default: false) */
  requireInitialActivity?: boolean
  
  /** Enable server-side session validation (default: true) */
  checkServer?: boolean
  
  /** Detect mobile device and adjust timeout (default: true) */
  mobileDetection?: boolean
}

export interface UseIdleTimeoutReturn {
  /** Is user currently idle */
  isIdle: boolean
  
  /** Is warning currently showing */
  isWarning: boolean
  
  /** Seconds remaining until timeout */
  remainingSeconds: number
  
  /** Timestamp of last activity */
  lastActivityAt: Date | null
  
  /** Manually reset idle timer */
  reset: () => void
  
  /** Pause idle detection */
  pause: () => void
  
  /** Resume idle detection */
  resume: () => void
  
  /** Check if detection is paused */
  isPaused: boolean
}

/**
 * Hook for detecting user inactivity and auto logout
 * 
 * Features:
 * - Tracks multiple activity events (mouse, keyboard, scroll, touch)
 * - Configurable timeout and warning periods
 * - Countdown warning before auto logout
 * - Manual reset/pause/resume controls
 * - Automatic redirect to login on timeout
 * 
 * @param options - Configuration options
 * @returns Idle state and control functions
 * 
 * @example
 * ```tsx
 * // Basic usage
 * useIdleTimeout({
 *   timeout: 15 * 60 * 1000, // 15 minutes
 *   warningTime: 2 * 60 * 1000, // 2 minutes warning
 *   onTimeout: () => router.push('/login'),
 * })
 * 
 * // With custom handlers
 * useIdleTimeout({
 *   timeout: 30 * 60 * 1000,
 *   onWarning: (remaining) => {
 *     toast.warning(`Session expires in ${remaining}s`)
 *   },
 *   onTimeout: () => {
 *     saveWork()
 *     router.push('/login')
 *   }
 * })
 * ```
 */
export function useIdleTimeout(
  options: UseIdleTimeoutOptions = {}
): UseIdleTimeoutReturn {
  const {
    timeout = 15 * 60 * 1000,
    warningTime = 2 * 60 * 1000,
    onIdle,
    onWarning,
    onTimeout,
    enabled = true,
    events = DEFAULT_EVENTS,
    debug = false,
    redirectUrl = '/login?reason=idle_timeout',
    requireInitialActivity = false,
    checkServer = true,
    mobileDetection = true,
  } = options

  const router = useRouter()
  
  // Detect mobile device
  const isMobile = mobileDetection && (
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  )

  // Mobile timeout multiplier (2x longer for mobile to account for background tabs)
  const effectiveTimeout = isMobile ? timeout * 2 : timeout
  
  const [isIdle, setIsIdle] = useState(false)
  const [isWarning, setIsWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(Math.floor(effectiveTimeout / 1000))
  const [lastActivityAt, setLastActivityAt] = useState<Date | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(0)
  const isIdleRef = useRef(false)
  const isWarningRef = useRef(false)

  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log('[IdleTimeout]', ...args)
      }
    },
    [debug]
  )

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
      warningRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  // Validate session with server before redirecting
  const validateServerSession = useCallback(async (): Promise<boolean> => {
    if (!checkServer) return true

    try {
      const response = await fetch('/api/auth/check-session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.isActive) {
        log('Server session valid, resetting timer')
        return true
      } else {
        log(`Server session invalid: ${data.reason}`, data)
        // Server already invalidated session
        router.push(`/login?reason=${data.reason}`)
        return false
      }
    } catch (error) {
      log('Server session check failed, proceeding with logout', error)
      return true
    }
  }, [checkServer, log, router])

  const pingServerActivity = useCallback(async () => {
    try {
      await fetch('/api/auth/check-session', {
        method: 'POST',
      })
      log('Server activity updated')
    } catch (error) {
      console.error('Failed to ping server activity:', error)
    }
  }, [log])

  const handleTimeout = useCallback(async () => {
    log('Timeout reached - validating with server before logout')
    isIdleRef.current = true
    setIsIdle(true)
    setIsWarning(false)

    onTimeout?.()

    const shouldProceed = await validateServerSession()
    if (shouldProceed) {
      setTimeout(() => {
        router.push(redirectUrl)
      }, 100)
    }
  }, [log, onTimeout, router, redirectUrl, validateServerSession])

  const startCountdown = useCallback(() => {
    const warningSeconds = Math.floor(warningTime / 1000)
    let remaining = warningSeconds

    setRemainingSeconds(remaining)
    onWarning?.(remaining)

    countdownRef.current = setInterval(() => {
      remaining -= 1
      setRemainingSeconds(remaining)
      onWarning?.(remaining)

      log(`Countdown: ${remaining}s remaining`)

      if (remaining <= 0) {
        handleTimeout()
      }
    }, 1000)
  }, [warningTime, onWarning, log, handleTimeout])

  const handleActivity = useCallback(() => {
    if (!enabled || isPaused) {
      log('Activity detected but disabled or paused')
      return
    }

    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityRef.current

    lastActivityRef.current = now
    setLastActivityAt(new Date())

    // Clear existing timers
    clearAllTimers()

    // Reset idle state
    if (isIdleRef.current) {
      log('User became active again')
      isIdleRef.current = false
      setIsIdle(false)
      setIsWarning(false)
    }

    // If was in warning state, cancel it
    if (isWarningRef.current) {
      log('Activity detected during warning - canceling timeout')
      isWarningRef.current = false
    }

    log(`Activity detected (after ${timeSinceLastActivity}ms inactivity)`)

    // Set warning timer
    warningRef.current = setTimeout(() => {
      log('Warning period starting')
      isWarningRef.current = true
      setIsWarning(true)
      startCountdown()
    }, timeout - warningTime)

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      if (!isWarningRef.current) {
        handleTimeout()
      }
    }, timeout)
  }, [enabled, isPaused, timeout, warningTime, clearAllTimers, startCountdown, handleTimeout, log])

  const reset = useCallback(() => {
    log('Manual reset triggered')
    handleActivity()
  }, [handleActivity, log])

  const pause = useCallback(() => {
    log('Idle detection paused')
    setIsPaused(true)
    clearAllTimers()
  }, [clearAllTimers, log])

  const resume = useCallback(() => {
    log('Idle detection resumed')
    setIsPaused(false)
    lastActivityRef.current = Date.now()
    setLastActivityAt(new Date())
    handleActivity()
  }, [handleActivity, log])

  // Handle tab visibility changes (background/foreground)
  useEffect(() => {
    if (!enabled || !isMobile) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        log('Tab hidden (background) - pausing idle detection')
        pause()
      } else {
        log('Tab visible (foreground) - resuming detection and updating server')
        await pingServerActivity()
        resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, isMobile, pause, resume, pingServerActivity, log])

  // Initial setup and event listeners
  useEffect(() => {
    if (!enabled) {
      log('Idle detection disabled')
      clearAllTimers()
      return
    }

    if (requireInitialActivity) {
      log('Waiting for initial activity before starting timers')
      const initialActivityHandler = () => {
        log('Initial activity detected - starting idle detection')
        handleActivity()
      }

      events.forEach((event) => {
        window.addEventListener(event, initialActivityHandler, {
          passive: true,
          capture: true,
        })
      })

      return () => {
        events.forEach((event) => {
          window.removeEventListener(event, initialActivityHandler)
        })
        clearAllTimers()
      }
    } else {
      // Start immediately
      log('Starting idle detection immediately')
      handleActivity()
    }

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, {
        passive: true,
        capture: true,
      })
    })

    return () => {
      log('Cleaning up idle detection')
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      clearAllTimers()
    }
  }, [enabled, requireInitialActivity, events, handleActivity, clearAllTimers, log])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers()
    }
  }, [clearAllTimers])

  return {
    isIdle,
    isWarning,
    remainingSeconds,
    lastActivityAt,
    reset,
    pause,
    resume,
    isPaused,
  }
}

/**
 * Get default timeout configuration based on user role
 */
export function getIdleTimeoutConfig(role: 'super_admin' | 'guru' | 'siswa'): {
  timeout: number
  warningTime: number
} {
  switch (role) {
    case 'siswa':
      // Students: stricter timeout during exams
      return {
        timeout: 10 * 60 * 1000, // 10 minutes
        warningTime: 2 * 60 * 1000, // 2 minutes warning
      }
    case 'guru':
      // Teachers: moderate timeout
      return {
        timeout: 30 * 60 * 1000, // 30 minutes
        warningTime: 5 * 60 * 1000, // 5 minutes warning
      }
    case 'super_admin':
      // Admins: balanced security and UX
      return {
        timeout: 20 * 60 * 1000, // 20 minutes
        warningTime: 3 * 60 * 1000, // 3 minutes warning
      }
    default:
      return {
        timeout: 15 * 60 * 1000,
        warningTime: 2 * 60 * 1000,
      }
  }
}
