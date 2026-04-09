import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';
import { hashPassword } from '@/lib/auth/password';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } },
        { status: 403 }
      );
    }

    const db = getDb();
    const { id } = await params;

    const body = await request.json();
    const { new_password } = body;

    if (!new_password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Password baru harus diisi' } },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password harus minimal 6 karakter' } },
        { status: 400 }
      );
    }

    const existingGuru = db.prepare('SELECT id, username, nama FROM guru WHERE id = ?').get(id) as {
      id: string;
      username: string;
      nama: string;
    } | undefined;

    if (!existingGuru) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guru tidak ditemukan' } },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(new_password);
    const now = getTimestamp();

    db.prepare('UPDATE guru SET password_hash = ?, updated_at = ? WHERE id = ?').run(passwordHash, now, id);

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      session.user.id,
      'super_admin',
      'reset_password',
      'guru',
      id,
      toJsonField({ username: existingGuru.username, nama: existingGuru.nama }),
      now
    );

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset'
    });

  } catch (error) {
    console.error('Error in POST /api/admin/guru/[id]/reset-password:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}