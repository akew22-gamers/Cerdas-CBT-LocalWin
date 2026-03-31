import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// GET - List all guru with pagination
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user (super_admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('guru')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`username.ilike.%${search}%,nama.ilike.%${search}%`)
    }

    const { data: guruList, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching guru:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Get total count
    const { count } = await supabase
      .from('guru')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      data: {
        guru: guruList || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/guru:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

// POST - Create new guru
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user (super_admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { username, nama, password } = body

    // Validation
    if (!username || !nama || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Username, nama, dan password harus diisi' } },
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password harus minimal 6 karakter' } },
        { status: 400 }
      )
    }

    // Check if username already exists
    const { data: existingGuru } = await supabase
      .from('guru')
      .select('id')
      .eq('username', username)
      .single()

    if (existingGuru) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_USERNAME', message: 'Username sudah terdaftar' } },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Insert guru
    const { data: newGuru, error } = await supabase
      .from('guru')
      .insert({
        username,
        nama,
        password_hash,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating guru:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      role: 'super_admin',
      action: 'create',
      entity_type: 'guru',
      entity_id: newGuru.id,
      details: { username, nama }
    })

    return NextResponse.json({
      success: true,
      data: {
        guru: newGuru
      }
    })

  } catch (error) {
    console.error('Error in POST /api/admin/guru:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
