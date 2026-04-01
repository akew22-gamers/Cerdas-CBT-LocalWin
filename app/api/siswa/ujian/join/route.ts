import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/siswa/ujian/join - Validate and join ujian by kode_ujian
export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json()

    // Validation
    if (!body.kode_ujian || typeof body.kode_ujian !== 'string' || !body.kode_ujian.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Kode ujian harus diisi' } },
        { status: 400 }
      )
    }

    const kodeUjian = body.kode_ujian.trim().toUpperCase()

    // Get siswa data
    const { data: siswa, error: siswaError } = await supabase
      .from('siswa')
      .select('id, kelas_id')
      .eq('id', session.user.id)
      .single()

    if (siswaError || !siswa) {
      console.error('Error fetching siswa data:', siswaError)
      return NextResponse.json(
        { success: false, error: { code: 'SISWA_NOT_FOUND', message: 'Data siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Step 1: Check if ujian exists and is aktif
    const { data: ujian, error: ujianError } = await supabase
      .from('ujian')
      .select('id, kode_ujian, judul, status, durasi, jumlah_opsi, show_result')
      .eq('kode_ujian', kodeUjian)
      .single()

    if (ujianError || !ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_FOUND', message: 'Kode ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Step 2: Check if ujian is aktif
    if (ujian.status !== 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_ACTIVE', message: 'Ujian belum aktif' } },
        { status: 403 }
      )
    }

    // Step 3: Check if siswa's kelas is assigned to this ujian
    const { data: ujianKelas, error: kelasError } = await supabase
      .from('ujian_kelas')
      .select('id')
      .eq('ujian_id', ujian.id)
      .eq('kelas_id', siswa.kelas_id)
      .single()

    if (kelasError || !ujianKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_ASSIGNED', message: 'Anda tidak terdaftar di ujian ini' } },
        { status: 403 }
      )
    }

    // Step 4: Check if siswa already submitted (check hasil_ujian.is_submitted)
    const { data: hasilUjian, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select('id, is_submitted')
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujian.id)
      .single()

    // If hasil_ujian exists and already submitted
    if (hasilUjian && hasilUjian.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Anda sudah mengerjakan ujian ini' } },
        { status: 403 }
      )
    }

    // All validations passed
    // Return ujian info for redirect
    return NextResponse.json({
      success: true,
      data: {
        ujian_id: ujian.id,
        judul: ujian.judul,
        durasi: ujian.durasi,
        jumlah_opsi: ujian.jumlah_opsi,
        show_result: ujian.show_result,
        redirect_url: `/siswa/ujian/${ujian.id}`
      }
    })

  } catch (error) {
    console.error('Join ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
