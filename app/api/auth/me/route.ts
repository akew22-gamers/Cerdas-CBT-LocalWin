import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user from session
    // In production, this would use Supabase Auth session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Get user details based on role
    const userMetadata = user.user_metadata
    const role = userMetadata?.role

    let userData = null

    if (role === 'super_admin') {
      const { data } = await supabase
        .from('super_admin')
        .select('id, username, created_at')
        .eq('id', user.id)
        .single()
      userData = data
    } else if (role === 'guru') {
      const { data } = await supabase
        .from('guru')
        .select('id, username, nama, created_at')
        .eq('id', user.id)
        .single()
      userData = data
    } else if (role === 'siswa') {
      const { data } = await supabase
        .from('siswa')
        .select('id, nisn, nama, kelas_id, created_at')
        .eq('id', user.id)
        .single()
      userData = data
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User tidak ditemukan' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        role: role
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}