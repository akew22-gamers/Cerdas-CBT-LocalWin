import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function POST(
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

    const originalUjian = db.prepare(`
      SELECT id, judul, durasi, jumlah_opsi, show_result 
      FROM ujian 
      WHERE id = ? AND created_by = ?
    `).get(id, session.user.id) as any

    if (!originalUjian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const originalSoal = db.prepare(`
      SELECT teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan
      FROM soal
      WHERE ujian_id = ?
      ORDER BY urutan ASC
    `).all(id) as any[]

    const timestamp = Date.now().toString().slice(-6)
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase()
    const kode_ujian = `UJIAN-${timestamp}-${randomCode}`

    const { v4: uuidv4 } = await import('uuid')
    const newUjianId = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    db.prepare(`
      INSERT INTO ujian (id, kode_ujian, judul, durasi, jumlah_opsi, status, show_result, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'nonaktif', ?, ?, ?, ?)
    `).run(
      newUjianId,
      kode_ujian,
      `${originalUjian.judul} (Copy)`,
      originalUjian.durasi,
      originalUjian.jumlah_opsi,
      originalUjian.show_result,
      session.user.id,
      now,
      now
    )

    let soalCount = 0
    if (originalSoal && originalSoal.length > 0) {
      const insertSoal = db.prepare(`
        INSERT INTO soal (id, ujian_id, teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const transaction = db.transaction((soalList: any[]) => {
        for (const soal of soalList) {
          const soalId = uuidv4()
          insertSoal.run(
            soalId,
            newUjianId,
            soal.teks_soal,
            soal.gambar_url,
            soal.jawaban_benar,
            soal.pengecoh_1,
            soal.pengecoh_2,
            soal.pengecoh_3 || null,
            soal.pengecoh_4 || null,
            soal.urutan,
            now,
            now
          )
        }
      })

      transaction(originalSoal)
      soalCount = originalSoal.length
    }

    const newUjian = db.prepare(`
      SELECT id, kode_ujian, judul, status FROM ujian WHERE id = ?
    `).get(newUjianId) as any

    return NextResponse.json({
      success: true,
      data: {
        id: newUjian.id,
        kode_ujian: newUjian.kode_ujian,
        judul: newUjian.judul,
        status: newUjian.status,
        soal_count: soalCount,
        kelas_assigned: false,
        message: 'Ujian berhasil diduplikasi. Silakan assign kelas yang akan mengikuti ujian ini.'
      }
    })

  } catch (error) {
    console.error('Duplicate ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
