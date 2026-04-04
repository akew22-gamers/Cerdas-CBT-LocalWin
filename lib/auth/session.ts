import { cookies } from 'next/headers'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes, createHash, createHmac } from 'crypto'

export const SESSION_COOKIE_NAME = 'cbt_session_token'
export const SESSION_CLAIMS_COOKIE_NAME = 'cbt_session_claims'
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60 // 7 days

export interface SessionUser {
  id: string
  username: string
  nama: string | null
  role: 'super_admin' | 'guru' | 'siswa'
  nisn?: string
}

export interface SessionData {
  user: SessionUser
  token: string
  expiresAt: Date
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// --- Claims Cookie (untuk middleware tanpa DB query) ---

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.SETUP_TOKEN || 'fallback-secret-change-me'
}

export function signClaims(payload: { role: string; uid: string; exp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', getSessionSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyClaims(claims: string): { role: string; uid: string; exp: number } | null {
  try {
    const [data, sig] = claims.split('.')
    if (!data || !sig) return null
    const expected = createHmac('sha256', getSessionSecret()).update(data).digest('base64url')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// --- Session management ---

export async function createSession(
  userId: string,
  role: 'super_admin' | 'guru' | 'siswa',
  username: string,
  nama: string | null
): Promise<SessionData> {
  const supabase = createAdminClient()
  const token = generateSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)

  const { error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      role,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString()
    })

  if (error) {
    throw new Error('Failed to create session')
  }

  return {
    user: { id: userId, username, nama, role },
    token,
    expiresAt
  }
}

/**
 * getSession — di-cache per request lifecycle menggunakan React.cache().
 * Artinya dalam satu halaman, meskipun dipanggil berkali-kali,
 * query ke database hanya dilakukan satu kali.
 */
export const getSession = cache(async (): Promise<SessionData | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const supabase = createAdminClient()
  const tokenHash = hashToken(token)

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, user_id, role, expires_at')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !session) {
    return null
  }

  // Ambil data user berdasarkan role
  let username = ''
  let nama: string | null = null

  if (session.role === 'super_admin') {
    const { data } = await supabase
      .from('super_admin')
      .select('username')
      .eq('id', session.user_id)
      .single()
    username = data?.username || ''
  } else if (session.role === 'guru') {
    const { data } = await supabase
      .from('guru')
      .select('username, nama')
      .eq('id', session.user_id)
      .single()
    username = data?.username || ''
    nama = data?.nama || null
  } else if (session.role === 'siswa') {
    const { data } = await supabase
      .from('siswa')
      .select('nisn, nama')
      .eq('id', session.user_id)
      .single()
    username = data?.nisn || ''
    nama = data?.nama || null
  }

  return {
    user: {
      id: session.user_id,
      username,
      nama,
      role: session.role,
      ...(session.role === 'siswa' && { nisn: username })
    },
    token,
    expiresAt: new Date(session.expires_at)
  }
})

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (token) {
    const supabase = createAdminClient()
    const tokenHash = hashToken(token)
    await supabase.from('sessions').delete().eq('token_hash', tokenHash)
  }
}

export function setSessionCookie(token: string, expiresAt: Date): void {
  ;(async () => {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    })
  })()
}

export function clearSessionCookie(): void {
  ;(async () => {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
    cookieStore.delete(SESSION_CLAIMS_COOKIE_NAME)
  })()
}