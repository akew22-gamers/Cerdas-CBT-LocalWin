import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
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

    const hasil = db.prepare(`
      SELECT h.id, h.is_submitted, h.waktu_mulai, h.tab_switch_count, h.fullscreen_exit_count, u.durasi
      FROM hasil_ujian h
      JOIN ujian u ON h.ujian_id = u.id
      WHERE h.siswa_id = ? AND h.ujian_id = ?
    `).get(session.user.id, ujianId) as {
      id: string;
      is_submitted: boolean;
      waktu_mulai: string;
      tab_switch_count: number;
      fullscreen_exit_count: number;
      durasi: number;
    } | undefined;

    if (!hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_NOT_STARTED', message: 'Ujian belum dimulai' } },
        { status: 400 }
      );
    }

    const durasiMs = (hasil.durasi ?? 60) * 60 * 1000;
    const waktuMulai = new Date(hasil.waktu_mulai).getTime();
    const now = Date.now();
    const elapsed = now - waktuMulai;
    const remaining = Math.max(0, durasiMs - elapsed);

    const isFinished = remaining <= 0 || hasil.is_submitted;

    const jawabanCount = db.prepare(`
      SELECT COUNT(*) as count FROM jawaban_siswa
      WHERE siswa_id = ? AND ujian_id = ?
    `).get(session.user.id, ujianId) as { count: number };

    const soalCount = db.prepare(`
      SELECT COUNT(*) as count FROM soal WHERE ujian_id = ?
    `).get(ujianId) as { count: number };

    return NextResponse.json({
      success: true,
      data: {
        is_submitted: hasil.is_submitted,
        is_finished: isFinished,
        time_remaining_ms: remaining,
        time_remaining_seconds: Math.floor(remaining / 1000),
        answered_count: jawabanCount?.count || 0,
        total_questions: soalCount?.count || 0,
        tab_switch_count: hasil.tab_switch_count,
        fullscreen_exit_count: hasil.fullscreen_exit_count
      }
    });

  } catch (error: any) {
    console.error('Get status error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
