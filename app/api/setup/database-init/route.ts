import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'
import { generateId } from '@/lib/db/utils'

export async function POST() {
  try {
    const db = getDb()

    const existing = db.prepare('SELECT id FROM identitas_sekolah LIMIT 1').get()

    if (existing) {
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'DATABASE_NOT_EMPTY',
          message: 'Database sudah memiliki data, tidak perlu inisialisasi'
        }
      }, { status: 400 })
    }

    const id = generateId()
    const currentYear = new Date().getFullYear()
    const tahunAjaran = `${currentYear}/${currentYear + 1}`
    
    db.prepare(`
      INSERT INTO identitas_sekolah (
        id, nama_sekolah, tahun_ajaran, setup_wizard_completed
      )
      VALUES (?, ?, ?, 0)
    `).run(id, 'Sekolah Baru', tahunAjaran)

    return NextResponse.json<ApiSuccessResponse<{ message: string }>>({
      success: true,
      data: {
        message: 'Database berhasil diinisialisasi'
      }
    })
  } catch (error) {
    console.error('Database init error:', error)
    return NextResponse.json<ApiErrorResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan saat inisialisasi database'
      }
    }, { status: 500 })
  }
}
