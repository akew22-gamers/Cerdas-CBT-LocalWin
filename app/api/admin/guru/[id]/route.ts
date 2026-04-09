import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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

    const guru = db.prepare('SELECT id, username, nama, created_by, created_at, updated_at FROM guru WHERE id = ?').get(id);

    if (!guru) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guru tidak ditemukan' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { guru }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/guru/[id]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
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
    const { nama, username } = body;

    if (!nama) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Nama harus diisi' } },
        { status: 400 }
      );
    }

    const existingGuru = db.prepare('SELECT id, username FROM guru WHERE id = ?').get(id) as { id: string; username: string } | undefined;

    if (!existingGuru) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guru tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (username && username !== existingGuru.username) {
      const duplicateGuru = db.prepare('SELECT id FROM guru WHERE username = ? AND id != ?').get(username, id);
      
      if (duplicateGuru) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_USERNAME', message: 'Username sudah terdaftar' } },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_USERNAME', message: 'Username hanya boleh berisi huruf, angka, dan underscore' } },
          { status: 400 }
        );
      }
    }

    const now = getTimestamp();
    const newUsername = username || existingGuru.username;

    db.prepare(`
      UPDATE guru SET nama = ?, username = ?, updated_at = ? WHERE id = ?
    `).run(nama, newUsername, now, id);

    const updatedGuru = db.prepare('SELECT id, username, nama, created_by, created_at, updated_at FROM guru WHERE id = ?').get(id);

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      session.user.id,
      'super_admin',
      'update',
      'guru',
      id,
      toJsonField({ username: newUsername, nama }),
      now
    );

    return NextResponse.json({
      success: true,
      data: { guru: updatedGuru }
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/guru/[id]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    const existingGuru = db.prepare('SELECT id, username, nama FROM guru WHERE id = ?').get(id) as { id: string; username: string; nama: string } | undefined;

    if (!existingGuru) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guru tidak ditemukan' } },
        { status: 404 }
      );
    }

    const kelasCount = db.prepare('SELECT COUNT(*) as count FROM kelas WHERE created_by = ?').get(id) as { count: number };
    const ujianCount = db.prepare('SELECT COUNT(*) as count FROM ujian WHERE created_by = ?').get(id) as { count: number };

    const totalRelated = kelasCount.count + ujianCount.count;

    if (totalRelated > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'HAS_RELATED_DATA', 
            message: `Guru tidak dapat dihapus karena masih memiliki ${kelasCount.count} kelas dan ${ujianCount.count} ujian` 
          } 
        },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM guru WHERE id = ?').run(id);

    const now = getTimestamp();
    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      session.user.id,
      'super_admin',
      'delete',
      'guru',
      id,
      toJsonField({ username: existingGuru.username, nama: existingGuru.nama }),
      now
    );

    return NextResponse.json({
      success: true,
      message: 'Guru berhasil dihapus'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/guru/[id]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}