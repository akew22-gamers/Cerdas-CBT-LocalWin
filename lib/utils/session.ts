export interface Session {
  expires_at?: number;
  user?: {
    id: string;
    role?: string;
  };
}

export const SESSION_EXPIRY_SECONDS = parseInt(process.env.SESSION_EXPIRY_SECONDS || '604800', 10);
export const TOKEN_REFRESH_THRESHOLD = parseInt(process.env.TOKEN_REFRESH_THRESHOLD || '3600', 10);

export function getSessionExpiry(session: Session): number {
  if (!session?.expires_at) {
    return 0;
  }
  return session.expires_at;
}

export function needsRefresh(session: Session, threshold: number = TOKEN_REFRESH_THRESHOLD): boolean {
  if (!session?.expires_at) {
    return true;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = session.expires_at - now;
  
  return timeUntilExpiry <= threshold;
}

export function timeUntilExpiry(session: Session): number {
  if (!session?.expires_at) {
    return 0;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at - now;
}

export function isExpired(session: Session): boolean {
  return timeUntilExpiry(session) <= 0;
}

export function timeUntilExpiryMs(session: Session): number {
  return timeUntilExpiry(session) * 1000;
}

export function timeUntilRefreshNeededMs(session: Session, threshold: number = TOKEN_REFRESH_THRESHOLD): number {
  if (!session?.expires_at) {
    return 0;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const timeUntilRefresh = (session.expires_at - threshold) - now;
  
  return Math.max(0, timeUntilRefresh * 1000);
}