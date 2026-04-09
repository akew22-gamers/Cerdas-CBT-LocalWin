import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
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

    const ujian = db.prepare(`
      SELECT id FROM ujian WHERE id = ? AND created_by = ?
    `).get(id, session.user.id) as any

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const assignedKelas = db.prepare(`
      SELECT uk.id, uk.kelas_id, k.id as kelas_id2, k.nama_kelas, k.created_at
      FROM ujian_kelas uk
      JOIN kelas k ON uk.kelas_id = k.id
      WHERE uk.ujian_id = ?
      ORDER BY k.nama_kelas ASC
    `).all(id) as any[]

    const kelasList = assignedKelas.map((uk: any) => ({
      id: uk.kelas_id,
      nama_kelas: uk.nama_kelas,
      created_at: uk.created_at
    }))

    return NextResponse.json({
      success: true,
      data: {
        kelas: kelasList
      }
    })

  } catch (error) {
    console.error('Get ujian kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

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

    if (!body.kelas_ids || !Array.isArray(body.kelas_ids) || body.kelas_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Pilih minimal satu kelas' } },
        { status: 400 }
      )
    }

    const ujian = db.prepare(`
      SELECT id FROM ujian WHERE id = ? AND created_by = ?
    `).get(id, session.user.id) as any

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const existingAssignments = db.prepare(`
      SELECT kelas_id FROM ujian_kelas WHERE ujian_id = ?
    `).all(id) as any[]

    const existingKelasIds = existingAssignments.map((a: any) => a.kelas_id)
    const newKelasIds = body.kelas_ids.filter((k: string) => !existingKelasIds.includes(k))

    if (newKelasIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua kelas yang dipilih sudah ditugaskan'
      })
    }

    const insertUjianKelas = db.prepare(`
      INSERT INTO ujian_kelas (id, ujian_id, kelas_id, created_at)
      VALUES (?, ?, ?, ?)
    `)

    const { v4: uuidv4 } = await import('uuid')
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    const transaction = db.transaction((ids: string[]) => {
      for (const kelasId of ids) {
        const ukId = uuidv4()
        insertUjianKelas.run(ukId, id, kelasId, now)
      }
    })

    transaction(newKelasIds)

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil ditugaskan'
    })

  } catch (error) {
    console.error('Assign kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    if (!body.kelas_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'kelas_id harus disertakan' } },
        { status: 400 }
      )
    }

    const ujian = db.prepare(`
      SELECT id FROM ujian WHERE id = ? AND created_by = ?
    `).get(id, session.user.id) as any

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    db.prepare(`
      DELETE FROM ujian_kelas WHERE ujian_id = ? AND kelas_id = ?
    `).run(id, body.kelas_id)

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil dihapus dari ujian'
    })

  } catch (error) {
    console.error('Remove kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
