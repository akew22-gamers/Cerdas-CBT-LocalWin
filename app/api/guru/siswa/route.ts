import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// GET - List all siswa with optional kelas_id filter
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user (guru)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const kelas_id = searchParams.get('kelas_id')

    // Build query
    let query = supabase
      .from('siswa')
      .select(`
        *,
        kelas:kelas_id (
          id,
          nama_kelas
        )
      `)
      .eq('created_by', user.id)

    // Apply kelas filter if provided
    if (kelas_id) {
      query = query.eq('kelas_id', kelas_id)
    }

    const { data: siswa, error } = await query.order('nama', { ascending: true })

    if (error) {
      console.error('Error fetching siswa:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        siswa: siswa || []
      }
    })

  } catch (error) {
    console.error('Error in GET /api/guru/siswa:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

// POST - Create new siswa
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user (guru)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nisn, nama, password, kelas_id } = body

    // Validation
    if (!nisn || !nama || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'NISN, nama, dan password harus diisi' } },
        { status: 400 }
      )
    }

    // Check if NISN already exists
    const { data: existingSiswa } = await supabase
      .from('siswa')
      .select('id')
      .eq('nisn', nisn)
      .single()

    if (existingSiswa) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_NISN', message: 'NISN sudah terdaftar' } },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Insert siswa
    const { data: newSiswa, error } = await supabase
      .from('siswa')
      .insert({
        nisn,
        nama,
        password_hash,
        kelas_id: kelas_id || null,
        created_by: user.id
      })
      .select(`
        *,
        kelas:kelas_id (
          id,
          nama_kelas
        )
      `)
      .single()

    if (error) {
      console.error('Error creating siswa:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      role: 'guru',
      action: 'create',
      entity_type: 'siswa',
      entity_id: newSiswa.id,
      details: { nisn, nama }
    })

    return NextResponse.json({
      success: true,
      data: {
        siswa: newSiswa
      }
    })

  } catch (error) {
    console.error('Error in POST /api/guru/siswa:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
