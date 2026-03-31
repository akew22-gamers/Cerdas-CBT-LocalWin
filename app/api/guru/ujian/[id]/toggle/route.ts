import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/guru/ujian/[id]/toggle - Toggle ujian status aktif/nonaktif
export async function POST(
  request: Request,
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
    const body = await request.json()

    if (!body.status || (body.status !== 'aktif' && body.status !== 'nonaktif')) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Status harus aktif atau nonaktif' } },
        { status: 400 }
      )
    }

    // Check if ujian exists and belongs to user
    const { data: existingUjian, error: fetchError } = await supabase
      .from('ujian')
      .select('status')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (fetchError || !existingUjian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Toggle status
    const newStatus = body.status

    const { data: updatedUjian, error: updateError } = await supabase
      .from('ujian')
      .update({ status: newStatus })
      .eq('id', id)
      .select('id, kode_ujian, judul, status')
      .single()

    if (updateError) {
      console.error('Error toggling ujian status:', updateError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengubah status ujian' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUjian.id,
        kode_ujian: updatedUjian.kode_ujian,
        judul: updatedUjian.judul,
        status: updatedUjian.status
      }
    })

  } catch (error) {
    console.error('Toggle ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
