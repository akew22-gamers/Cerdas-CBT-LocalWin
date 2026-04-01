import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const role = searchParams.get('role')
    const action = searchParams.get('action')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase.from('audit_log').select('*', { count: 'exact' })

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    if (role) {
      query = query.eq('role', role)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const offset = (page - 1) * limit

    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
