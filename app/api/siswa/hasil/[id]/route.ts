import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
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

    if (session.user.role !== 'siswa') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak' } },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    const { id: hasilId } = await params

    const { data: hasil, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select(`
        id,
        nilai,
        jumlah_benar,
        jumlah_salah,
        waktu_mulai,
        waktu_selesai,
        is_submitted,
        ujian:ujian_id (
          id,
          judul,
          show_result,
          durasi
        )
      `)
      .eq('id', hasilId)
      .eq('siswa_id', session.user.id)
      .single()

    if (hasilError || !hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Hasil ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const ujian = Array.isArray(hasil.ujian) ? hasil.ujian[0] : hasil.ujian

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DATA', message: 'Data ujian tidak valid' } },
        { status: 500 }
      )
    }

    const { count: totalSoal } = await supabase
      .from('soal')
      .select('*', { count: 'exact', head: true })
      .eq('ujian_id', (ujian as any).id)

    const showResult = (ujian as any).show_result ?? false

    return NextResponse.json({
      success: true,
      data: {
        id: hasil.id,
        ujian_id: (ujian as any).id,
        ujian_judul: (ujian as any).judul,
        durasi: (ujian as any).durasi,
        nilai: showResult ? Math.round(hasil.nilai * 100) / 100 : null,
        jumlah_benar: showResult ? hasil.jumlah_benar : 0,
        jumlah_salah: showResult ? hasil.jumlah_salah : 0,
        total_soal: showResult ? totalSoal || 0 : 0,
        waktu_mulai: showResult ? hasil.waktu_mulai : null,
        waktu_selesai: showResult ? hasil.waktu_selesai : null,
        show_result: showResult,
        is_submitted: hasil.is_submitted
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