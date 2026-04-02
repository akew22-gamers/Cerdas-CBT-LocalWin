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

    const { id: ujianId } = await params

    const { data: hasil, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select(`
        id,
        nilai,
        jumlah_benar,
        jumlah_salah,
        is_submitted,
        waktu_mulai,
waktu_selesai,
        tab_switch_count,
        fullscreen_exit_count,
        ujian:ujian!inner(id, judul, show_result, durasi)
      `)
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)
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

    const showResult = (ujian as any).show_result ?? false

    return NextResponse.json({
      success: true,
      data: {
        id: hasil.id,
        nilai: showResult ? Math.round(hasil.nilai * 100) / 100 : null,
        jumlah_benar: hasil.jumlah_benar,
        jumlah_salah: hasil.jumlah_salah,
        is_submitted: hasil.is_submitted,
        waktu_mulai: hasil.waktu_mulai,
        waktu_selesai: hasil.waktu_selesai,
        tab_switch_count: hasil.tab_switch_count,
        fullscreen_exit_count: hasil.fullscreen_exit_count,
        show_result: showResult,
        ujian: {
          id: (ujian as any).id,
          judul: (ujian as any).judul,
          durasi: (ujian as any).durasi
        }
      }
    })

  } catch (error) {
    console.error('Get hasil error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
