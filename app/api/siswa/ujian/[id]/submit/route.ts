import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { getTimestamp } from '@/lib/db/utils';
import { NextResponse } from 'next/server';

export async function POST(
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

    const ujian = db.prepare(`
      SELECT id, status, show_result, durasi FROM ujian WHERE id = ?
    `).get(ujianId) as {
      id: string;
      status: string;
      show_result: boolean;
      durasi: number;
    } | undefined;

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (ujian.status !== 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_NOT_ACTIVE', message: 'Ujian tidak aktif' } },
        { status: 400 }
      );
    }

    const existingHasil = db.prepare(`
      SELECT id, is_submitted FROM hasil_ujian
      WHERE siswa_id = ? AND ujian_id = ?
    `).get(session.user.id, ujianId) as { id: string; is_submitted: boolean } | undefined;

    if (existingHasil?.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Anda sudah mengumpulkan jawaban sebelumnya' } },
        { status: 400 }
      );
    }

    const jawabanList = db.prepare(`
      SELECT id, soal_id, jawaban_pilihan FROM jawaban_siswa
      WHERE siswa_id = ? AND ujian_id = ?
    `).all(session.user.id, ujianId) as Array<{
      id: string;
      soal_id: string;
      jawaban_pilihan: string;
    }>;

    const soalList = db.prepare(`
      SELECT id, jawaban_benar FROM soal WHERE ujian_id = ?
    `).all(ujianId) as Array<{
      id: string;
      jawaban_benar: string;
    }>;

    const totalSoal = soalList.length;
    let jumlahBenar = 0;
    const jawabanMap = new Map(jawabanList.map((j) => [j.soal_id, j]));
    const now = getTimestamp();

    let hasilNilai = 0;
    let hasilJumlahSalah = 0;

    const transaction = db.transaction(() => {
      for (const soal of soalList) {
        const jawaban = jawabanMap.get(soal.id);
        const isCorrect = jawaban?.jawaban_pilihan === soal.jawaban_benar;

        if (isCorrect) {
          jumlahBenar++;
        }

        if (jawaban) {
          db.prepare(`
            UPDATE jawaban_siswa SET is_correct = ?, updated_at = ?
            WHERE id = ?
          `).run(isCorrect, now, jawaban.id);
        }
      }

      const jumlahSalah = totalSoal - jumlahBenar;
      const nilai = totalSoal > 0 ? (jumlahBenar / totalSoal) * 100 : 0;

      hasilNilai = nilai;
      hasilJumlahSalah = jumlahSalah;

      if (existingHasil) {
        db.prepare(`
          UPDATE hasil_ujian SET
            nilai = ?,
            jumlah_benar = ?,
            jumlah_salah = ?,
            is_submitted = TRUE,
            waktu_selesai = ?
          WHERE id = ?
        `).run(nilai, jumlahBenar, jumlahSalah, now, existingHasil.id);
      } else {
        db.prepare(`
          UPDATE hasil_ujian SET
            nilai = ?,
            jumlah_benar = ?,
            jumlah_salah = ?,
            is_submitted = TRUE,
            waktu_selesai = ?
          WHERE siswa_id = ? AND ujian_id = ?
        `).run(nilai, jumlahBenar, jumlahSalah, now, session.user.id, ujianId);
      }
    });

    transaction();

    return NextResponse.json({
      success: true,
      data: {
        nilai: Math.round(hasilNilai * 100) / 100,
        jumlah_benar: jumlahBenar,
        jumlah_salah: hasilJumlahSalah,
        total_soal: totalSoal,
        show_result: ujian.show_result
      }
    });

  } catch (error) {
    console.error('Submit ujian error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
