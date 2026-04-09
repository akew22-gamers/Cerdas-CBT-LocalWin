import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
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
    const { soal_id, jawaban_pilihan, urutan_soal, urutan_opsi } = body;

    if (!soal_id || !jawaban_pilihan) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Data tidak lengkap' } },
        { status: 400 }
      );
    }

    const hasil = db.prepare(`
      SELECT is_submitted FROM hasil_ujian
      WHERE siswa_id = ? AND ujian_id = ?
    `).get(session.user.id, ujianId) as { is_submitted: boolean } | undefined;

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

    const soal = db.prepare(`
      SELECT jawaban_benar FROM soal WHERE id = ?
    `).get(soal_id) as { jawaban_benar: string } | undefined;

    if (!soal) {
      return NextResponse.json(
        { success: false, error: { code: 'SOAL_NOT_FOUND', message: 'Soal tidak ditemukan' } },
        { status: 404 }
      );
    }

    const is_correct = jawaban_pilihan === soal.jawaban_benar;
    const now = getTimestamp();

    const existingJawaban = db.prepare(`
      SELECT id FROM jawaban_siswa
      WHERE siswa_id = ? AND soal_id = ?
    `).get(session.user.id, soal_id) as { id: string } | undefined;

    if (existingJawaban) {
      db.prepare(`
        UPDATE jawaban_siswa SET
          jawaban_pilihan = ?,
          urutan_soal = ?,
          urutan_opsi = ?,
          is_correct = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        jawaban_pilihan,
        urutan_soal || 0,
        toJsonField(urutan_opsi || []),
        is_correct,
        now,
        existingJawaban.id
      );

      return NextResponse.json({
        success: true,
        data: {
          id: existingJawaban.id,
          is_correct
        }
      });
    } else {
      const jawabanId = generateId();
      db.prepare(`
        INSERT INTO jawaban_siswa (
          id, siswa_id, ujian_id, soal_id, jawaban_pilihan,
          urutan_soal, urutan_opsi, is_correct, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        jawabanId,
        session.user.id,
        ujianId,
        soal_id,
        jawaban_pilihan,
        urutan_soal || 0,
        toJsonField(urutan_opsi || []),
        is_correct,
        now,
        now
      );

      return NextResponse.json({
        success: true,
        data: {
          id: jawabanId,
          is_correct
        }
      });
    }

  } catch (error: any) {
    console.error('Save jawaban error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
