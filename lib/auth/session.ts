import { cookies } from 'next/headers';
import { verifyToken, signToken, JwtPayload } from './jwt';
import { getDb } from '@/lib/db/client';
import { hashToken } from './password';

const SESSION_COOKIE_NAME = 'cbt_session_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  username: string;
  nama: string | null;
  role: 'super_admin' | 'guru' | 'siswa';
  nisn?: string;
}

export interface SessionData {
  user: SessionUser;
  token: string;
  expiresAt: Date;
}

export async function createSession(
  userId: string,
  role: 'super_admin' | 'guru' | 'siswa',
  username: string,
  nama: string | null
): Promise<SessionData> {
  const jwtPayload: JwtPayload = {
    id: userId,
    role,
    username,
    nama: nama || undefined,
  };
  
  const token = signToken(jwtPayload);
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  
  const db = getDb();
  const tokenHash = hashToken(token);
  
  db.prepare(`
    INSERT INTO sessions (id, user_id, role, token_hash, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    userId,
    role,
    tokenHash,
    expiresAt.toISOString()
  );
  
  return {
    user: { id: userId, username, nama, role },
    token,
    expiresAt,
  };
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const db = getDb();
  const tokenHash = hashToken(token);
  
  const session = db.prepare(`
    SELECT id, user_id, role, expires_at
    FROM sessions
    WHERE token_hash = ? AND expires_at > ?
  `).get(tokenHash, new Date().toISOString()) as { 
    id: string; 
    user_id: string; 
    role: string; 
    expires_at: string;
  } | undefined;
  
  if (!session) return null;
  
  let username = '';
  let nama: string | null = null;
  
  if (payload.role === 'super_admin') {
    const admin = db.prepare('SELECT username FROM super_admin WHERE id = ?').get(payload.id) as { username: string } | undefined;
    username = admin?.username || '';
  } else if (payload.role === 'guru') {
    const guru = db.prepare('SELECT username, nama FROM guru WHERE id = ?').get(payload.id) as { username: string; nama: string } | undefined;
    username = guru?.username || '';
    nama = guru?.nama || null;
  } else if (payload.role === 'siswa') {
    const siswa = db.prepare('SELECT nisn, nama FROM siswa WHERE id = ?').get(payload.id) as { nisn: string; nama: string } | undefined;
    username = siswa?.nisn || '';
    nama = siswa?.nama || null;
  }
  
  return {
    user: {
      id: payload.id,
      username,
      nama,
      role: payload.role as 'super_admin' | 'guru' | 'siswa',
      ...(payload.role === 'siswa' && { nisn: username }),
    },
    token,
    expiresAt: new Date(session.expires_at),
  };
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    const db = getDb();
    const tokenHash = hashToken(token);
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  }
}

export function setSessionCookie(token: string, expiresAt: Date): void {
  (async () => {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });
  })();
}

export function clearSessionCookie(): void {
  (async () => {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  })();
}

export { SESSION_COOKIE_NAME };