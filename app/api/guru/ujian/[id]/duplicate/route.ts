import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/guru/ujian/[id]/duplicate - Duplicate ujian with all soal
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get original ujian
    const { data: originalUjian, error: fetchError } = await supabase
      .from('ujian')
      .select('id, judul, durasi, jumlah_opsi, show_result')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (fetchError || !originalUjian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get all soal from original ujian
    const { data: originalSoal, error: soalFetchError } = await supabase
      .from('soal')
      .select('teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan')
      .eq('ujian_id', id)
      .order('urutan', { ascending: true })

    if (soalFetchError) {
      console.error('Error fetching soal:', soalFetchError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengambil soal' } },
        { status: 500 }
      )
    }

    // Create duplicated ujian (kode_ujian auto-generated)
    const { data: newUjian, error: insertError } = await supabase
      .from('ujian')
      .insert({
        judul: `${originalUjian.judul} (Copy)`,
        durasi: originalUjian.durasi,
        jumlah_opsi: originalUjian.jumlah_opsi,
        show_result: originalUjian.show_result,
        created_by: user.id
      })
      .select('id, kode_ujian, judul, status')
      .single()

    if (insertError) {
      console.error('Error creating duplicated ujian:', insertError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal menduplikasi ujian' } },
        { status: 500 }
      )
    }

    // Duplicate all soal
    let soalCount = 0
    if (originalSoal && originalSoal.length > 0) {
      const duplicatedSoal = originalSoal.map((soal: any) => ({
        ujian_id: newUjian.id,
        teks_soal: soal.teks_soal,
        gambar_url: soal.gambar_url,
        jawaban_benar: soal.jawaban_benar,
        pengecoh_1: soal.pengecoh_1,
        pengecoh_2: soal.pengecoh_2,
        pengecoh_3: soal.pengecoh_3,
        pengecoh_4: soal.pengecoh_4,
        urutan: soal.urutan
      }))

      const { error: soalInsertError } = await supabase
        .from('soal')
        .insert(duplicatedSoal)

      if (soalInsertError) {
        console.error('Error duplicating soal:', soalInsertError)
      } else {
        soalCount = duplicatedSoal.length
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUjian.id,
        kode_ujian: newUjian.kode_ujian,
        judul: newUjian.judul,
        status: newUjian.status,
        soal_count: soalCount,
        kelas_assigned: false,
        message: 'Ujian berhasil diduplikasi. Silakan assign kelas yang akan mengikuti ujian ini.'
      }
    })

  } catch (error) {
    console.error('Duplicate ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
