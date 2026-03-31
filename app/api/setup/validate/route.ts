import { NextResponse } from 'next/server'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'

export async function GET(request: Request) {
  try {
    const setupToken = request.headers.get('X-Setup-Token')
    const expectedToken = process.env.SETUP_TOKEN

    if (!setupToken || setupToken !== expectedToken) {
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'INVALID_SETUP_TOKEN',
          message: 'Token setup tidak valid'
        }
      }, { status: 401 })
    }

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
