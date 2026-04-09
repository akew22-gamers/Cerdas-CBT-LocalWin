import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
    const body = await request.json();

    if (!body.kode_ujian || typeof body.kode_ujian !== 'string' || !body.kode_ujian.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Kode ujian harus diisi' } },
        { status: 400 }
      );
    }

    const kodeUjian = body.kode_ujian.trim().toUpperCase();

    const siswa = db.prepare(`
      SELECT id, kelas_id FROM siswa WHERE id = ?
    `).get(session.user.id) as { id: string; kelas_id: string | null } | undefined;

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: { code: 'SISWA_NOT_FOUND', message: 'Data siswa tidak ditemukan' } },
        { status: 404 }
      );
    }

    const ujian = db.prepare(`
      SELECT id, kode_ujian, judul, status, durasi, jumlah_opsi, show_result
      FROM ujian
      WHERE kode_ujian = ?
    `).get(kodeUjian) as {
      id: string;
      kode_ujian: string;
      judul: string;
      status: string;
      durasi: number;
      jumlah_opsi: number;
      show_result: boolean;
    } | undefined;

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_FOUND', message: 'Kode ujian tidak ditemukan' } },
        { status: 404 }
      );
    }

    if (ujian.status !== 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_ACTIVE', message: 'Ujian belum aktif' } },
        { status: 403 }
      );
    }

    const ujianKelas = db.prepare(`
      SELECT id FROM ujian_kelas
      WHERE ujian_id = ? AND kelas_id = ?
    `).get(ujian.id, siswa.kelas_id) as { id: string } | undefined;

    if (!ujianKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_ASSIGNED', message: 'Anda tidak terdaftar di ujian ini' } },
        { status: 403 }
      );
    }

    const hasilUjian = db.prepare(`
      SELECT id, is_submitted FROM hasil_ujian
      WHERE siswa_id = ? AND ujian_id = ?
    `).get(session.user.id, ujian.id) as { id: string; is_submitted: boolean } | undefined;

    if (hasilUjian && hasilUjian.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Anda sudah mengerjakan ujian ini' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ujian_id: ujian.id,
        judul: ujian.judul,
        durasi: ujian.durasi,
        jumlah_opsi: ujian.jumlah_opsi,
        show_result: ujian.show_result,
        redirect_url: `/siswa/ujian/${ujian.id}`
      }
    });

  } catch (error) {
    console.error('Join ujian error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}
