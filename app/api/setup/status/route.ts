import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('identitas_sekolah')
      .select('setup_wizard_completed')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json<ApiSuccessResponse<{ setup_completed: boolean }>>({
          success: true,
          data: { setup_completed: false }
        })
      }
      
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check setup status'
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiSuccessResponse<{ setup_completed: boolean }>>({
      success: true,
      data: { setup_completed: data?.setup_wizard_completed ?? false }
    })
  } catch (error) {
    console.error('Setup status check error:', error)
    return NextResponse.json<ApiErrorResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check setup status'
      }
    }, { status: 500 })
  }
}
