import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Refresh session using Supabase Auth
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'REFRESH_FAILED', message: 'Gagal memperbarui session' } },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        token: data.session?.access_token,
        expires_at: data.session?.expires_at,
        refreshed_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}