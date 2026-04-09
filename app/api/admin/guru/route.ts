import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';
import { hashPassword } from '@/lib/auth/password';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let guruList;
    let total;

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      guruList = db.prepare(`
        SELECT * FROM guru
        WHERE LOWER(username) LIKE ? OR LOWER(nama) LIKE ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(searchTerm, searchTerm, limit, offset) as Array<{
        id: string;
        username: string;
        nama: string;
        created_by: string | null;
        created_at: string;
        updated_at: string;
      }>;

      const countResult = db.prepare(`
        SELECT COUNT(*) as count FROM guru
        WHERE LOWER(username) LIKE ? OR LOWER(nama) LIKE ?
      `).get(searchTerm, searchTerm) as { count: number };
      total = countResult.count;
    } else {
      guruList = db.prepare(`
        SELECT * FROM guru
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset) as Array<{
        id: string;
        username: string;
        nama: string;
        created_by: string | null;
        created_at: string;
        updated_at: string;
      }>;

      const countResult = db.prepare('SELECT COUNT(*) as count FROM guru').get() as { count: number };
      total = countResult.count;
    }

    return NextResponse.json({
      success: true,
      data: {
        guru: guruList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/guru:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { username, nama, password } = body;

    if (!username || !nama || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Username, nama, dan password harus diisi' } },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_USERNAME', message: 'Username hanya boleh berisi huruf, angka, dan underscore' } },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password harus minimal 6 karakter' } },
        { status: 400 }
      );
    }

    const existingGuru = db.prepare('SELECT id FROM guru WHERE username = ?').get(username);
    if (existingGuru) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_USERNAME', message: 'Username sudah terdaftar' } },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const id = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO guru (id, username, nama, password_hash, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, nama, passwordHash, session.user.id, now, now);

    const newGuru = db.prepare('SELECT id, username, nama, created_by, created_at FROM guru WHERE id = ?').get(id);

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      session.user.id,
      'super_admin',
      'create',
      'guru',
      id,
      toJsonField({ username, nama }),
      now
    );

    return NextResponse.json({
      success: true,
      data: { guru: newGuru }
    });

  } catch (error) {
    console.error('Error in POST /api/admin/guru:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}