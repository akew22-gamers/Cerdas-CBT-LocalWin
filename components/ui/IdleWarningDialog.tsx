'use client'

import * as React from 'react'
import { Clock, LogOut, CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface IdleWarningDialogProps {
  /** Is warning dialog visible */
  open: boolean
  
  /** Seconds remaining until auto logout */
  remainingSeconds: number
  
  /** Callback when user clicks "Stay Logged In" */
  onStayLoggedIn: () => void
  
  /** Custom title */
  title?: string
  
  /** Custom description */
  description?: string
  
  /** Custom button text */
  stayLoggedInText?: string
  
  /** Show logout button */
  showLogoutButton?: boolean
}

/**
 * Idle Warning Dialog - Shows countdown before auto logout
 * 
 * Features:
 * - Animated countdown timer
 * - Visual urgency indicators (color changes)
 * - Stay logged in button to reset timer
 * - Optional manual logout button
 * - Responsive design
 */
export function IdleWarningDialog({
  open,
  remainingSeconds,
  onStayLoggedIn,
  title = 'Sesi Anda Hampir Berakhir',
  description = 'Karena tidak ada aktivitas, Anda akan keluar otomatis dalam beberapa saat.',
  stayLoggedInText = 'Tetap Masuk',
  showLogoutButton = true,
}: IdleWarningDialogProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Calculate urgency level
  const urgency = React.useMemo(() => {
    if (remainingSeconds <= 10) return 'critical'
    if (remainingSeconds <= 30) return 'high'
    if (remainingSeconds <= 60) return 'medium'
    return 'low'
  }, [remainingSeconds])

  // Format remaining time
  const formattedTime = React.useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [remainingSeconds])

  const urgencyStyles = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    high: 'bg-orange-50 border-orange-200 text-orange-900',
    medium: 'bg-amber-50 border-amber-200 text-amber-900',
    low: 'bg-blue-50 border-blue-200 text-blue-900',
  }

  const iconStyles = {
    critical: 'text-red-600 animate-pulse',
    high: 'text-orange-600 animate-pulse',
    medium: 'text-amber-600',
    low: 'text-blue-600',
  }

  const buttonStyles = {
    critical: 'bg-red-600 hover:bg-red-700',
    high: 'bg-orange-600 hover:bg-orange-700',
    medium: 'bg-amber-600 hover:bg-amber-700',
    low: 'bg-blue-600 hover:bg-blue-700',
  }

  if (!isVisible && !open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4',
          'transition-all duration-300',
          open
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div
          className={cn(
            'rounded-2xl border-2 shadow-2xl overflow-hidden',
            urgencyStyles[urgency]
          )}
        >
          {/* Header with Icon */}
          <div className="flex items-center gap-4 p-6 border-b border-current border-opacity-20">
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-white bg-opacity-50 shadow-inner',
                iconStyles[urgency]
              )}
            >
              <CircleAlert className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h2
                id="dialog-title"
                className="text-lg font-bold leading-tight"
              >
                {title}
              </h2>
              <p
                id="dialog-description"
                className="text-sm mt-1 opacity-80"
              >
                {description}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-3">
              <Clock
                className={cn('w-6 h-6', iconStyles[urgency])}
              />
              <div className="text-center">
                <div
                  className={cn(
                    'text-5xl font-bold tabular-nums tracking-tight',
                    urgency === 'critical' || urgency === 'high'
                      ? 'animate-pulse'
                      : ''
                  )}
                >
                  {formattedTime}
                </div>
                <p className="text-xs mt-1 opacity-70">
                  {remainingSeconds <= 10
                    ? 'Segera keluar...'
                    : remainingSeconds <= 30
                      ? 'Waktu hampir habis!'
                      : remainingSeconds <= 60
                        ? 'Menit terakhir'
                        : 'menit tersisa'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {/* Stay Logged In - Primary Action */}
              <Button
                onClick={onStayLoggedIn}
                className={cn(
                  'flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]',
                  buttonStyles[urgency]
                )}
              >
                <LogOut className="w-5 h-5 mr-2 rotate-180" />
                {stayLoggedInText}
              </Button>

              {/* Manual Logout - Secondary Action */}
              {showLogoutButton && (
                <Button
                  onClick={() => window.location.href = '/api/auth/logout'}
                  variant="outline"
                  className="h-12 px-6 font-medium border-2 hover:bg-current hover:bg-opacity-10 transition-all active:scale-[0.98]"
                >
                  Keluar
                </Button>
              )}
            </div>

            {/* Security Note */}
            <div className="text-center pt-2">
              <p className="text-xs opacity-60">
                Klik "{stayLoggedInText}" untuk melanjutkan sesi Anda
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * CompactIdleWarning - Smaller inline warning banner
 * For use in mobile or when space is limited
 */
export function CompactIdleWarning({
  remainingSeconds,
  onStayLoggedIn,
  className,
}: {
  remainingSeconds: number
  onStayLoggedIn: () => void
  className?: string
}) {
  const urgency = remainingSeconds <= 10 ? 'critical' : remainingSeconds <= 30 ? 'high' : 'low'

  const urgencyStyles = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    low: 'bg-blue-500 text-white',
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 p-3 shadow-lg',
        urgencyStyles[urgency],
        className
      )}
      role="alert"
    >
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-semibold">
            Keluar otomatis dalam {remainingSeconds}s
          </span>
        </div>
        <Button
          onClick={onStayLoggedIn}
          size="sm"
          variant="outline"
          className="bg-white text-current border-2 font-semibold h-9 px-4 hover:bg-opacity-90 active:scale-95 transition-all"
        >
          Tetap Masuk
        </Button>
      </div>
    </div>
  )
}
