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
    const ujian_id = searchParams.get('ujian_id')

    if (!ujian_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ujian_id harus diisi' } },
        { status: 400 }
      )
    }

    const ujian = db.prepare('SELECT id, status FROM ujian WHERE id = ? AND created_by = ?').get(ujian_id, guruId) as { id: string; status: string } | undefined

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const soalList = db.prepare(`
      SELECT * FROM soal
      WHERE ujian_id = ?
      ORDER BY urutan ASC
    `).all(ujian_id) as any[]

    return NextResponse.json({
      success: true,
      data: {
        soal: soalList || [],
        ujian_status: ujian.status
      }
    })

  } catch (error) {
    console.error('Get soal error:', error)
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
    const { ujian_id, teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan } = body

    if (!ujian_id || !teks_soal || !jawaban_benar || !pengecoh_1 || !pengecoh_2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ujian_id, teks_soal, jawaban_benar, pengecoh_1, dan pengecoh_2 harus diisi' } },
        { status: 400 }
      )
    }

    const ujian = db.prepare('SELECT id, status FROM ujian WHERE id = ? AND created_by = ?').get(ujian_id, guruId) as { id: string; status: string } | undefined

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    let urutanSoal = urutan
    if (urutanSoal === undefined || urutanSoal === null) {
      const maxUrutan = db.prepare(`
        SELECT urutan FROM soal
        WHERE ujian_id = ?
        ORDER BY urutan DESC
        LIMIT 1
      `).get(ujian_id) as { urutan: number } | undefined
      urutanSoal = maxUrutan ? maxUrutan.urutan + 1 : 0
    }

    const id = generateId()
    const now = getTimestamp()

    db.prepare(`
      INSERT INTO soal (id, ujian_id, teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      ujian_id,
      teks_soal,
      gambar_url || null,
      jawaban_benar,
      pengecoh_1,
      pengecoh_2,
      pengecoh_3 || null,
      pengecoh_4 || null,
      urutanSoal,
      now,
      now
    )

    const newSoal = db.prepare('SELECT * FROM soal WHERE id = ?').get(id) as any

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(generateId(), guruId, 'create', 'soal', id, JSON.stringify({ ujian_id, teks_soal: teks_soal.substring(0, 50) }), now)

    return NextResponse.json({
      success: true,
      data: {
        soal: newSoal
      }
    })

  } catch (error) {
    console.error('Create soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
