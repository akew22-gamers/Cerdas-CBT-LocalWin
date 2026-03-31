import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Reset siswa password
export async function POST(request: Request, { params }: RouteParams) {
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
    const { new_password } = body

    // Validation
    if (!new_password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Password baru harus diisi' } },
        { status: 400 }
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

    const password_hash = await bcrypt.hash(new_password, 10)

    const { error } = await supabase
      .from('siswa')
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
      role: 'guru',
      action: 'reset_password',
      entity_type: 'siswa',
      entity_id: id,
      details: { nisn: existingSiswa.nisn, nama: existingSiswa.nama }
    })

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset'
    })

  } catch (error) {
    console.error('Error in POST /api/guru/siswa/[id]/reset-password:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
