import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/siswa/dashboard - Dashboard stats and ujian data for siswa
export async function GET() {
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

    // Get siswa data
    const { data: siswa, error: siswaError } = await supabase
      .from('siswa')
      .select('id, nama, nisn, kelas_id')
      .eq('id', session.user.id)
      .single()

    if (siswaError || !siswa) {
      return NextResponse.json(
        { success: false, error: { code: 'SISWA_NOT_FOUND', message: 'Data siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get total ujian selesai and sum of nilai
    const { data: hasilData, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select('nilai')
      .eq('siswa_id', session.user.id)
      .eq('is_submitted', true)

    if (hasilError) throw hasilError

    const totalUjianSelesai = hasilData?.length || 0
    const rataRataNilai = totalUjianSelesai > 0
      ? Math.round(hasilData.reduce((sum, h) => sum + Number(h.nilai), 0) / totalUjianSelesai)
      : 0

    // Get available ujian (not yet submitted by this siswa)
    // Filter by siswa's kelas and status aktif
    const { data: availableUjian, error: ujianError } = await supabase
      .from('ujian')
      .select(`
        id,
        kode_ujian,
        judul,
        durasi,
        show_result,
        ujian_kelas!inner(
          kelas_id
        )
      `)
      .eq('ujian_kelas.kelas_id', siswa.kelas_id)
      .eq('status', 'aktif')
      .not('id', 'in', `(
        select ujian_id from hasil_ujian where siswa_id = '${session.user.id}'
      )`)

    if (ujianError) {
      console.error('Error fetching available ujian:', ujianError)
    }

    // Format available ujian
    const formattedAvailableUjian = (availableUjian || []).map((u: any) => ({
      id: u.id,
      kode_ujian: u.kode_ujian,
      judul: u.judul,
      durasi: u.durasi,
      show_result: u.show_result
    }))

    // Get recent hasil (last 5 completed ujian)
    const { data: recentHasil, error: recentError } = await supabase
      .from('hasil_ujian')
      .select(`
        id,
        nilai,
        waktu_selesai,
        is_submitted,
        ujian:ujian_id (
          id,
          judul,
          show_result
        )
      `)
      .eq('siswa_id', session.user.id)
      .eq('is_submitted', true)
      .order('waktu_selesai', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Error fetching recent hasil:', recentError)
    }

    // Format recent hasil
    const formattedRecentHasil = (recentHasil || []).map((h: any) => ({
      id: h.id,
      ujian_id: h.ujian?.id,
      ujian_judul: h.ujian?.judul || '-',
      show_result: h.ujian?.show_result ?? false,
      nilai: h.nilai,
      completed_at: h.waktu_selesai,
      is_submitted: h.is_submitted
    }))

    return NextResponse.json({
      success: true,
      data: {
        siswa_nama: siswa.nama,
        total_ujian_selesai: totalUjianSelesai,
        rata_rata_nilai: rataRataNilai,
        available_ujian: formattedAvailableUjian,
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
