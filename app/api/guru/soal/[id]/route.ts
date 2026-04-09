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

    if (!session || session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: session ? 'FORBIDDEN' : 'UNAUTHORIZED', message: session ? 'Akses ditolak' : 'Tidak terautentikasi' } },
        { status: session ? 403 : 401 }
      )
    }

    const db = getDb()
    const guruId = session.user.id
    const { id } = await params

    const soal = db.prepare(`
      SELECT s.*, u.id as ujian_id, u.judul, u.status, u.created_by as ujian_created_by
      FROM soal s
      JOIN ujian u ON s.ujian_id = u.id
      WHERE s.id = ?
    `).get(id) as any

    if (!soal || soal.ujian_created_by !== guruId) {
      return NextResponse.json(
        { success: false, error: { code: !soal ? 'NOT_FOUND' : 'FORBIDDEN', message: !soal ? 'Soal tidak ditemukan' : 'Akses ditolak' } },
        { status: !soal ? 404 : 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: soal
    })
  } catch (error) {
    console.error('Get soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: session ? 'FORBIDDEN' : 'UNAUTHORIZED', message: session ? 'Akses ditolak' : 'Tidak terautentikasi' } },
        { status: session ? 403 : 401 }
      )
    }

    const db = getDb()
    const guruId = session.user.id
    const { id } = await params
    const body = await request.json()
    const { teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan } = body

    if (!teks_soal || !jawaban_benar || !pengecoh_1 || !pengecoh_2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'teks_soal, jawaban_benar, pengecoh_1, dan pengecoh_2 harus diisi' } },
        { status: 400 }
      )
    }

    const soal = db.prepare(`
      SELECT s.*, u.status, u.created_by as ujian_created_by
      FROM soal s
      JOIN ujian u ON s.ujian_id = u.id
      WHERE s.id = ?
    `).get(id) as any

    if (!soal || soal.ujian_created_by !== guruId) {
      return NextResponse.json(
        { success: false, error: { code: !soal ? 'NOT_FOUND' : 'FORBIDDEN', message: !soal ? 'Soal tidak ditemukan' : 'Akses ditolak' } },
        { status: !soal ? 404 : 403 }
      )
    }

    if (soal.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Soal tidak dapat diubah karena ujian sedang aktif' } },
        { status: 400 }
      )
    }

    const now = getTimestamp()

    db.prepare(`
      UPDATE soal
      SET teks_soal = ?, gambar_url = ?, jawaban_benar = ?, pengecoh_1 = ?, pengecoh_2 = ?, pengecoh_3 = ?, pengecoh_4 = ?, urutan = ?, updated_at = ?
      WHERE id = ?
    `).run(
      teks_soal,
      gambar_url || null,
      jawaban_benar,
      pengecoh_1,
      pengecoh_2,
      pengecoh_3 || null,
      pengecoh_4 || null,
      urutan !== undefined ? urutan : soal.urutan,
      now,
      id
    )

    const updatedSoal = db.prepare('SELECT * FROM soal WHERE id = ?').get(id) as any

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), guruId, 'update', 'soal', id, JSON.stringify({ teks_soal: teks_soal.substring(0, 50) }), now)

    return NextResponse.json({
      success: true,
      data: {
        soal: updatedSoal
      }
    })

  } catch (error) {
    console.error('Update soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== 'guru') {
      return NextResponse.json(
        { success: false, error: { code: session ? 'FORBIDDEN' : 'UNAUTHORIZED', message: session ? 'Akses ditolak' : 'Tidak terautentikasi' } },
        { status: session ? 403 : 401 }
      )
    }

    const db = getDb()
    const guruId = session.user.id
    const { id } = await params

    const soal = db.prepare(`
      SELECT s.*, u.status, u.created_by as ujian_created_by
      FROM soal s
      JOIN ujian u ON s.ujian_id = u.id
      WHERE s.id = ?
    `).get(id) as any

    if (!soal || soal.ujian_created_by !== guruId) {
      return NextResponse.json(
        { success: false, error: { code: !soal ? 'NOT_FOUND' : 'FORBIDDEN', message: !soal ? 'Soal tidak ditemukan' : 'Akses ditolak' } },
        { status: !soal ? 404 : 403 }
      )
    }

    if (soal.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Soal tidak dapat dihapus karena ujian sedang aktif' } },
        { status: 400 }
      )
    }

    db.prepare('DELETE FROM soal WHERE id = ?').run(id)

    const now = getTimestamp()
    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), guruId, 'delete', 'soal', id, JSON.stringify({ ujian_id: soal.ujian_id }), now)

    return NextResponse.json({
      success: true,
      message: 'Soal berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
