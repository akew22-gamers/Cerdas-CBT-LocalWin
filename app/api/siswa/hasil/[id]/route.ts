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
    const { id: hasilId } = await params;

    const hasil = db.prepare(`
      SELECT h.id, h.nilai, h.jumlah_benar, h.jumlah_salah, h.waktu_mulai, h.waktu_selesai, h.is_submitted,
             u.id as ujian_id, u.judul as ujian_judul, u.show_result, u.durasi
      FROM hasil_ujian h
      JOIN ujian u ON h.ujian_id = u.id
      WHERE h.id = ? AND h.siswa_id = ?
    `).get(hasilId, session.user.id) as {
      id: string;
      nilai: number;
      jumlah_benar: number;
      jumlah_salah: number;
      waktu_mulai: string;
      waktu_selesai: string | null;
      is_submitted: number;
      ujian_id: string;
      ujian_judul: string;
      show_result: number;
      durasi: number;
    } | undefined;

    if (!hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Hasil ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    const totalSoalResult = db.prepare('SELECT COUNT(*) as count FROM soal WHERE ujian_id = ?').get(hasil.ujian_id) as { count: number };

    const showResult = hasil.show_result === 1;

    return NextResponse.json({
      success: true,
      data: {
        id: hasil.id,
        ujian_id: hasil.ujian_id,
        ujian_judul: hasil.ujian_judul,
        durasi: hasil.durasi,
        nilai: showResult ? Math.round(hasil.nilai * 100) / 100 : null,
        jumlah_benar: showResult ? hasil.jumlah_benar : 0,
        jumlah_salah: showResult ? hasil.jumlah_salah : 0,
        total_soal: showResult ? totalSoalResult.count : 0,
        waktu_mulai: showResult ? hasil.waktu_mulai : null,
        waktu_selesai: showResult ? hasil.waktu_selesai : null,
        show_result: showResult,
        is_submitted: hasil.is_submitted === 1
      }
    });

  } catch (error) {
    console.error('Get hasil detail error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}