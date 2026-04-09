import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { NextResponse } from 'next/server';
import { shuffleWithSeed } from '@/lib/utils/randomize';

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
      SELECT h.seed_soal, h.seed_opsi, h.is_submitted, u.durasi, u.jumlah_opsi
      FROM hasil_ujian h
      JOIN ujian u ON h.ujian_id = u.id
      WHERE h.siswa_id = ? AND h.ujian_id = ?
    `).get(session.user.id, ujianId) as {
      seed_soal: number;
      seed_opsi: number;
      is_submitted: boolean;
      durasi: number;
      jumlah_opsi: number;
    } | undefined;

    if (!hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_NOT_STARTED', message: 'Ujian belum dimulai' } },
        { status: 400 }
      );
    }

    if (hasil.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_SUBMITTED', message: 'Ujian sudah dikumpulkan' } },
        { status: 400 }
      );
    }

    const durasi = hasil.durasi ?? 60;
    const jumlahOpsi = hasil.jumlah_opsi ?? 4;

    const soalData = db.prepare(`
      SELECT id, teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan
      FROM soal
      WHERE ujian_id = ?
      ORDER BY urutan ASC
    `).all(ujianId) as Array<{
      id: string;
      teks_soal: string;
      gambar_url: string | null;
      jawaban_benar: string;
      pengecoh_1: string;
      pengecoh_2: string;
      pengecoh_3: string | null;
      pengecoh_4: string | null;
      urutan: number;
    }>;

    const indexedSoal = soalData.map((soal, index) => ({ ...soal, _originalIndex: index }));
    const shuffledSoal = shuffleWithSeed(indexedSoal, hasil.seed_soal);

    const jawabanData = db.prepare(`
      SELECT soal_id, jawaban_pilihan FROM jawaban_siswa
      WHERE siswa_id = ? AND ujian_id = ?
    `).all(session.user.id, ujianId) as Array<{
      soal_id: string;
      jawaban_pilihan: string;
    }>;

    const jawabanMap = new Map(jawabanData.map((j) => [j.soal_id, j.jawaban_pilihan]));

    const soalList = shuffledSoal.map((soal, soalIndex) => {
      const options: { text: string; isCorrect: boolean }[] = [];
      const correctAnswer = soal.jawaban_benar;

      options.push({ text: correctAnswer, isCorrect: true });
      if (soal.pengecoh_1) options.push({ text: soal.pengecoh_1, isCorrect: false });
      if (soal.pengecoh_2) options.push({ text: soal.pengecoh_2, isCorrect: false });
      if (soal.pengecoh_3) options.push({ text: soal.pengecoh_3, isCorrect: false });
      if (soal.pengecoh_4) options.push({ text: soal.pengecoh_4, isCorrect: false });

      const optionSeed = hasil.seed_opsi + soalIndex;
      const shuffledOptions = shuffleWithSeed(options, optionSeed);

      const labels = ['A', 'B', 'C', 'D', 'E'];
      const labeledOptions = shuffledOptions.slice(0, jumlahOpsi).map((opt, idx) => ({
        label: labels[idx],
        text: opt.text
      }));

      return {
        id: soal.id,
        questionNumber: soalIndex + 1,
        teks_soal: soal.teks_soal,
        gambar_url: soal.gambar_url,
        options: labeledOptions,
        jawaban_siswa: jawabanMap.get(soal.id) || null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        soal: soalList,
        total: soalList.length,
        durasi
      }
    });

  } catch (error: any) {
    console.error('Get soal error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
