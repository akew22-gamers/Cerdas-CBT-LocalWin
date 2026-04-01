import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/utils/audit'

export async function POST(
  _request: NextRequest,
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

    const { data: hasil, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select(`
        id,
        ujian_id,
        siswa_id,
        waktu_mulai,
        is_submitted,
        jumlah_benar,
        jumlah_salah
      `)
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)
      .single()

    if (hasilError || !hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_NOT_FOUND', message: 'Data ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    if (hasil.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'EXAM_SUBMITTED', message: 'Ujian sudah dikumpulkan' } },
        { status: 400 }
      )
    }

    const { data: ujian, error: ujianError } = await supabase
      .from('ujian')
      .select('id, durasi, status')
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
        { success: false, error: { code: 'UJIAN_NOT_ACTIVE', message: 'Ujian tidak aktif' } },
        { status: 400 }
      )
    }

    const { data: jawabanData, error: jawabanError } = await supabase
      .from('jawaban_siswa')
      .select('soal_id, jawaban_pilihan, updated_at')
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)

    if (jawabanError) {
      console.error('Error fetching jawaban:', jawabanError)
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_JAWABAN_ERROR', message: 'Gagal mengambil jawaban' } },
        { status: 500 }
      )
    }

    const answers: Record<string, string> = {}
    jawabanData?.forEach((j) => {
      answers[j.soal_id] = j.jawaban_pilihan
    })

    const now = new Date()
    const waktuMulai = new Date(hasil.waktu_mulai)
    const waktuSelesai = new Date(waktuMulai.getTime() + ujian.durasi * 60 * 1000)
    const timeRemaining = Math.max(0, Math.floor((waktuSelesai.getTime() - now.getTime()) / 1000))

    if (timeRemaining <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'EXAM_EXPIRED', 
            message: 'Waktu ujian telah habis' 
          } 
        },
        { status: 400 }
      )
    }

    await logAudit({
      userId: session.user.id,
      role: 'siswa',
      action: 'exam_restored',
      entityType: 'ujian',
      entityId: ujianId,
      details: {
        waktu_sisa: timeRemaining,
        jumlah_jawaban: Object.keys(answers).length,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        hasil_ujian_id: hasil.id,
        answers,
        timeRemaining,
        totalQuestions: Object.keys(answers).length,
        waktu_mulai: hasil.waktu_mulai,
        waktu_selesai: waktuSelesai.toISOString(),
      },
    })

  } catch (error: any) {
    console.error('Restore exam error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
