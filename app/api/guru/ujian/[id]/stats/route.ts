import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ujian_id } = await params
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

    const ujianCheck = db.prepare(`
      SELECT id, created_by FROM ujian WHERE id = ?
    `).get(ujian_id) as any

    if (!ujianCheck || ujianCheck.created_by !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak memiliki akses ke ujian ini' } },
        { status: 403 }
      )
    }

    const stats = db.prepare(`
      SELECT 
        s.id as soal_id,
        s.urutan,
        s.teks_soal,
        s.jawaban_benar,
        COUNT(DISTINCT js.siswa_id) as total_jawaban,
        SUM(CASE WHEN js.is_correct = 1 THEN 1 ELSE 0 END) as benar_count,
        SUM(CASE WHEN js.is_correct = 0 THEN 1 ELSE 0 END) as salah_count
      FROM soal s
      LEFT JOIN jawaban_siswa js ON s.id = js.soal_id AND js.ujian_id = ?
      WHERE s.ujian_id = ?
      GROUP BY s.id, s.urutan, s.teks_soal, s.jawaban_benar
      ORDER BY s.urutan ASC
    `).all(ujian_id, ujian_id) as any[]

    const formattedStats = stats.map((stat: any) => ({
      soal_id: stat.soal_id,
      urutan: stat.urutan,
      teks_soal: stat.teks_soal,
      jawaban_benar: stat.jawaban_benar,
      total_jawaban: stat.total_jawaban || 0,
      benar_count: stat.benar_count || 0,
      salah_count: stat.salah_count || 0
    }))

    const hasilSummary = db.prepare(`
      SELECT nilai FROM hasil_ujian 
      WHERE ujian_id = ? AND is_submitted = 1
    `).all(ujian_id) as any[]

    const nilaiList = hasilSummary.map((h: any) => parseFloat(h.nilai))
    const totalSiswa = nilaiList.length
    const nilaiRataRata = totalSiswa > 0
      ? nilaiList.reduce((a: number, b: number) => a + b, 0) / totalSiswa
      : 0
    const nilaiTertinggi = totalSiswa > 0 ? Math.max(...nilaiList) : 0
    const nilaiTerendah = totalSiswa > 0 ? Math.min(...nilaiList) : 0

    return NextResponse.json({
      success: true,
      data: {
        stats: formattedStats,
        summary: {
          total_siswa: totalSiswa,
          nilai_rata_rata: Math.round(nilaiRataRata * 100) / 100,
          nilai_tertinggi: nilaiTertinggi,
          nilai_terendah: nilaiTerendah
        }
      }
    })

  } catch (error: any) {
    console.error('Error in GET /api/guru/ujian/[id]/stats:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
