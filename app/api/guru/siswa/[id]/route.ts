import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { generateId, getTimestamp } from '@/lib/db/utils'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
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

    const siswaRow = db.prepare(`
      SELECT s.*, k.nama_kelas as kelas_nama
      FROM siswa s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      WHERE s.id = ? AND s.created_by = ?
    `).get(id, guruId) as any

    if (!siswaRow) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    const siswa = {
      ...siswaRow,
      kelas: siswaRow.kelas_nama ? {
        id: siswaRow.kelas_id,
        nama_kelas: siswaRow.kelas_nama
      } : null
    }

    return NextResponse.json({
      success: true,
      data: {
        siswa
      }
    })

  } catch (error) {
    console.error('Error in GET /api/guru/siswa/[id]:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
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
    const { nama, kelas_id } = body

    if (!nama) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Nama harus diisi' } },
        { status: 400 }
      )
    }

    const existingSiswa = db.prepare('SELECT id, nisn FROM siswa WHERE id = ? AND created_by = ?').get(id, guruId) as { id: string; nisn: string } | undefined

    if (!existingSiswa) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    const now = getTimestamp()

    db.prepare(`
      UPDATE siswa
      SET nama = ?, kelas_id = ?, updated_at = ?
      WHERE id = ? AND created_by = ?
    `).run(nama, kelas_id || null, now, id, guruId)

    const updatedSiswaRow = db.prepare(`
      SELECT s.*, k.nama_kelas as kelas_nama
      FROM siswa s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      WHERE s.id = ?
    `).get(id) as any

    const updatedSiswa = {
      ...updatedSiswaRow,
      kelas: updatedSiswaRow.kelas_nama ? {
        id: updatedSiswaRow.kelas_id,
        nama_kelas: updatedSiswaRow.kelas_nama
      } : null
    }

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), guruId, 'update', 'siswa', id, JSON.stringify({ nisn: existingSiswa.nisn, nama }), now)

    return NextResponse.json({
      success: true,
      data: {
        siswa: updatedSiswa
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/guru/siswa/[id]:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    const existingSiswa = db.prepare('SELECT id, nisn, nama FROM siswa WHERE id = ? AND created_by = ?').get(id, guruId) as { id: string; nisn: string; nama: string } | undefined

    if (!existingSiswa) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Siswa tidak ditemukan' } },
        { status: 404 }
      )
    }

    db.prepare('DELETE FROM siswa WHERE id = ?').run(id)

    const now = getTimestamp()
    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), guruId, 'delete', 'siswa', id, JSON.stringify({ nisn: existingSiswa.nisn, nama: existingSiswa.nama }), now)

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil dihapus'
    })

  } catch (error) {
    console.error('Error in DELETE /api/guru/siswa/[id]:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
