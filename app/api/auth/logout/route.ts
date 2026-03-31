import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // In a real implementation with Supabase Auth, this would sign out the user
    // For now, we return a success response
    // The actual session clearing will be handled client-side

    return NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}