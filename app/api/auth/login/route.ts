import { NextResponse } from 'next/server';
import { loginSuperAdmin, loginGuru, loginSiswa } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Username, password, dan role harus diisi' } },
        { status: 400 }
      );
    }

    let result;
    
    if (role === 'super_admin') {
      result = await loginSuperAdmin(username, password);
    } else if (role === 'guru') {
      result = await loginGuru(username, password);
    } else if (role === 'siswa') {
      result = await loginSiswa(username, password);
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ROLE', message: 'Role tidak valid' } },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: result.error } },
        { status: 401 }
      );
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      result.session!.user.id,
      role,
      'login',
      'user',
      result.session!.user.id,
      toJsonField({ login_method: 'password' }),
      getTimestamp()
    );

    return NextResponse.json({
      success: true,
      data: {
        user: result.session!.user
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}