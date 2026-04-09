import { getDb } from '@/lib/db/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();

    const sekolah = db.prepare(`
      SELECT nama_sekolah, logo_url
      FROM identitas_sekolah
      ORDER BY updated_at DESC
      LIMIT 1
    `).get() as { nama_sekolah: string; logo_url: string | null } | undefined;

    if (!sekolah) {
      return NextResponse.json({
        success: true,
        data: {
          nama_sekolah: 'Sekolah Default',
          logo_url: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        nama_sekolah: sekolah.nama_sekolah || 'Sekolah Default',
        logo_url: sekolah.logo_url
      }
    });

  } catch (error) {
    console.error('Get school identity error:', error);
    return NextResponse.json({
      success: true,
      data: {
        nama_sekolah: 'Sekolah Default',
        logo_url: null
      }
    });
  }
}