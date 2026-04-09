import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const siswa = db.prepare('SELECT id, nama, nisn, kelas_id FROM siswa WHERE id = ?').get(session.user.id) as {
      id: string;
      nama: string;
      nisn: string;
      kelas_id: string | null;
    } | undefined;

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: { code: 'SISWA_NOT_FOUND', message: 'Data siswa tidak ditemukan' } },
        { status: 404 }
      );
    }

    const hasilData = db.prepare(`
      SELECT nilai FROM hasil_ujian
      WHERE siswa_id = ? AND is_submitted = 1
    `).all(session.user.id) as Array<{ nilai: number }>;

    const totalUjianSelesai = hasilData.length;
    const rataRataNilai = totalUjianSelesai > 0
      ? Math.round(hasilData.reduce((sum, h) => sum + h.nilai, 0) / totalUjianSelesai)
      : 0;

    let availableUjian: Array<{
      id: string;
      kode_ujian: string;
      judul: string;
      durasi: number;
      show_result: number;
    }> = [];

    if (siswa.kelas_id) {
      availableUjian = db.prepare(`
        SELECT DISTINCT u.id, u.kode_ujian, u.judul, u.durasi, u.show_result
        FROM ujian u
        INNER JOIN ujian_kelas uk ON u.id = uk.ujian_id
        WHERE uk.kelas_id = ?
          AND u.status = 'aktif'
          AND u.id NOT IN (SELECT ujian_id FROM hasil_ujian WHERE siswa_id = ?)
      `).all(siswa.kelas_id, session.user.id) as Array<{
        id: string;
        kode_ujian: string;
        judul: string;
        durasi: number;
        show_result: number;
      }>;
    }

    const recentHasil = db.prepare(`
      SELECT h.id, h.nilai, h.waktu_selesai, h.is_submitted, u.id as ujian_id, u.judul as ujian_judul, u.show_result
      FROM hasil_ujian h
      JOIN ujian u ON h.ujian_id = u.id
      WHERE h.siswa_id = ? AND h.is_submitted = 1
      ORDER BY h.waktu_selesai DESC
      LIMIT 5
    `).all(session.user.id) as Array<{
      id: string;
      nilai: number;
      waktu_selesai: string;
      is_submitted: number;
      ujian_id: string;
      ujian_judul: string;
      show_result: number;
    }>;

    const formattedRecentHasil = recentHasil.map(h => ({
      id: h.id,
      ujian_id: h.ujian_id,
      ujian_judul: h.ujian_judul || '-',
      show_result: h.show_result === 1,
      nilai: h.nilai,
      completed_at: h.waktu_selesai,
      is_submitted: h.is_submitted === 1
    }));

    return NextResponse.json({
      success: true,
      data: {
        siswa_nama: siswa.nama,
        total_ujian_selesai: totalUjianSelesai,
        rata_rata_nilai: rataRataNilai,
        available_ujian: availableUjian.map(u => ({
          ...u,
          show_result: u.show_result === 1
        })),
        recent_hasil: formattedRecentHasil
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}