import { NextResponse } from 'next/server'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

export async function POST() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('identitas_sekolah')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'DATABASE_NOT_EMPTY',
          message: 'Database sudah memiliki data, tidak perlu inisialisasi'
        }
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('identitas_sekolah')
      .insert({
        nama_sekolah: 'Sekolah Baru',
        tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        setup_wizard_completed: false
      })

    if (error) {
      console.error('Database init error:', error)
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: `Gagal menginisialisasi database: ${error.message}`
        }
      }, { status: 500 })
    }

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
