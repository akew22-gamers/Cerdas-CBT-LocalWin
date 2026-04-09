import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

export async function POST() {
  try {
    const db = getDb()

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
      db.prepare(`DELETE FROM ${table}`).run()
    }

    db.prepare('DELETE FROM identitas_sekolah').run()

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
