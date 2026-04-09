import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET() {
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

    const kelasCount = db.prepare(`
      SELECT COUNT(*) as count FROM kelas WHERE created_by = ?
    `).get(session.user.id) as any

    const siswaCount = db.prepare(`
      SELECT COUNT(*) as count FROM siswa WHERE created_by = ?
    `).get(session.user.id) as any

    const ujianData = db.prepare(`
      SELECT id, status FROM ujian WHERE created_by = ?
    `).all(session.user.id) as any[]

    const ujianAktif = ujianData.filter((u: any) => u.status === 'aktif').length

    const recentHasil = db.prepare(`
      SELECT 
        h.id,
        h.nilai,
        h.waktu_selesai,
        s.nama as siswa_nama,
        s.nisn as siswa_nisn,
        u.judul as ujian_judul
      FROM hasil_ujian h
      JOIN siswa s ON h.siswa_id = s.id
      JOIN ujian u ON h.ujian_id = u.id
      WHERE h.is_submitted = 1
      ORDER BY h.waktu_selesai DESC
      LIMIT 5
    `).all() as any[]

    const formattedRecentHasil = recentHasil.map((h: any) => ({
      id: h.id,
      siswa_nama: h.siswa_nama || '-',
      siswa_nisn: h.siswa_nisn || '-',
      ujian_judul: h.ujian_judul || '-',
      nilai: h.nilai,
      submitted_at: h.waktu_selesai
    }))

    return NextResponse.json({
      success: true,
      data: {
        kelas_count: kelasCount?.count || 0,
        siswa_count: siswaCount?.count || 0,
        ujian_count: ujianData.length,
        ujian_aktif: ujianAktif,
        recent_hasil: formattedRecentHasil
      }
    })

  } catch (error: any) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
