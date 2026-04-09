import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp } from '@/lib/db/utils';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const sekolah = db.prepare(`
      SELECT * FROM identitas_sekolah
      ORDER BY updated_at DESC
      LIMIT 1
    `).get();

    return NextResponse.json({
      success: true,
      data: { sekolah: sekolah || null }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/sekolah:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    const {
      nama_sekolah,
      npsn,
      alamat,
      logo_url,
      telepon,
      email,
      website,
      kepala_sekolah,
      tahun_ajaran
    } = body;

    if (!nama_sekolah || !tahun_ajaran) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Nama sekolah dan tahun ajaran harus diisi' } },
        { status: 400 }
      );
    }

    const existingData = db.prepare(`
      SELECT id FROM identitas_sekolah
      ORDER BY updated_at DESC
      LIMIT 1
    `).get() as { id: string } | undefined;

    const now = getTimestamp();

    if (existingData) {
      db.prepare(`
        UPDATE identitas_sekolah SET
          nama_sekolah = ?,
          npsn = ?,
          alamat = ?,
          logo_url = ?,
          telepon = ?,
          email = ?,
          website = ?,
          kepala_sekolah = ?,
          tahun_ajaran = ?,
          updated_by = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        nama_sekolah,
        npsn || null,
        alamat || null,
        logo_url || null,
        telepon || null,
        email || null,
        website || null,
        kepala_sekolah || null,
        tahun_ajaran,
        session.user.id,
        now,
        existingData.id
      );

      const updatedSekolah = db.prepare('SELECT * FROM identitas_sekolah WHERE id = ?').get(existingData.id);

      return NextResponse.json({
        success: true,
        data: { sekolah: updatedSekolah }
      });
    } else {
      const id = generateId();

      db.prepare(`
        INSERT INTO identitas_sekolah (
          id, nama_sekolah, npsn, alamat, logo_url, telepon, email, website,
          kepala_sekolah, tahun_ajaran, updated_by, setup_wizard_completed, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        id,
        nama_sekolah,
        npsn || null,
        alamat || null,
        logo_url || null,
        telepon || null,
        email || null,
        website || null,
        kepala_sekolah || null,
        tahun_ajaran,
        session.user.id,
        now,
        now
      );

      const newSekolah = db.prepare('SELECT * FROM identitas_sekolah WHERE id = ?').get(id);

      return NextResponse.json({
        success: true,
        data: { sekolah: newSekolah }
      });
    }

  } catch (error) {
    console.error('Error in PUT /api/admin/sekolah:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}