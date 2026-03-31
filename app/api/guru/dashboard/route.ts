import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/guru/dashboard - Dashboard stats for guru
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Get total kelas count
    const { data: kelasData, error: kelasError } = await supabase
      .from('kelas')
      .select('id')
      .eq('created_by', user.id)

    if (kelasError) throw kelasError

    // Get total siswa count
    const { data: siswaData, error: siswaError } = await supabase
      .from('siswa')
      .select('id')
      .eq('created_by', user.id)

    if (siswaError) throw siswaError

    // Get total ujian count
    const { data: ujianData, error: ujianError } = await supabase
      .from('ujian')
      .select('id, status')
      .eq('created_by', user.id)

    if (ujianError) throw ujianError

    // Count active ujian
    const ujianAktif = ujianData.filter((u: any) => u.status === 'aktif').length

    // Get recent hasil (last 5 submitted)
    const { data: recentHasil, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select(`
        id,
        nilai,
        waktu_selesai,
        siswa:siswa_id (
          nama,
          nisn
        ),
        ujian:ujian_id (
          judul
        )
      `)
      .eq('is_submitted', true)
      .order('waktu_selesai', { ascending: false })
      .limit(5)

    if (hasilError) {
      console.error('Error fetching recent hasil:', hasilError)
    }

    // Format recent hasil
    const formattedRecentHasil = (recentHasil || []).map((h: any) => ({
      id: h.id,
      siswa_nama: h.siswa?.nama || '-',
      siswa_nisn: h.siswa?.nisn || '-',
      ujian_judul: h.ujian?.judul || '-',
      nilai: h.nilai,
      submitted_at: h.waktu_selesai
    }))

    return NextResponse.json({
      success: true,
      data: {
        kelas_count: kelasData.length,
        siswa_count: siswaData.length,
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
