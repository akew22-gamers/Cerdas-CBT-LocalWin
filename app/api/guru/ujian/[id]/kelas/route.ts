import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/guru/ujian/[id]/kelas - List assigned kelas
export async function GET(
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

    // Check if ujian exists and belongs to user
    const { data: ujian } = await supabase
      .from('ujian')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get assigned kelas
    const { data: assignedKelas, error } = await supabase
      .from('ujian_kelas')
      .select(`
        id,
        kelas_id,
        kelas:kelas(id, nama_kelas, created_at)
      `)
      .eq('ujian_id', id)
      .order('kelas(nama_kelas)', { ascending: true })

    if (error) {
      console.error('Error fetching assigned kelas:', error)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengambil data kelas' } },
        { status: 500 }
      )
    }

    const kelasList = assignedKelas.map((uk: any) => ({
      id: uk.kelas.id,
      nama_kelas: uk.kelas.nama_kelas,
      created_at: uk.kelas.created_at
    }))

    return NextResponse.json({
      success: true,
      data: {
        kelas: kelasList
      }
    })

  } catch (error) {
    console.error('Get ujian kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

// POST /api/guru/ujian/[id]/kelas - Assign kelas to ujian
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

    if (!body.kelas_ids || !Array.isArray(body.kelas_ids) || body.kelas_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Pilih minimal satu kelas' } },
        { status: 400 }
      )
    }

    // Check if ujian exists and belongs to user
    const { data: ujian } = await supabase
      .from('ujian')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Get currently assigned kelas to avoid duplicates
    const { data: existingAssignments } = await supabase
      .from('ujian_kelas')
      .select('kelas_id')
      .eq('ujian_id', id)

    const existingKelasIds = existingAssignments?.map((a: any) => a.kelas_id) || []

    // Filter out already assigned kelas
    const newKelasIds = body.kelas_ids.filter((k: string) => !existingKelasIds.includes(k))

    if (newKelasIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua kelas yang dipilih sudah ditugaskan'
      })
    }

    // Insert new assignments
    const assignments = newKelasIds.map((kelasId: string) => ({
      ujian_id: id,
      kelas_id: kelasId
    }))

    const { error: insertError } = await supabase
      .from('ujian_kelas')
      .insert(assignments)

    if (insertError) {
      console.error('Error assigning kelas:', insertError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal menugaskan kelas' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil ditugaskan'
    })

  } catch (error) {
    console.error('Assign kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

// DELETE /api/guru/ujian/[id]/kelas - Remove kelas from ujian
export async function DELETE(
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

    if (!body.kelas_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'kelas_id harus disertakan' } },
        { status: 400 }
      )
    }

    // Check if ujian exists and belongs to user
    const { data: ujian } = await supabase
      .from('ujian')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from('ujian_kelas')
      .delete()
      .eq('ujian_id', id)
      .eq('kelas_id', body.kelas_id)

    if (deleteError) {
      console.error('Error removing kelas:', deleteError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal menghapus kelas' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil dihapus dari ujian'
    })

  } catch (error) {
    console.error('Remove kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
