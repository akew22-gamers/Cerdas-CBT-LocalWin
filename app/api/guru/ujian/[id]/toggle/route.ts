import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const body = await request.json()

    if (!body.status || (body.status !== 'aktif' && body.status !== 'nonaktif')) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Status harus aktif atau nonaktif' } },
        { status: 400 }
      )
    }

    const existingUjian = db.prepare(`
      SELECT status FROM ujian WHERE id = ? AND created_by = ?
    `).get(id, session.user.id) as any

    if (!existingUjian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const newStatus = body.status
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    db.prepare(`
      UPDATE ujian SET status = ?, updated_at = ? WHERE id = ?
    `).run(newStatus, now, id)

    const updatedUjian = db.prepare(`
      SELECT id, kode_ujian, judul, status FROM ujian WHERE id = ?
    `).get(id) as any

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUjian.id,
        kode_ujian: updatedUjian.kode_ujian,
        judul: updatedUjian.judul,
        status: updatedUjian.status
      }
    })

  } catch (error) {
    console.error('Toggle ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
