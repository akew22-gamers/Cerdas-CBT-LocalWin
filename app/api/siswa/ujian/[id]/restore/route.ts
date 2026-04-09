import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { generateId, getTimestamp, toJsonField } from '@/lib/db/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _request: NextRequest,
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
      SELECT id, ujian_id, siswa_id, waktu_mulai, is_submitted, jumlah_benar, jumlah_salah
      FROM hasil_ujian
      WHERE siswa_id = ? AND ujian_id = ?
    `).get(session.user.id, ujianId) as {
      id: string;
      ujian_id: string;
      siswa_id: string;
      waktu_mulai: string;
      is_submitted: boolean;
      jumlah_benar: number;
      jumlah_salah: number;
    } | undefined;

    if (!hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_NOT_FOUND', message: 'Data ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (hasil.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_SUBMITTED', message: 'Ujian sudah dikumpulkan' } },
        { status: 400 }
      );
    }

    const ujian = db.prepare(`
      SELECT id, durasi, status FROM ujian WHERE id = ?
    `).get(ujianId) as {
      id: string;
      durasi: number;
      status: string;
    } | undefined;

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (ujian.status !== 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_ACTIVE', message: 'Ujian tidak aktif' } },
        { status: 400 }
      );
    }

    const jawabanData = db.prepare(`
      SELECT soal_id, jawaban_pilihan, updated_at FROM jawaban_siswa
      WHERE siswa_id = ? AND ujian_id = ?
    `).all(session.user.id, ujianId) as Array<{
      soal_id: string;
      jawaban_pilihan: string;
      updated_at: string;
    }>;

    const answers: Record<string, string> = {};
    jawabanData?.forEach((j) => {
      answers[j.soal_id] = j.jawaban_pilihan;
    });

    const now = new Date();
    const waktuMulai = new Date(hasil.waktu_mulai);
    const waktuSelesai = new Date(waktuMulai.getTime() + ujian.durasi * 60 * 1000);
    const timeRemaining = Math.max(0, Math.floor((waktuSelesai.getTime() - now.getTime()) / 1000));

    if (timeRemaining <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXAM_EXPIRED',
            message: 'Waktu ujian telah habis'
          }
        },
        { status: 400 }
      );
    }

    const auditId = generateId();
    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      session.user.id,
      'siswa',
      'exam_restored',
      'ujian',
      ujianId,
      toJsonField({
        waktu_sisa: timeRemaining,
        jumlah_jawaban: Object.keys(answers).length
      }),
      getTimestamp()
    );

    return NextResponse.json({
      success: true,
      data: {
        hasil_ujian_id: hasil.id,
        answers,
        timeRemaining,
        totalQuestions: Object.keys(answers).length,
        waktu_mulai: hasil.waktu_mulai,
        waktu_selesai: waktuSelesai.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Restore exam error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
