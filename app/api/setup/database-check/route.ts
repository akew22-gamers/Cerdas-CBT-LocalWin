import { NextResponse } from 'next/server'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'


export async function GET() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('identitas_sekolah')
      .select('id, setup_wizard_completed, nama_sekolah')
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json<ApiSuccessResponse<{ state: 'empty'; message: string }>>({
          success: true,
          data: {
            state: 'empty',
            message: 'Tabel belum dibuat'
          }
        })
      }

      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Gagal memeriksa status database'
        }
      }, { status: 500 })
    }

    if (data && data.length > 0) {
      const hasData = data.some(row => row.setup_wizard_completed || row.nama_sekolah)
      
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
