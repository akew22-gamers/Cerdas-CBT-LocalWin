import { NextResponse } from 'next/server'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

/**
 * @deprecated Setup token validation is no longer required.
 * This endpoint is kept for backward compatibility only.
 */
export async function GET() {
  try {
    // Token validation is deprecated - always return valid for backward compatibility
    return NextResponse.json<ApiSuccessResponse<{ token_valid: boolean }>>({
      success: true,
      data: { token_valid: true }
    })
  } catch (error) {
    console.error('Setup token validation error:', error)
    return NextResponse.json<ApiErrorResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate setup token'
      }
    }, { status: 500 })
  }
}
