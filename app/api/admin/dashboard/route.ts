import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
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

    const guruCount = db.prepare('SELECT COUNT(*) as count FROM guru').get() as { count: number };
    const siswaCount = db.prepare('SELECT COUNT(*) as count FROM siswa').get() as { count: number };
    const ujianCount = db.prepare('SELECT COUNT(*) as count FROM ujian').get() as { count: number };
    const ujianAktifCount = db.prepare("SELECT COUNT(*) as count FROM ujian WHERE status = 'aktif'").get() as { count: number };

    const recentGuru = db.prepare(`
      SELECT id, nama, created_at
      FROM guru
      ORDER BY created_at DESC
      LIMIT 5
    `).all() as Array<{ id: string; nama: string; created_at: string }>;

    const auditLogs = db.prepare(`
      SELECT id, role, action, entity_type, details, created_at
      FROM audit_log
      ORDER BY created_at DESC
      LIMIT 5
    `).all() as Array<{ 
      id: string; 
      role: string; 
      action: string; 
      entity_type: string | null; 
      details: string | null; 
      created_at: string 
    }>;

    const formattedAuditLogs = auditLogs.map(log => ({
      id: log.id,
      role: log.role,
      action: log.action,
      entity_type: log.entity_type,
      details: log.details ? JSON.parse(log.details) : null,
      created_at: log.created_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        total_guru: guruCount.count,
        total_siswa: siswaCount.count,
        total_ujian: ujianCount.count,
        ujian_aktif: ujianAktifCount.count,
        recent_guru: recentGuru,
        recent_audit_logs: formattedAuditLogs
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}