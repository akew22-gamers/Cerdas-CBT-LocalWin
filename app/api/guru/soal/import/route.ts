import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { generateId, getTimestamp } from '@/lib/db/utils'
import { NextResponse } from 'next/server'
import { read, utils } from 'xlsx'

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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const ujian_id = formData.get('ujian_id') as string

    if (!file || !ujian_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File dan ujian_id harus diisi' } },
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

    if (ujian.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Tidak dapat mengimpor soal karena ujian sedang aktif' } },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = read(arrayBuffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data: any[] = utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_FILE', message: 'File Excel kosong' } },
        { status: 400 }
      )
    }

    const errors: Array<{ row: number; message: string }> = []
    const soalToInsert: any[] = []

    const maxUrutanData = db.prepare(`
      SELECT urutan FROM soal
      WHERE ujian_id = ?
      ORDER BY urutan DESC
      LIMIT 1
    `).get(ujian_id) as { urutan: number } | undefined

    let currentUrutan = maxUrutanData ? maxUrutanData.urutan + 1 : 0

    data.forEach((row: any, index: number) => {
      const rowNum = index + 1

      if (!row['Soal'] || !row['Jawaban Benar'] || !row['Pengecoh 1'] || !row['Pengecoh 2']) {
        errors.push({
          row: rowNum,
          message: 'Kolom Soal, Jawaban Benar, Pengecoh 1, dan Pengecoh 2 harus diisi'
        })
        return
      }

      soalToInsert.push({
        id: generateId(),
        ujian_id,
        teks_soal: row['Soal'],
        gambar_url: row['Gambar_URL'] || null,
        jawaban_benar: row['Jawaban Benar'],
        pengecoh_1: row['Pengecoh 1'],
        pengecoh_2: row['Pengecoh 2'],
        pengecoh_3: row['Pengecoh 3'] || null,
        pengecoh_4: row['Pengecoh 4'] || null,
        urutan: currentUrutan++
      })
    })

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Ada error pada file Excel', errors } },
        { status: 400 }
      )
    }

    const now = getTimestamp()

    const transaction = db.transaction(() => {
      const insertStmt = db.prepare(`
        INSERT INTO soal (id, ujian_id, teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      for (const soal of soalToInsert) {
        insertStmt.run(
          soal.id,
          soal.ujian_id,
          soal.teks_soal,
          soal.gambar_url,
          soal.jawaban_benar,
          soal.pengecoh_1,
          soal.pengecoh_2,
          soal.pengecoh_3,
          soal.pengecoh_4,
          soal.urutan,
          now,
          now
        )
      }
    })

    transaction()

    const insertedCount = soalToInsert.length

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      guruId,
      'guru',
      'create',
      'soal',
      JSON.stringify({ ujian_id, imported_count: insertedCount, source: 'excel_import' }),
      now
    )

    return NextResponse.json({
      success: true,
      data: {
        imported: insertedCount,
        errors: []
      }
    })

  } catch (error) {
    console.error('Import soal error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
