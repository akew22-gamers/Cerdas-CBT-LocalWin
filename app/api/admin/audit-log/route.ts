import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { parseJsonField } from '@/lib/db/utils';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } },
        { status: 403 }
      );
    }

    const db = getDb();

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const role = searchParams.get('role');
    const action = searchParams.get('action');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (user_id) {
      conditions.push('user_id = ?');
      params.push(user_id);
    }

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }

    if (date_from) {
      conditions.push('created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('created_at <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.join(' AND ');

    const countParams = [...params];
    const countResult = db.prepare(`
      SELECT COUNT(*) as count FROM audit_log WHERE ${whereClause}
    `).get(...countParams) as { count: number };

    const logs = db.prepare(`
      SELECT * FROM audit_log
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Array<{
      id: string;
      user_id: string;
      role: string;
      action: string;
      entity_type: string | null;
      entity_id: string | null;
      details: string | null;
      ip_address: string | null;
      created_at: string;
    }>;

    const formattedLogs = logs.map(log => ({
      ...log,
      details: parseJsonField(log.details)
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total: countResult.count,
          total_pages: Math.ceil(countResult.count / limit)
        }
      }
    });

  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}