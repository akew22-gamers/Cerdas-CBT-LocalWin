import {cookies} from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes, createHash } from 'crypto'

export const SESSION_COOKIE_NAME = 'cbt_session_token'
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60 // 7 days

export interface SessionUser {
  id: string
  username: string
  nama: string | null
  role: 'super_admin' | 'guru' | 'siswa'
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

export async function getSession(): Promise<SessionData | null> {
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

  // Get user details based on role
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
      role: session.role
    },
    token,
    expiresAt: new Date(session.expires_at)
  }
}

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
  })()
}