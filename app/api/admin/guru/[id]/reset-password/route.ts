import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Reset guru password
export async function POST(request: Request, { params }: RouteParams) {
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
    const { new_password } = body

    // Validation
    if (!new_password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Password baru harus diisi' } },
        { status: 400 }
      )
    }

    // Validate password length
    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password harus minimal 6 karakter' } },
        { status: 400 }
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

    const password_hash = await bcrypt.hash(new_password, 10)

    const { error } = await supabase
      .from('guru')
      .update({
        password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error resetting password:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      role: 'super_admin',
      action: 'reset_password',
      entity_type: 'guru',
      entity_id: id,
      details: { username: existingGuru.username, nama: existingGuru.nama }
    })

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/guru/[id]/reset-password:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
