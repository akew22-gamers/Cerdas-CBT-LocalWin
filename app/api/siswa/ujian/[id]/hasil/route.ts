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
      SELECT h.id, h.nilai, h.jumlah_benar, h.jumlah_salah, h.is_submitted,
             h.waktu_mulai, h.waktu_selesai, h.tab_switch_count, h.fullscreen_exit_count,
             u.id as ujian_id, u.judul as ujian_judul, u.show_result, u.durasi as ujian_durasi
      FROM hasil_ujian h
      JOIN ujian u ON h.ujian_id = u.id
      WHERE h.siswa_id = ? AND h.ujian_id = ?
    `).get(session.user.id, ujianId) as {
      id: string;
      nilai: number;
      jumlah_benar: number;
      jumlah_salah: number;
      is_submitted: boolean;
      waktu_mulai: string;
      waktu_selesai: string | null;
      tab_switch_count: number;
      fullscreen_exit_count: number;
      ujian_id: string;
      ujian_judul: string;
      show_result: boolean;
      ujian_durasi: number;
    } | undefined;

    if (!hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Hasil ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    const showResult = hasil.show_result ?? false;

    return NextResponse.json({
      success: true,
      data: {
        id: hasil.id,
        nilai: showResult ? Math.round(hasil.nilai * 100) / 100 : null,
        jumlah_benar: showResult ? hasil.jumlah_benar : 0,
        jumlah_salah: showResult ? hasil.jumlah_salah : 0,
        is_submitted: hasil.is_submitted,
        waktu_mulai: hasil.waktu_mulai,
        waktu_selesai: hasil.waktu_selesai,
        tab_switch_count: showResult ? hasil.tab_switch_count : 0,
        fullscreen_exit_count: showResult ? hasil.fullscreen_exit_count : 0,
        show_result: showResult,
        ujian: {
          id: hasil.ujian_id,
          judul: hasil.ujian_judul,
          durasi: hasil.ujian_durasi
        }
      }
    });

  } catch (error) {
    console.error('Get hasil error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
