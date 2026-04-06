import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: session ? 'FORBIDDEN' : 'UNAUTHORIZED', message: session ? 'Akses ditolak' : 'Tidak terautentikasi' } },
        { status: session ? 403 : 401 }
      )
    }

    const supabase = createAdminClient()
    const { id } = await params

    const { data: soal, error } = await supabase
      .from('soal')
      .select(`
        *,
        ujian:ujian_id (
          id,
          judul,
          status,
          created_by
        )
      `)
      .eq('id', id)
      .single()

    if (error || !soal || !soal.ujian || soal.ujian.created_by !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: error || !soal ? 'NOT_FOUND' : 'FORBIDDEN', message: error || !soal ? 'Soal tidak ditemukan' : 'Akses ditolak' } },
        { status: error || !soal ? 404 : 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: soal
    })
  } catch (error) {
    console.error('Get soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: session ? 'FORBIDDEN' : 'UNAUTHORIZED', message: session ? 'Akses ditolak' : 'Tidak terautentikasi' } },
        { status: session ? 403 : 401 }
      )
    }

    const supabase = createAdminClient()
    const { id } = await params
    const body = await request.json()
    const { teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan } = body

    if (!teks_soal || !jawaban_benar || !pengecoh_1 || !pengecoh_2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'teks_soal, jawaban_benar, pengecoh_1, dan pengecoh_2 harus diisi' } },
        { status: 400 }
      )
    }

    const { data: soal, error: fetchError } = await supabase
      .from('soal')
      .select(`
        *,
        ujian:ujian_id (
          id,
          status,
          created_by
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !soal || !soal.ujian || soal.ujian.created_by !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: fetchError || !soal ? 'NOT_FOUND' : 'FORBIDDEN', message: fetchError || !soal ? 'Soal tidak ditemukan' : 'Akses ditolak' } },
        { status: fetchError || !soal ? 404 : 403 }
      )
    }

    if (soal.ujian.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Soal tidak dapat diubah karena ujian sedang aktif' } },
        { status: 400 }
      )
    }

    const { data: updatedSoal, error } = await supabase
      .from('soal')
      .update({
        teks_soal,
        gambar_url: gambar_url || null,
        jawaban_benar,
        pengecoh_1,
        pengecoh_2,
        pengecoh_3: pengecoh_3 || null,
        pengecoh_4: pengecoh_4 || null,
        urutan: urutan !== undefined ? urutan : soal.urutan
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      role: 'guru',
      action: 'update',
      entity_type: 'soal',
      entity_id: id,
      details: { teks_soal: teks_soal.substring(0, 50) }
    })

    return NextResponse.json({
      success: true,
      data: {
        soal: updatedSoal
      }
    })

  } catch (error) {
    console.error('Update soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: session ? 'FORBIDDEN' : 'UNAUTHORIZED', message: session ? 'Akses ditolak' : 'Tidak terautentikasi' } },
        { status: session ? 403 : 401 }
      )
    }

    const supabase = createAdminClient()
    const { id } = await params

    const { data: soal, error: fetchError } = await supabase
      .from('soal')
      .select(`
        *,
        ujian:ujian_id (
          id,
          status,
          created_by
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !soal || !soal.ujian || soal.ujian.created_by !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: fetchError || !soal ? 'NOT_FOUND' : 'FORBIDDEN', message: fetchError || !soal ? 'Soal tidak ditemukan' : 'Akses ditolak' } },
        { status: fetchError || !soal ? 404 : 403 }
      )
    }

    if (soal.ujian.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Soal tidak dapat dihapus karena ujian sedang aktif' } },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('soal')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      role: 'guru',
      action: 'delete',
      entity_type: 'soal',
      entity_id: id,
      details: { ujian_id: soal.ujian_id }
    })

    return NextResponse.json({
      success: true,
      message: 'Soal berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
