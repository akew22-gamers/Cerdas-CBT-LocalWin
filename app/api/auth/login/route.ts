import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { username, password, role } = body

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Username, password, dan role harus diisi' } },
        { status: 400 }
      )
    }

    let user = null
    let tableName = ''

    switch (role) {
      case 'super_admin':
        tableName = 'super_admin'
        const { data: superAdmin } = await supabase
          .from('super_admin')
          .select('*')
          .eq('username', username)
          .single()
        user = superAdmin
        break

      case 'guru':
        tableName = 'guru'
        const { data: guru } = await supabase
          .from('guru')
          .select('*')
          .eq('username', username)
          .single()
        user = guru
        break

      case 'siswa':
        tableName = 'siswa'
        const { data: siswa } = await supabase
          .from('siswa')
          .select('*')
          .eq('nisn', username)
          .single()
        user = siswa
        break

      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ROLE', message: 'Role tidak valid' } },
          { status: 400 }
        )
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Username atau password salah' } },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Username atau password salah' } },
        { status: 401 }
      )
    }

    // Create user object for session
    const userSession = {
      id: user.id,
      username: role === 'siswa' ? user.nisn : user.username,
      nama: user.nama || 'Super Admin',
      role: role
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      role: role,
      action: 'login',
      entity_type: 'user',
      entity_id: user.id,
      details: { login_method: 'password' }
    })

    return NextResponse.json({
      success: true,
      data: {
        user: userSession
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}