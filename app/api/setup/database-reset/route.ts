import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

export async function POST() {
  try {
    const db = getDb()

    // Tables to delete in correct order (respecting foreign keys)
    const tablesToDelete = [
      'jawaban_siswa',
      'anti_cheating_log',
      'hasil_ujian',
      'soal',
      'ujian_kelas',
      'ujian',
      'siswa',
      'kelas',
      'guru',
      'audit_log',
      'sessions'
    ]

    for (const table of tablesToDelete) {
      try {
        db.prepare(`DELETE FROM ${table}`).run()
      } catch (e) {
        // Table might not exist, continue
      }
    }

    try {
      db.prepare('DELETE FROM identitas_sekolah').run()
    } catch (e) {
      // Table might not exist
    }

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