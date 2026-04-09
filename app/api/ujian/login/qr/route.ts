import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';
import { createSession, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { ujian_id, siswa_id, kode_ujian } = body;

    if (!ujian_id || !siswa_id || !kode_ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Data QR Code tidak lengkap' } },
        { status: 400 }
      );
    }

    const siswa = db.prepare('SELECT * FROM siswa WHERE id = ?').get(siswa_id) as {
      id: string;
      nisn: string;
      nama: string;
      kelas_id: string | null;
    } | undefined;

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Siswa tidak ditemukan' } },
        { status: 401 }
      );
    }

    const ujian = db.prepare('SELECT * FROM ujian WHERE kode_ujian = ? AND id = ?').get(kode_ujian, ujian_id) as {
      id: string;
      kode_ujian: string;
      status: string;
    } | undefined;

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_NOT_FOUND', message: 'Kode ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (!siswa.kelas_id) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_ENROLLED', message: 'Siswa tidak terdaftar di kelas manapun' } },
        { status: 403 }
      );
    }

    const ujianKelas = db.prepare('SELECT id FROM ujian_kelas WHERE ujian_id = ? AND kelas_id = ?').get(ujian.id, siswa.kelas_id);

    if (!ujianKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_ENROLLED', message: 'Kelas Anda tidak terdaftar untuk ujian ini' } },
        { status: 403 }
      );
    }

    const session = await createSession(
      siswa.id,
      'siswa',
      siswa.nisn,
      siswa.nama || null
    );

    setSessionCookie(session.token, session.expiresAt);

    const now = getTimestamp();
    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      siswa.id,
      'siswa',
      'login',
      'user',
      siswa.id,
      toJsonField({ login_method: 'qr_scanner', ujian_id: ujian.id, kode_ujian: kode_ujian }),
      now
    );

    const redirectUrl = `/siswa/ujian/${ujian.id}`;

    return NextResponse.json({
      success: true,
      data: {
        siswa_id: siswa.id,
        ujian_id: ujian.id,
        redirect_url: redirectUrl
      }
    });

  } catch (error) {
    console.error('QR Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}