import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSession, SESSION_COOKIE_NAME, SESSION_CLAIMS_COOKIE_NAME, SESSION_DURATION_SECONDS, signClaims } from '@/lib/auth/session'

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { username, password, role } = body

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Username, password, dan role harus diisi' } },
        { status: 400 }
      )
    }

    let user = null

    if (role === 'super_admin') {
      const { data } = await supabase
        .from('super_admin')
        .select('*')
        .eq('username', username)
        .single()
      user = data
    } else if (role === 'guru') {
      const { data } = await supabase
        .from('guru')
        .select('*')
        .eq('username', username)
        .single()
      user = data
    } else if (role === 'siswa') {
      const { data } = await supabase
        .from('siswa')
        .select('*')
        .eq('nisn', username)
        .single()
      user = data
    } else {
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

    // Create session
    const session = await createSession(
      user.id,
      role,
      role === 'siswa' ? user.nisn : user.username,
      user.nama || null
    )

    // Set session token cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/'
    })

    // Set claims cookie (digunakan middleware untuk skip DB query)
    const claimsPayload = {
      role,
      uid: user.id,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
    }
    cookieStore.set(SESSION_CLAIMS_COOKIE_NAME, signClaims(claimsPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/'
    })

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
        user: session.user
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