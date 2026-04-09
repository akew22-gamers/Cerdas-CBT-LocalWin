import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    if (session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak' } },
        { status: 403 }
      )
    }

    const db = getDb()
    const { id: hasilId } = await params

    const hasil = db.prepare(`
      SELECT 
        h.id,
        h.nilai,
        h.jumlah_benar,
        h.jumlah_salah,
        h.waktu_mulai,
        h.waktu_selesai,
        h.is_submitted,
        h.tab_switch_count,
        h.fullscreen_exit_count,
        h.ujian_id,
        h.siswa_id,
        s.nisn as siswa_nisn,
        s.nama as siswa_nama,
        u.judul as ujian_judul,
        u.show_result,
        u.durasi
      FROM hasil_ujian h
      JOIN siswa s ON h.siswa_id = s.id
      JOIN ujian u ON h.ujian_id = u.id
      WHERE h.id = ?
    `).get(hasilId) as any

    if (!hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Hasil ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const totalSoal = db.prepare(`
      SELECT COUNT(*) as count FROM soal WHERE ujian_id = ?
    `).get(hasil.ujian_id) as any

    return NextResponse.json({
      success: true,
      data: {
        id: hasil.id,
        siswa: {
          nisn: hasil.siswa_nisn || '-',
          nama: hasil.siswa_nama || '-'
        },
        ujian_id: hasil.ujian_id,
        ujian_judul: hasil.ujian_judul,
        durasi: hasil.durasi,
        nilai: Math.round(hasil.nilai * 100) / 100,
        jumlah_benar: hasil.jumlah_benar,
        jumlah_salah: hasil.jumlah_salah,
        total_soal: totalSoal?.count || 0,
        waktu_mulai: hasil.waktu_mulai,
        waktu_selesai: hasil.waktu_selesai,
        tab_switch_count: hasil.tab_switch_count || 0,
        fullscreen_exit_count: hasil.fullscreen_exit_count || 0,
        is_submitted: !!hasil.is_submitted
      }
    })

  } catch (error) {
    console.error('Get hasil detail error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
