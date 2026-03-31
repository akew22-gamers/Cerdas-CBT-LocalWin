import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ujian_id = searchParams.get('ujian_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('v_rekap_nilai')
      .select('*')
      .eq('ujian_id', ujian_id)

    const { data: hasil, error } = await query
      .order('waktu_selesai', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching hasil:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    const { count } = await supabase
      .from('v_rekap_nilai')
      .select('*', { count: 'exact', head: true })
      .eq('ujian_id', ujian_id)

    const formattedHasil = (hasil || []).map((h: any) => ({
      id: h.id,
      siswa: {
        id: h.siswa_id,
        nisn: h.nisn,
        nama: h.siswa_nama
      },
      kelas: h.nama_kelas,
      nilai: parseFloat(h.nilai),
      jumlah_benar: h.jumlah_benar,
      jumlah_salah: h.jumlah_salah,
      waktu_mulai: h.waktu_mulai,
      waktu_selesai: h.waktu_selesai,
      is_submitted: h.is_submitted,
      tab_switch_count: h.tab_switch_count,
      fullscreen_exit_count: h.fullscreen_exit_count
    }))

    return NextResponse.json({
      success: true,
      data: {
        hasil: formattedHasil,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
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
