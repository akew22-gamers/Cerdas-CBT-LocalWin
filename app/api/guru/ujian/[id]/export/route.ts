import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ujian_id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'xlsx'

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

    const ujian = db.prepare(`
      SELECT id, judul, kode_ujian, created_by FROM ujian WHERE id = ?
    `).get(ujian_id) as any

    if (!ujian || ujian.created_by !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak memiliki akses ke ujian ini' } },
        { status: 403 }
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
      ORDER BY h.waktu_selesai DESC
    `).all(ujian_id) as any[]

    const exportData = hasil.map((h: any, index: number) => ({
      No: index + 1,
      NISN: h.siswa_nisn || '',
      'Nama Siswa': h.siswa_nama || '',
      Kelas: h.nama_kelas || '-',
      Nilai: parseFloat(h.nilai) || 0,
      'Jumlah Benar': h.jumlah_benar || 0,
      'Jumlah Salah': h.jumlah_salah || 0,
      'Waktu Mulai': h.waktu_mulai ? new Date(h.waktu_mulai).toLocaleString('id-ID') : '-',
      'Waktu Selesai': h.waktu_selesai ? new Date(h.waktu_selesai).toLocaleString('id-ID') : '-',
      'Ganti Tab': h.tab_switch_count || 0,
      'Keluar Fullscreen': h.fullscreen_exit_count || 0,
      Status: h.is_submitted ? 'Selesai' : 'Belum Selesai'
    }))

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      ws['!cols'] = [
        { wch: 5 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 18 },
        { wch: 15 }
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Hasil Ujian')

      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="hasil-${ujian.kode_ujian}.xlsx"`
        }
      })
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_FORMAT', message: 'Format tidak didukung' } },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error in GET /api/guru/ujian/[id]/export:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
