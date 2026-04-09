import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

export async function GET() {
  try {
    const db = getDb()
    const row = db.prepare('SELECT setup_wizard_completed FROM identitas_sekolah LIMIT 1').get() as { setup_wizard_completed: number } | undefined

    if (!row) {
      return NextResponse.json<ApiSuccessResponse<{ setup_completed: boolean }>>({
        success: true,
        data: { setup_completed: false }
      })
    }

    return NextResponse.json<ApiSuccessResponse<{ setup_completed: boolean }>>({
      success: true,
      data: { setup_completed: Boolean(row.setup_wizard_completed) }
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
