import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single siswa detail with kelas
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user (guru)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { data: siswa, error } = await supabase
      .from('siswa')
      .select(`
        *,
        kelas:kelas_id (
          id,
          nama_kelas
        )
      `)
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (error || !siswa) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        siswa
      }
    })

  } catch (error) {
    console.error('Error in GET /api/guru/siswa/[id]:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

// PUT - Update siswa data
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user (guru)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nama, kelas_id } = body

    // Validation
    if (!nama) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Nama harus diisi' } },
        { status: 400 }
      )
    }

    // Check if siswa exists and belongs to this guru
    const { data: existingSiswa } = await supabase
      .from('siswa')
      .select('id, nisn')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!existingSiswa) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    const { data: updatedSiswa, error } = await supabase
      .from('siswa')
      .update({
        nama,
        kelas_id: kelas_id || null
      })
      .eq('id', id)
      .select(`
        *,
        kelas:kelas_id (
          id,
          nama_kelas
        )
      `)
      .single()

    if (error) {
      console.error('Error updating siswa:', error)
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
      entity_type: 'siswa',
      entity_id: id,
      details: { nisn: existingSiswa.nisn, nama }
    })

    return NextResponse.json({
      success: true,
      data: {
        siswa: updatedSiswa
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/guru/siswa/[id]:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user (guru)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if siswa exists and belongs to this guru
    const { data: existingSiswa } = await supabase
      .from('siswa')
      .select('id, nisn, nama')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!existingSiswa) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('siswa')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting siswa:', error)
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
      entity_type: 'siswa',
      entity_id: id,
      details: { nisn: existingSiswa.nisn, nama: existingSiswa.nama }
    })

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil dihapus'
    })

  } catch (error) {
    console.error('Error in DELETE /api/guru/siswa/[id]:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
