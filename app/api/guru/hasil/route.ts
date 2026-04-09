import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const ujian_id = searchParams.get('ujian_id')

    if (!ujian_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ujian_id diperlukan' } },
        { status: 400 }
      )
    }

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
        s.id as siswa_id,
        s.nisn as siswa_nisn,
        s.nama as siswa_nama,
        k.nama_kelas
      FROM hasil_ujian h
      JOIN siswa s ON h.siswa_id = s.id
      JOIN kelas k ON s.kelas_id = k.id
      WHERE h.ujian_id = ?
    `).all(ujian_id) as any[]

    const formattedHasil = hasil.map((h: any) => ({
      id: h.id,
      siswa: {
        id: h.siswa_id,
        nisn: h.siswa_nisn,
        nama: h.siswa_nama
      },
      kelas: h.nama_kelas || '-',
      nilai: parseFloat(h.nilai) || 0,
      jumlah_benar: h.jumlah_benar || 0,
      jumlah_salah: h.jumlah_salah || 0,
      waktu_mulai: h.waktu_mulai,
      waktu_selesai: h.waktu_selesai,
      is_submitted: !!h.is_submitted,
      tab_switch_count: h.tab_switch_count || 0,
      fullscreen_exit_count: h.fullscreen_exit_count || 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        hasil: formattedHasil
      }
    })

  } catch (error: any) {
    console.error('Error in GET /api/guru/hasil:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
