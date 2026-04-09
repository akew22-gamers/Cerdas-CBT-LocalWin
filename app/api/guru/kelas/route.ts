import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { generateId, getTimestamp } from '@/lib/db/utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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
    const guruId = session.user.id

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereClause = 'WHERE k.created_by = ?'
    const params: any[] = [guruId]

    if (search) {
      whereClause += ' AND LOWER(k.nama_kelas) LIKE ?'
      const searchTerm = `%${search.toLowerCase()}%`
      params.push(searchTerm)
    }

    const countSql = `
      SELECT COUNT(*) as count
      FROM kelas k
      ${whereClause}
    `
    const countResult = db.prepare(countSql).get(...params) as { count: number }
    const total = countResult.count

    const dataSql = `
      SELECT k.id, k.nama_kelas, k.created_at,
        (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = k.id) as jumlah_siswa
      FROM kelas k
      ${whereClause}
      ORDER BY k.nama_kelas ASC
      LIMIT ? OFFSET ?
    `
    const dataParams = [...params, limit, offset]
    const kelasRows = db.prepare(dataSql).all(...dataParams) as any[]

    const formattedKelas = kelasRows.map((k) => ({
      id: k.id,
      nama_kelas: k.nama_kelas,
      created_at: k.created_at,
      jumlah_siswa: k.jumlah_siswa || 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        kelas: formattedKelas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get kelas error:', error)
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
    const guruId = session.user.id

    const body = await request.json()

    if (!body.nama_kelas || typeof body.nama_kelas !== 'string' || !body.nama_kelas.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama kelas harus diisi' } },
        { status: 400 }
      )
    }

    const namaKelas = body.nama_kelas.trim()

    const existingKelas = db.prepare('SELECT id FROM kelas WHERE nama_kelas = ? AND created_by = ?').get(namaKelas, guruId) as { id: string } | undefined

    if (existingKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_KELAS', message: 'Kelas dengan nama ini sudah ada' } },
        { status: 400 }
      )
    }

    const id = generateId()
    const now = getTimestamp()

    db.prepare(`
      INSERT INTO kelas (id, nama_kelas, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, namaKelas, guruId, now, now)

    const newKelas = db.prepare('SELECT id, nama_kelas, created_at FROM kelas WHERE id = ?').get(id) as { id: string; nama_kelas: string; created_at: string }

    return NextResponse.json({
      success: true,
      data: {
        id: newKelas.id,
        nama_kelas: newKelas.nama_kelas,
        created_at: newKelas.created_at
      }
    })

  } catch (error) {
    console.error('Create kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
