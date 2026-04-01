import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { shuffleWithSeed } from '@/lib/utils/randomize'

export async function GET(
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

    const { data: hasil } = await supabase
      .from('hasil_ujian')
      .select(`
        seed_soal,
        seed_opsi,
        is_submitted,
        ujian!inner (
          durasi
        )
      `)
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)
      .single()

    if (!hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_NOT_STARTED', message: 'Ujian belum dimulai' } },
        { status: 400 }
      )
    }

    if (hasil.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_SUBMITTED', message: 'Ujian sudah dikumpulkan' } },
        { status: 400 }
      )
    }

    const ujian = hasil.ujian as any
    const durasi = Array.isArray(ujian) ? (ujian[0]?.durasi ?? 60) : (ujian?.durasi ?? 60)

    const { data: soalData, error: soalError } = await supabase
      .from('soal')
      .select('id, teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan')
      .eq('ujian_id', ujianId)
      .order('urutan', { ascending: true })

    if (soalError) {
      console.error('Error fetching soal:', soalError)
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_SOAL_ERROR', message: 'Gagal mengambil soal' } },
        { status: 500 }
      )
    }

    const indexedSoal = soalData?.map((soal, index) => ({ ...soal, _originalIndex: index })) || []
    const shuffledSoal = shuffleWithSeed(indexedSoal, hasil.seed_soal)

    const { data: jawabanData } = await supabase
      .from('jawaban_siswa')
      .select('soal_id, jawaban_pilihan')
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)

    const jawabanMap = new Map(jawabanData?.map((j) => [j.soal_id, j.jawaban_pilihan]) || [])

    const soalList = shuffledSoal.map((soal, soalIndex) => {
      const options: { text: string; isCorrect: boolean }[] = []
      const correctAnswer = soal.jawaban_benar

      options.push({ text: correctAnswer, isCorrect: true })
      if (soal.pengecoh_1) options.push({ text: soal.pengecoh_1, isCorrect: false })
      if (soal.pengecoh_2) options.push({ text: soal.pengecoh_2, isCorrect: false })
      if (soal.pengecoh_3) options.push({ text: soal.pengecoh_3, isCorrect: false })
      if (soal.pengecoh_4) options.push({ text: soal.pengecoh_4, isCorrect: false })

      const optionSeed = hasil.seed_opsi + soalIndex
      const shuffledOptions = shuffleWithSeed(options, optionSeed)

      const labels = ['A', 'B', 'C', 'D', 'E']
      const labeledOptions = shuffledOptions.slice(0, 5).map((opt, idx) => ({
        label: labels[idx],
        text: opt.text
      }))

      return {
        id: soal.id,
        questionNumber: soalIndex + 1,
        teks_soal: soal.teks_soal,
        gambar_url: soal.gambar_url,
        options: labeledOptions,
        jawaban_siswa: jawabanMap.get(soal.id) || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        soal: soalList,
        total: soalList.length,
        durasi: durasi || 60
      }
    })

  } catch (error: any) {
    console.error('Get soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
