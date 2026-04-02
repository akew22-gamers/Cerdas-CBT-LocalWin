import { NextResponse } from 'next/server'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

export async function POST() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const tablesToDelete = [
      'siswa',
      'guru',
      'pelajaran',
      'kelas',
      'kelas_siswa',
      'ujian',
      'paket_soal',
      'soal',
      'jawaban_siswa',
      'hasil_ujian',
      'audit_log',
      'sessions'
    ]

    for (const table of tablesToDelete) {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    await supabase.from('identitas_sekolah').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json<ApiSuccessResponse<{ message: string }>>({
      success: true,
      data: {
        message: 'Database berhasil di-reset'
      }
    })
  } catch (error) {
    console.error('Database reset error:', error)
    return NextResponse.json<ApiErrorResponse>({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Gagal mereset database'
      }
    }, { status: 500 })
  }
}
