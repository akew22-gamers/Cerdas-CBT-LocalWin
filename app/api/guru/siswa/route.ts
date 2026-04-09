import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { generateId, getTimestamp } from '@/lib/db/utils'
import { hashPassword } from '@/lib/auth/password'
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

    if (session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak' } },
        { status: 403 }
      )
    }

    const db = getDb()
    const guruId = session.user.id

    const { searchParams } = new URL(request.url)
    const kelas_id = searchParams.get('kelas_id')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereClause = 'WHERE s.created_by = ?'
    const params: any[] = [guruId]

    if (kelas_id) {
      whereClause += ' AND s.kelas_id = ?'
      params.push(kelas_id)
    }

    if (search) {
      whereClause += ' AND (s.nisn LIKE ? OR LOWER(s.nama) LIKE ?)'
      const searchTerm = `%${search.toLowerCase()}%`
      params.push(`%${search}%`, searchTerm)
    }

    const countSql = `
      SELECT COUNT(*) as count
      FROM siswa s
      ${whereClause}
    `
    const countResult = db.prepare(countSql).get(...params) as { count: number }
    const total = countResult.count

    const dataSql = `
      SELECT s.*, k.nama_kelas as kelas_nama
      FROM siswa s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      ${whereClause}
      ORDER BY s.nama ASC
      LIMIT ? OFFSET ?
    `
    const dataParams = [...params, limit, offset]
    const rows = db.prepare(dataSql).all(...dataParams) as any[]

    const siswa = rows.map((row) => ({
      ...row,
      kelas: row.kelas_nama ? {
        id: row.kelas_id,
        nama_kelas: row.kelas_nama
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        siswa: siswa || [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error in GET /api/guru/siswa:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { nisn, nama, password, kelas_id } = body

    if (!nisn || !nama || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'NISN, nama, dan password harus diisi' } },
        { status: 400 }
      )
    }

    const existingSiswa = db.prepare('SELECT id FROM siswa WHERE nisn = ?').get(nisn) as { id: string } | undefined

    if (existingSiswa) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_NISN', message: 'NISN sudah terdaftar' } },
        { status: 400 }
      )
    }

    const password_hash = await hashPassword(password)
    const id = generateId()
    const now = getTimestamp()

    db.prepare(`
      INSERT INTO siswa (id, nisn, nama, password_hash, kelas_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, nisn, nama, password_hash, kelas_id || null, guruId, now, now)

    const newSiswaRow = db.prepare(`
      SELECT s.*, k.nama_kelas as kelas_nama
      FROM siswa s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      WHERE s.id = ?
    `).get(id) as any

    const newSiswa = {
      ...newSiswaRow,
      kelas: newSiswaRow.kelas_nama ? {
        id: newSiswaRow.kelas_id,
        nama_kelas: newSiswaRow.kelas_nama
      } : null
    }

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), guruId, 'guru', 'create', 'siswa', id, JSON.stringify({ nisn, nama }), now)

    return NextResponse.json({
      success: true,
      data: {
        siswa: newSiswa
      }
    })

  } catch (error) {
    console.error('Error in POST /api/guru/siswa:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
