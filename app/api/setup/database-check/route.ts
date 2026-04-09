import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'


export async function GET() {
  try {
    const db = getDb()
    
    const tablesExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='identitas_sekolah'").get()
    
    if (!tablesExist) {
      return NextResponse.json<ApiSuccessResponse<{ state: 'empty'; message: string }>>({
        success: true,
        data: {
          state: 'empty',
          message: 'Tabel belum dibuat'
        }
      })
    }

    const rows = db.prepare('SELECT id, setup_wizard_completed, nama_sekolah FROM identitas_sekolah LIMIT 1').all() as Array<{ setup_wizard_completed: number; nama_sekolah: string | null }>

    if (rows && rows.length > 0) {
      const hasData = rows.some(row => row.setup_wizard_completed || row.nama_sekolah)
      
      return NextResponse.json<ApiSuccessResponse<{ state: 'ready'; message: string; hasSetupData: boolean }>>({
        success: true,
        data: {
          state: 'ready',
          message: hasData ? 'Database sudah siap dengan data' : 'Database sudah siap',
          hasSetupData: hasData
        }
      })
    }

    return NextResponse.json<ApiSuccessResponse<{ state: 'has_data'; message: string }>>({
      success: true,
      data: {
        state: 'has_data',
        message: 'Tabel ada tapi kosong'
      }
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json<ApiErrorResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan saat memeriksa database'
      }
    }, { status: 500 })
  }
}
