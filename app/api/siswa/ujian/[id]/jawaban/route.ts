import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

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
    const body = await request.json()
    const { soal_id, jawaban_pilihan, urutan_soal, urutan_opsi } = body

    if (!soal_id || !jawaban_pilihan) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Data tidak lengkap' } },
        { status: 400 }
      )
    }

    const { data: hasil } = await supabase
      .from('hasil_ujian')
      .select('is_submitted')
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

    const { data: soal } = await supabase
      .from('soal')
      .select('jawaban_benar')
      .eq('id', soal_id)
      .single()

    if (!soal) {
      return NextResponse.json(
        { success: false, error: { code: 'SOAL_NOT_FOUND', message: 'Soal tidak ditemukan' } },
        { status: 404 }
      )
    }

    const is_correct = jawaban_pilihan === soal.jawaban_benar

    const { data, error } = await supabase
      .from('jawaban_siswa')
      .upsert({
        siswa_id: session.user.id,
        ujian_id: ujianId,
        soal_id,
        jawaban_pilihan,
        urutan_soal: urutan_soal || 0,
        urutan_opsi: urutan_opsi ? JSON.stringify(urutan_opsi) : '[]',
        is_correct,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'siswa_id,soal_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving jawaban:', error)
      return NextResponse.json(
        { success: false, error: { code: 'SAVE_JAWABAN_ERROR', message: 'Gagal menyimpan jawaban' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        is_correct
      }
    })

  } catch (error: any) {
    console.error('Save jawaban error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
