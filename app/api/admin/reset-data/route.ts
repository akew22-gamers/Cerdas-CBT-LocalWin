import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tidak terautentikasi'
        }
      }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Hanya super admin yang dapat mereset data'
        }
      }, { status: 403 });
    }

    const db = getDb();

    const deletedCounts: Record<string, number> = {};

    const tablesToDelete = [
      'jawaban_siswa',
      'hasil_ujian',
      'anti_cheating_log',
      'soal',
      'ujian_kelas',
      'ujian',
      'siswa',
      'kelas',
    ];

    for (const table of tablesToDelete) {
      const countBefore = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
      db.prepare(`DELETE FROM ${table}`).run();
      deletedCounts[table] = countBefore.count;
    }

    const now = getTimestamp();
    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      session.user.id,
      'super_admin',
      'reset_data',
      'system',
      'all',
      toJsonField({ deleted_counts: deletedCounts }),
      now
    );

    return NextResponse.json({
      success: true,
      data: {
        message: 'Data berhasil di-reset',
        deleted_counts: deletedCounts
      }
    });
  } catch (error) {
    console.error('Reset data error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Gagal mereset data'
      }
    }, { status: 500 });
  }
}