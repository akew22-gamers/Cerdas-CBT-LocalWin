import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'siswa') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak' } },
        { status: 403 }
      );
    }

    const db = getDb();
    const { id: ujianId } = await params;
    const body = await request.json();
    const { event_type, details } = body;

    if (!event_type || !['fullscreen_exit', 'tab_switch', 'window_blur'].includes(event_type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Event type tidak valid' } },
        { status: 400 }
      );
    }

    const hasil = db.prepare(`
      SELECT id, is_submitted, tab_switch_count, fullscreen_exit_count
      FROM hasil_ujian
      WHERE siswa_id = ? AND ujian_id = ?
    `).get(session.user.id, ujianId) as {
      id: string;
      is_submitted: boolean;
      tab_switch_count: number;
      fullscreen_exit_count: number;
    } | undefined;

    if (!hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Hasil ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (hasil.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Ujian sudah selesai' } },
        { status: 400 }
      );
    }

    const now = getTimestamp();
    db.prepare(`
      INSERT INTO anti_cheating_log (id, hasil_ujian_id, event_type, event_time, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      hasil.id,
      event_type,
      now,
      toJsonField(details || {}),
      now
    );

    const counterField = event_type === 'fullscreen_exit' ? 'fullscreen_exit_count' : 'tab_switch_count';
    const newValue = (hasil[counterField] || 0) + 1;

    db.prepare(`
      UPDATE hasil_ujian SET ${counterField} = ? WHERE id = ?
    `).run(newValue, hasil.id);

    return NextResponse.json({
      success: true,
      message: 'Event berhasil dicatat'
    });

  } catch (error) {
    console.error('Cheating event error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
