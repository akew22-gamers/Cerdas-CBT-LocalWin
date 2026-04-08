import { getDb } from '@/lib/db/client';
import { verifyPassword } from './password';
import { createSession, setSessionCookie } from './session';
import { SessionData } from './session';

export interface LoginResult {
  success: boolean;
  session?: SessionData;
  error?: string;
}

export async function loginSuperAdmin(username: string, password: string): Promise<LoginResult> {
  const db = getDb();
  
  const admin = db.prepare('SELECT id, username, password_hash FROM super_admin WHERE username = ?').get(username) as {
    id: string;
    username: string;
    password_hash: string;
  } | undefined;
  
  if (!admin) {
    return { success: false, error: 'Username tidak ditemukan' };
  }
  
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    return { success: false, error: 'Password salah' };
  }
  
  const session = await createSession(admin.id, 'super_admin', admin.username, null);
  setSessionCookie(session.token, session.expiresAt);
  
  return { success: true, session };
}

export async function loginGuru(username: string, password: string): Promise<LoginResult> {
  const db = getDb();
  
  const guru = db.prepare('SELECT id, username, nama, password_hash FROM guru WHERE username = ?').get(username) as {
    id: string;
    username: string;
    nama: string;
    password_hash: string;
  } | undefined;
  
  if (!guru) {
    return { success: false, error: 'Username tidak ditemukan' };
  }
  
  const valid = await verifyPassword(password, guru.password_hash);
  if (!valid) {
    return { success: false, error: 'Password salah' };
  }
  
  const session = await createSession(guru.id, 'guru', guru.username, guru.nama);
  setSessionCookie(session.token, session.expiresAt);
  
  return { success: true, session };
}

export async function loginSiswa(nisn: string, password: string): Promise<LoginResult> {
  const db = getDb();
  
  const siswa = db.prepare('SELECT id, nisn, nama, password_hash FROM siswa WHERE nisn = ?').get(nisn) as {
    id: string;
    nisn: string;
    nama: string;
    password_hash: string;
  } | undefined;
  
  if (!siswa) {
    return { success: false, error: 'NISN tidak ditemukan' };
  }
  
  const valid = await verifyPassword(password, siswa.password_hash);
  if (!valid) {
    return { success: false, error: 'Password salah' };
  }
  
  const session = await createSession(siswa.id, 'siswa', siswa.nisn, siswa.nama);
  setSessionCookie(session.token, session.expiresAt);
  
  return { success: true, session };
}

export async function loginUjianByCode(kodeUjian: string, nisn: string, password: string): Promise<LoginResult> {
  const db = getDb();
  
  const ujian = db.prepare('SELECT id, status FROM ujian WHERE kode_ujian = ?').get(kodeUjian) as {
    id: string;
    status: string;
  } | undefined;
  
  if (!ujian) {
    return { success: false, error: 'Kode ujian tidak ditemukan' };
  }
  
  if (ujian.status !== 'aktif') {
    return { success: false, error: 'Ujian belum aktif' };
  }
  
  const siswa = db.prepare('SELECT id, nisn, nama, password_hash, kelas_id FROM siswa WHERE nisn = ?').get(nisn) as {
    id: string;
    nisn: string;
    nama: string;
    password_hash: string;
    kelas_id: string | null;
  } | undefined;
  
  if (!siswa) {
    return { success: false, error: 'NISN tidak ditemukan' };
  }
  
  const valid = await verifyPassword(password, siswa.password_hash);
  if (!valid) {
    return { success: false, error: 'Password salah' };
  }
  
  if (siswa.kelas_id) {
    const ujianKelas = db.prepare('SELECT id FROM ujian_kelas WHERE ujian_id = ? AND kelas_id = ?').get(ujian.id, siswa.kelas_id);
    if (!ujianKelas) {
      return { success: false, error: 'Anda tidak terdaftar untuk ujian ini' };
    }
  }
  
  const session = await createSession(siswa.id, 'siswa', siswa.nisn, siswa.nama);
  setSessionCookie(session.token, session.expiresAt);
  
  return { success: true, session };
}