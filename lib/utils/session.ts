import { Session } from '@supabase/supabase-js'

// Session expiry: 7 days (604800 seconds)
export const SESSION_EXPIRY_SECONDS = parseInt(process.env.SESSION_EXPIRY_SECONDS || '604800', 10)

// Refresh threshold: 1 hour (3600 seconds) - refresh if < 1 hour left
export const TOKEN_REFRESH_THRESHOLD = parseInt(process.env.TOKEN_REFRESH_THRESHOLD || '3600', 10)

/**
 * Get the session expiry timestamp in seconds (Unix timestamp)
 */
export function getSessionExpiry(session: Session): number {
  if (!session?.expires_at) {
    return 0
  }
  return session.expires_at
}

/**
 * Check if session needs refresh based on threshold
 * Returns true if session expires within the threshold period
 */
export function needsRefresh(session: Session, threshold: number = TOKEN_REFRESH_THRESHOLD): boolean {
  if (!session?.expires_at) {
    return true
  }
  
  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = session.expires_at - now
  
  return timeUntilExpiry <= threshold
}

/**
 * Get time until session expires in seconds
 * Returns negative number if already expired
 */
export function timeUntilExpiry(session: Session): number {
  if (!session?.expires_at) {
    return 0
  }
  
  const now = Math.floor(Date.now() / 1000)
  return session.expires_at - now
}

/**
 * Check if session is expired
 */
export function isExpired(session: Session): boolean {
  return timeUntilExpiry(session) <= 0
}

/**
 * Get time until session expires in milliseconds (for setTimeout)
 */
export function timeUntilExpiryMs(session: Session): number {
  return timeUntilExpiry(session) * 1000
}

/**
 * Get time until refresh is needed in milliseconds (for setTimeout)
 */
export function timeUntilRefreshNeededMs(session: Session, threshold: number = TOKEN_REFRESH_THRESHOLD): number {
  if (!session?.expires_at) {
    return 0
  }
  
  const now = Math.floor(Date.now() / 1000)
  const timeUntilRefresh = (session.expires_at - threshold) - now
  
  return Math.max(0, timeUntilRefresh * 1000)
}
