import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp } from '@/lib/db/utils';
import { NextResponse } from 'next/server';
import { generateRandomSeed } from '@/lib/utils/randomize';

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
      SELECT id, status, durasi, jumlah_opsi FROM ujian WHERE id = ?
    `).get(ujianId) as {
      id: string;
      status: string;
      durasi: number;
      jumlah_opsi: number;
    } | undefined;

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (ujian.status !== 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_ACTIVE', message: 'Ujian belum aktif' } },
        { status: 400 }
      );
    }

    const existingHasil = db.prepare(`
      SELECT id, is_submitted, seed_soal, seed_opsi FROM hasil_ujian
      WHERE siswa_id = ? AND ujian_id = ?
    `).get(session.user.id, ujianId) as {
      id: string;
      is_submitted: boolean;
      seed_soal: number;
      seed_opsi: number;
    } | undefined;

    if (existingHasil?.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Ujian sudah dikumpulkan' } },
        { status: 400 }
      );
    }

    if (existingHasil) {
      return NextResponse.json({
        success: true,
        data: {
          hasil_ujian_id: existingHasil.id,
          seed_soal: existingHasil.seed_soal,
          seed_opsi: existingHasil.seed_opsi,
          durasi: ujian.durasi
        }
      });
    }

    const seedSoal = generateRandomSeed();
    const seedOpsi = generateRandomSeed();

    const hasilId = generateId();
    const now = getTimestamp();

    db.prepare(`
      INSERT INTO hasil_ujian (
        id, siswa_id, ujian_id, nilai, jumlah_benar, jumlah_salah,
        waktu_mulai, seed_soal, seed_opsi, is_submitted,
        tab_switch_count, fullscreen_exit_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      hasilId,
      session.user.id,
      ujianId,
      0,
      0,
      0,
      now,
      seedSoal,
      seedOpsi,
      false,
      0,
      0,
      now
    );

    return NextResponse.json({
      success: true,
      data: {
        hasil_ujian_id: hasilId,
        seed_soal: seedSoal,
        seed_opsi: seedOpsi,
        durasi: ujian.durasi
      }
    });

  } catch (error: any) {
    console.error('Start exam error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
