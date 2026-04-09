import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { generateId, getTimestamp } from '@/lib/db/utils'
import { hashPassword } from '@/lib/auth/password'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
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
    const guruId = session.user.id
    const { id } = await params

    const body = await request.json()
    const { new_password } = body

    if (!new_password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Password baru harus diisi' } },
        { status: 400 }
      )
    }

    const existingSiswa = db.prepare('SELECT id, nisn, nama FROM siswa WHERE id = ? AND created_by = ?').get(id, guruId) as { id: string; nisn: string; nama: string } | undefined

    if (!existingSiswa) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    const password_hash = await hashPassword(new_password)
    const now = getTimestamp()

    db.prepare(`
      UPDATE siswa
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `).run(password_hash, now, id)

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), guruId, 'reset_password', 'siswa', id, JSON.stringify({ nisn: existingSiswa.nisn, nama: existingSiswa.nama }), now)

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset'
    })

  } catch (error) {
    console.error('Error in POST /api/guru/siswa/[id]/reset-password:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
