import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const ujian_id = searchParams.get('ujian_id')

    if (!ujian_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ujian_id diperlukan' } },
        { status: 400 }
      )
    }

    const { data: hasil, error } = await supabase
      .from('hasil_ujian')
      .select(`
        id,
        nilai,
        jumlah_benar,
        jumlah_salah,
        waktu_mulai,
        waktu_selesai,
        is_submitted,
        tab_switch_count,
        fullscreen_exit_count,
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

    if (error) {
      console.error('Error fetching hasil:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    const formattedHasil = (hasil || []).map((h: any) => ({
      id: h.id,
      siswa: {
        id: h.siswa?.id || '',
        nisn: h.siswa?.nisn || '',
        nama: h.siswa?.nama || ''
      },
      kelas: h.siswa?.kelas?.nama_kelas || '-',
      nilai: parseFloat(h.nilai) || 0,
      jumlah_benar: h.jumlah_benar || 0,
      jumlah_salah: h.jumlah_salah || 0,
      waktu_mulai: h.waktu_mulai,
      waktu_selesai: h.waktu_selesai,
      is_submitted: h.is_submitted,
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