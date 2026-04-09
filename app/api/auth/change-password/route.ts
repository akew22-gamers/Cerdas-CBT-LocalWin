import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { old_password, new_password } = body;

    if (!old_password || !new_password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Password lama dan baru harus diisi' } },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password baru minimal 6 karakter' } },
        { status: 400 }
      );
    }

    const db = getDb();
    const { user } = session;

    let tableName = '';
    switch (user.role) {
      case 'super_admin':
        tableName = 'super_admin';
        break;
      case 'guru':
        tableName = 'guru';
        break;
      case 'siswa':
        tableName = 'siswa';
        break;
      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ROLE', message: 'Role tidak valid' } },
          { status: 400 }
        );
    }

    const userData = db.prepare(`SELECT id, password_hash FROM ${tableName} WHERE id = ?`).get(user.id) as { id: string; password_hash: string } | undefined;

    if (!userData) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User tidak ditemukan' } },
        { status: 404 }
      );
    }

    const isValidPassword = await verifyPassword(old_password, userData.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Password lama salah' } },
        { status: 401 }
      );
    }

    const newPasswordHash = await hashPassword(new_password);
    const now = getTimestamp();

    if (tableName === 'guru' || tableName === 'siswa') {
      db.prepare(`UPDATE ${tableName} SET password_hash = ?, updated_at = ? WHERE id = ?`).run(newPasswordHash, now, user.id);
    } else {
      db.prepare(`UPDATE ${tableName} SET password_hash = ? WHERE id = ?`).run(newPasswordHash, user.id);
    }

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      user.id,
      user.role,
      'change_password',
      'user',
      user.id,
      toJsonField({ method: 'self_update' }),
      now
    );

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}