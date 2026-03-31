import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single guru detail
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user (super_admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { data: guru, error } = await supabase
      .from('guru')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !guru) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guru tidak ditemukan' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        guru
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/guru/[id]:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

// PUT - Update guru data
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user (super_admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nama, username } = body

    // Validation
    if (!nama) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Nama harus diisi' } },
        { status: 400 }
      )
    }

    // Check if guru exists
    const { data: existingGuru } = await supabase
      .from('guru')
      .select('id, username')
      .eq('id', id)
      .single()

    if (!existingGuru) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guru tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Check if username is being changed and if it already exists
    if (username && username !== existingGuru.username) {
      const { data: duplicateGuru } = await supabase
        .from('guru')
        .select('id')
        .eq('username', username)
        .neq('id', id)
        .single()

      if (duplicateGuru) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_USERNAME', message: 'Username sudah terdaftar' } },
          { status: 400 }
        )
      }

      // Validate username format
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_USERNAME', message: 'Username hanya boleh berisi huruf, angka, dan underscore' } },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, string> = {
      nama,
      updated_at: new Date().toISOString()
    }

    if (username) {
      updateData.username = username
    }

    const { data: updatedGuru, error } = await supabase
      .from('guru')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating guru:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      role: 'super_admin',
      action: 'update',
      entity_type: 'guru',
      entity_id: id,
      details: { username: username || existingGuru.username, nama }
    })

    return NextResponse.json({
      success: true,
      data: {
        guru: updatedGuru
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/guru/[id]:', error)
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
    
    // Get current user (super_admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if guru exists
    const { data: existingGuru } = await supabase
      .from('guru')
      .select('id, username, nama')
      .eq('id', id)
      .single()

    if (!existingGuru) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guru tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Check if guru has related data (kelas, ujian)
    const { count: kelasCount } = await supabase
      .from('kelas')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', id)

    const { count: ujianCount } = await supabase
      .from('ujian')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', id)

    const totalRelated = (kelasCount || 0) + (ujianCount || 0)

    if (totalRelated > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'HAS_RELATED_DATA', 
            message: `Guru tidak dapat dihapus karena masih memiliki ${kelasCount || 0} kelas dan ${ujianCount || 0} ujian` 
          } 
        },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('guru')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting guru:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      role: 'super_admin',
      action: 'delete',
      entity_type: 'guru',
      entity_id: id,
      details: { username: existingGuru.username, nama: existingGuru.nama }
    })

    return NextResponse.json({
      success: true,
      message: 'Guru berhasil dihapus'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/guru/[id]:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
