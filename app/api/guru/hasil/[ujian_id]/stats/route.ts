import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ujian_id: string }> }
) {
  try {
    const { ujian_id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    const { data: ujianCheck } = await supabase
      .from('ujian')
      .select('id, created_by')
      .eq('id', ujian_id)
      .single()

    if (!ujianCheck || ujianCheck.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak memiliki akses ke ujian ini' } },
        { status: 403 }
      )
    }

    const { data: stats, error: statsError } = await supabase
      .from('v_statistik_soal')
      .select('*')
      .eq('ujian_id', ujian_id)
      .order('urutan', { ascending: true })

    if (statsError) {
      console.error('Error fetching stats:', statsError)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: statsError.message } },
        { status: 500 }
      )
    }

    const { data: hasilSummary } = await supabase
      .from('hasil_ujian')
      .select('nilai')
      .eq('ujian_id', ujian_id)
      .eq('is_submitted', true)

    const nilaiList = (hasilSummary || []).map((h: any) => parseFloat(h.nilai))
    const totalSiswa = nilaiList.length
    const nilaiRataRata = totalSiswa > 0
      ? nilaiList.reduce((a: number, b: number) => a + b, 0) / totalSiswa
      : 0
    const nilaiTertinggi = totalSiswa > 0 ? Math.max(...nilaiList) : 0
    const nilaiTerendah = totalSiswa > 0 ? Math.min(...nilaiList) : 0

    return NextResponse.json({
      success: true,
      data: {
        stats: stats || [],
        summary: {
          total_siswa: totalSiswa,
          nilai_rata_rata: Math.round(nilaiRataRata * 100) / 100,
          nilai_tertinggi: nilaiTertinggi,
          nilai_terendah: nilaiTerendah
        }
      }
    })

  } catch (error: any) {
    console.error('Error in GET /api/guru/hasil/[ujian_id]/stats:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
