import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
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

    const { data: ujian, error: ujianError } = await supabase
      .from('ujian')
      .select('id, status, show_result, durasi')
      .eq('id', ujianId)
      .single()

    if (ujianError || !ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    if (ujian.status !== 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_NOT_ACTIVE', message: 'Ujian tidak aktif' } },
        { status: 400 }
      )
    }

    const { data: existingHasil, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select('id, is_submitted')
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)
      .single()

    if (hasilError && hasilError.code !== 'PGRST116') {
      console.error('Error checking existing hasil:', hasilError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal memeriksa status submit' } },
        { status: 500 }
      )
    }

    if (existingHasil?.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Anda sudah mengumpulkan jawaban sebelumnya' } },
        { status: 400 }
      )
    }

    const { data: jawabanList, error: jawabanError } = await supabase
      .from('jawaban_siswa')
      .select('id, soal_id, jawaban_pilihan')
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)

    if (jawabanError) {
      console.error('Error fetching jawaban:', jawabanError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengambil jawaban' } },
        { status: 500 }
      )
    }

    const { data: soalList, error: soalError } = await supabase
      .from('soal')
      .select('id, jawaban_benar')
      .eq('ujian_id', ujianId)

    if (soalError) {
      console.error('Error fetching soal:', soalError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengambil soal' } },
        { status: 500 }
      )
    }

    const totalSoal = soalList?.length || 0

    let jumlahBenar = 0
    const jawabanMap = new Map(jawabanList?.map((j: any) => [j.soal_id, j]))

    for (const soal of soalList || []) {
      const jawaban = jawabanMap.get(soal.id)
      const isCorrect = jawaban?.jawaban_pilihan === soal.jawaban_benar

      if (isCorrect) {
        jumlahBenar++
      }

      if (jawaban) {
        await supabase
          .from('jawaban_siswa')
          .update({ is_correct: isCorrect })
          .eq('id', jawaban.id)
      }
    }

    const jumlahSalah = totalSoal - jumlahBenar
    const nilai = totalSoal > 0 ? (jumlahBenar / totalSoal) * 100 : 0

    const now = new Date().toISOString()

    if (existingHasil) {
      const { error: updateError } = await supabase
        .from('hasil_ujian')
        .update({
          nilai,
          jumlah_benar: jumlahBenar,
          jumlah_salah: jumlahSalah,
          is_submitted: true,
          waktu_selesai: now
        })
        .eq('id', existingHasil.id)

      if (updateError) {
        console.error('Error updating hasil:', updateError)
        return NextResponse.json(
          { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengupdate hasil ujian' } },
          { status: 500 }
        )
      }
    } else {
      const { data: pendingHasil } = await supabase
        .from('hasil_ujian')
        .select('id, seed_soal, seed_opsi, waktu_mulai')
        .eq('siswa_id', session.user.id)
        .eq('ujian_id', ujianId)
        .single()

      if (pendingHasil) {
        const { error: insertError } = await supabase
          .from('hasil_ujian')
          .update({
            nilai,
            jumlah_benar: jumlahBenar,
            jumlah_salah: jumlahSalah,
            is_submitted: true,
            waktu_selesai: now
          })
          .eq('id', pendingHasil.id)

        if (insertError) {
          console.error('Error updating hasil:', insertError)
          return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal menyimpan hasil ujian' } },
            { status: 500 }
          )
        }
      } else {
        const seedSoal = Math.floor(Math.random() * 1000000)
        const seedOpsi = Math.floor(Math.random() * 1000000)

        const { error: insertError } = await supabase
          .from('hasil_ujian')
          .insert({
            siswa_id: session.user.id,
            ujian_id: ujianId,
            nilai,
            jumlah_benar: jumlahBenar,
            jumlah_salah: jumlahSalah,
            is_submitted: true,
            waktu_mulai: now,
            waktu_selesai: now,
            seed_soal: seedSoal,
            seed_opsi: seedOpsi
          })

        if (insertError) {
          console.error('Error inserting hasil:', insertError)
          return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal menyimpan hasil ujian' } },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        nilai: Math.round(nilai * 100) / 100,
        jumlah_benar: jumlahBenar,
        jumlah_salah: jumlahSalah,
        total_soal: totalSoal,
        show_result: ujian.show_result
      }
    })

  } catch (error) {
    console.error('Submit ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
