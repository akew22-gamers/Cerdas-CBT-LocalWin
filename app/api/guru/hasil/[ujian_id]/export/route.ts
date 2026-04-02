import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ujian_id: string }> }
) {
  try {
    const { ujian_id } = await params
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

    const supabase = createAdminClient()

    const { data: ujian } = await supabase
      .from('ujian')
      .select('id, judul, kode_ujian, created_by')
      .eq('id', ujian_id)
      .single()

    if (!ujian || ujian.created_by !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak memiliki akses ke ujian ini' } },
        { status: 403 }
      )
    }

    const { data: hasil } = await supabase
      .from('hasil_ujian')
      .select(`
        id,
        nilai,
        jumlah_benar,
        jumlah_salah,
        waktu_mulai,
        waktu_selesai,
        is_submitted,
        siswa:siswa_id (
          id,
          nisn,
          nama,
          kelas:kelas_id (
            nama_kelas
          )
        )
      `)
      .eq('ujian_id', ujian_id)
      .order('waktu_selesai', { ascending: false })

    const exportData = (hasil || []).map((h: any, index: number) => ({
      No: index + 1,
      NISN: h.siswa?.nisn || '',
      'Nama Siswa': h.siswa?.nama || '',
      Kelas: h.siswa?.kelas?.nama_kelas || '-',
      Nilai: parseFloat(h.nilai) || 0,
      'Jumlah Benar': h.jumlah_benar || 0,
      'Jumlah Salah': h.jumlah_salah || 0,
      'Waktu Mulai': h.waktu_mulai ? new Date(h.waktu_mulai).toLocaleString('id-ID') : '-',
      'Waktu Selesai': h.waktu_selesai ? new Date(h.waktu_selesai).toLocaleString('id-ID') : '-',
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
    console.error('Error in GET /api/guru/hasil/[ujian_id]/export:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
