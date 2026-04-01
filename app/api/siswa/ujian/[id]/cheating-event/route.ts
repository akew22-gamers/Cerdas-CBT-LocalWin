import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
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

    const { event_type, details } = body

    if (!event_type || !['fullscreen_exit', 'tab_switch', 'window_blur'].includes(event_type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Event type tidak valid' } },
        { status: 400 }
      )
    }

    const { data: hasil, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select('id, is_submitted, tab_switch_count, fullscreen_exit_count')
      .eq('siswa_id', session.user.id)
      .eq('ujian_id', ujianId)
      .single()

    if (hasilError || !hasil) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Hasil ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    if (hasil.is_submitted) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SUBMITTED', message: 'Ujian sudah selesai' } },
        { status: 400 }
      )
    }

    const { error: logError } = await supabase
      .from('anti_cheating_log')
      .insert({
        hasil_ujian_id: hasil.id,
        event_type,
        event_time: new Date().toISOString(),
        details: details || {}
      })

    if (logError) {
      console.error('Error logging cheating event:', logError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mencatat event' } },
        { status: 500 }
      )
    }

    const counterField = event_type === 'fullscreen_exit' ? 'fullscreen_exit_count' : 'tab_switch_count'
    const newValue = (hasil[counterField] || 0) + 1

    await supabase
      .from('hasil_ujian')
      .update({
        [counterField]: newValue
      })
      .eq('id', hasil.id)

    return NextResponse.json({
      success: true,
      message: 'Event berhasil dicatat'
    })

  } catch (error) {
    console.error('Cheating event error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
