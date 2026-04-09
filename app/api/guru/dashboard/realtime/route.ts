import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    if (session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak' } },
        { status: 403 }
      )
    }

    const db = getDb()

    const activeUjian = db.prepare(`
      SELECT id, judul, status FROM ujian 
      WHERE created_by = ? AND status = 'aktif'
    `).all(session.user.id) as any[]

    if (!activeUjian || activeUjian.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          subscriptions: [],
          sessionCounts: []
        }
      })
    }

    const ujianIds = activeUjian.map((u: any) => u.id)
    const placeholders = ujianIds.map(() => '?').join(', ')

    const hasilData = db.prepare(`
      SELECT ujian_id FROM hasil_ujian 
      WHERE ujian_id IN (${placeholders}) AND is_submitted = 0
    `).all(...ujianIds) as any[]

    const countMap: Record<string, number> = {}
    for (const hasil of hasilData) {
      countMap[hasil.ujian_id] = (countMap[hasil.ujian_id] || 0) + 1
    }

    const sessionCounts = activeUjian.map((u: any) => ({
      ujian_id: u.id,
      count: countMap[u.id] || 0
    }))

    const subscriptions = activeUjian.map((u: any) => ({
      ujian_id: u.id,
      judul: u.judul,
      status: u.status
    }))

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        sessionCounts
      }
    })

  } catch (error: any) {
    console.error('Error in GET /api/guru/dashboard/realtime:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
