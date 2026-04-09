import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const db = getDb();

    const sekolah = db.prepare(`
      SELECT * FROM identitas_sekolah
      ORDER BY updated_at DESC
      LIMIT 1
    `).get();

    return NextResponse.json({
      success: true,
      data: { sekolah: sekolah || null }
    });

  } catch (error) {
    console.error('Error in GET /api/guru/sekolah:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}