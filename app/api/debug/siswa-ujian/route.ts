import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';

export async function GET(request: Request) {
  const db = getDb();
  const siswaId = '268543de-0bfb-4d55-86f3-b234c43494ec';

  const results: any = {};

  const siswa = db.prepare('SELECT id, kelas_id FROM siswa WHERE id = ?').get(siswaId) as {
    id: string;
    kelas_id: string | null;
  } | undefined;

  results.step1_siswa = { data: siswa, error: siswa ? null : 'Not found' };

  if (!siswa) {
    return NextResponse.json(results);
  }

  const ujianKelas = db.prepare('SELECT ujian_id, kelas_id FROM ujian_kelas WHERE kelas_id = ?').all(siswa.kelas_id) as Array<{
    ujian_id: string;
    kelas_id: string;
  }>;

  results.step2_ujian_kelas = { data: ujianKelas, error: null };

  const ujianIds = ujianKelas.map(uk => uk.ujian_id);
  results.ujian_ids = ujianIds;

  if (ujianIds.length === 0) {
    return NextResponse.json(results);
  }

  const placeholders = ujianIds.map(() => '?').join(',');
  const ujian = db.prepare(`
    SELECT id, kode_ujian, judul, durasi, show_result, status
    FROM ujian
    WHERE id IN (${placeholders}) AND status = 'aktif'
  `).all(...ujianIds) as Array<{
    id: string;
    kode_ujian: string;
    judul: string;
    durasi: number;
    show_result: number;
    status: string;
  }>;

  results.step3_ujian = { data: ujian, error: null };

  return NextResponse.json(results);
}