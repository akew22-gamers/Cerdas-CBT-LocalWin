import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { generateRandomSeed } from '@/lib/utils/randomize'

export async function POST(
  request: NextRequest,
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

    const { data: ujian, error: ujianError } = await supabase
      .from('ujian')
      .select('id, status, durasi, jumlah_opsi')
      .eq('id', ujianId)
      .single()

    if (ujianError || !ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    if (ujian.status !== 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_NOT_ACTIVE', message: 'Ujian belum aktif' } },
        { status: 400 }
      )
    }

    const { data: existingHasil, error: existingError } = await supabase
      .from('hasil_ujian')
      .select('id, is_submitted, seed_soal, seed_opsi')
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing hasil:', existingError)
    }

    if (existingHasil?.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Ujian sudah dikumpulkan' } },
        { status: 400 }
      )
    }

    if (existingHasil) {
      return NextResponse.json({
        success: true,
        data: {
          hasil_ujian_id: existingHasil.id,
          seed_soal: existingHasil.seed_soal,
          seed_opsi: existingHasil.seed_opsi,
          durasi: ujian.durasi
        }
      })
    }

    const seedSoal = generateRandomSeed()
    const seedOpsi = generateRandomSeed()

    const { data: hasil, error: hasilError } = await supabase
      .from('hasil_ujian')
      .insert({
        siswa_id: session.user.id,
        ujian_id: ujianId,
        nilai: 0,
        jumlah_benar: 0,
        jumlah_salah: 0,
        waktu_mulai: new Date().toISOString(),
        seed_soal: seedSoal,
        seed_opsi: seedOpsi,
        is_submitted: false,
        tab_switch_count: 0,
        fullscreen_exit_count: 0
      })
      .select('id')
      .single()

    if (hasilError) {
      console.error('Error creating hasil_ujian:', hasilError)
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_HASIL_ERROR', message: 'Gagal memulai ujian' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        hasil_ujian_id: hasil.id,
        seed_soal: seedSoal,
        seed_opsi: seedOpsi,
        durasi: ujian.durasi
      }
    })

  } catch (error: any) {
    console.error('Start exam error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
