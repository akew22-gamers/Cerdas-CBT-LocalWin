import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/guru/soal/[id] - Get single soal
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Get soal with ujian info
    const { data: soal, error } = await supabase
      .from('soal')
      .select(`
        *,
        ujian:ujian_id (
          id,
          judul,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (error || !soal) {
      console.error('Error fetching soal:', error)
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Soal tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Verify user owns this ujian
    if (soal.ujian.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses ke soal ini' } },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        soal: {
          ...soal,
          ujian_status: soal.ujian.status
        }
      }
    })

  } catch (error) {
    console.error('Get soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

// PUT /api/guru/soal/[id] - Update soal
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan } = body

    // Validation
    if (!teks_soal || !jawaban_benar || !pengecoh_1 || !pengecoh_2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'teks_soal, jawaban_benar, pengecoh_1, dan pengecoh_2 harus diisi' } },
        { status: 400 }
      )
    }

    // Get soal with ujian info
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

    if (fetchError || !soal) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Soal tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Verify user owns this ujian
    if (soal.ujian.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses ke soal ini' } },
        { status: 403 }
      )
    }

    // Check if ujian is active
    if (soal.ujian.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Soal tidak dapat diubah karena ujian sedang aktif' } },
        { status: 400 }
      )
    }

    // Update soal
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
      console.error('Error updating soal:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
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

// DELETE /api/guru/soal/[id] - Delete soal
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Get soal with ujian info
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

    if (fetchError || !soal) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Soal tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Verify user owns this ujian
    if (soal.ujian.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses ke soal ini' } },
        { status: 403 }
      )
    }

    // Check if ujian is active
    if (soal.ujian.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Soal tidak dapat dihapus karena ujian sedang aktif' } },
        { status: 400 }
      )
    }

    // Delete soal
    const { error } = await supabase
      .from('soal')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting soal:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
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
