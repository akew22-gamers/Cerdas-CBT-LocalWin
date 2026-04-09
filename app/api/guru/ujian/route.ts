import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { NextResponse } from 'next/server'

export async function GET(_request: Request) {
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

    const ujianList = db.prepare(`
      SELECT 
        u.id,
        u.kode_ujian,
        u.judul,
        u.durasi,
        u.jumlah_opsi,
        u.status,
        u.show_result,
        u.created_at,
        (SELECT GROUP_CONCAT(DISTINCT k.nama_kelas) 
         FROM ujian_kelas uk 
         JOIN kelas k ON uk.kelas_id = k.id 
         WHERE uk.ujian_id = u.id) as kelas_names,
        (SELECT COUNT(*) FROM soal s WHERE s.ujian_id = u.id) as jumlah_soal
      FROM ujian u
      WHERE u.created_by = ?
      ORDER BY u.created_at DESC
    `).all(session.user.id) as any[]

    const formattedUjian = ujianList.map((u: any) => ({
      id: u.id,
      kode_ujian: u.kode_ujian,
      judul: u.judul,
      durasi: u.durasi,
      jumlah_opsi: u.jumlah_opsi,
      status: u.status,
      show_result: !!u.show_result,
      created_at: u.created_at,
      kelas: u.kelas_names 
        ? u.kelas_names.split(',').map((nama_kelas: string) => ({
            id: `kelas-${Math.random().toString(36).substring(2, 9)}`,
            nama_kelas: nama_kelas.trim()
          }))
        : [],
      jumlah_soal: u.jumlah_soal || 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        ujian: formattedUjian
      }
    })

  } catch (error) {
    console.error('Get ujian error:', error)
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
    const body = await request.json()

    if (!body.judul || typeof body.judul !== 'string' || !body.judul.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Judul ujian harus diisi' } },
        { status: 400 }
      )
    }

    if (!body.durasi || typeof body.durasi !== 'number' || body.durasi < 1) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Durasi ujian harus minimal 1 menit' } },
        { status: 400 }
      )
    }

    if (!body.jumlah_opsi || (body.jumlah_opsi !== 4 && body.jumlah_opsi !== 5)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Jumlah opsi harus 4 atau 5' } },
        { status: 400 }
      )
    }

    const { judul, durasi, jumlah_opsi, show_result = true, kelas_ids = [] } = body

    const timestamp = Date.now().toString().slice(-6)
    const randomCode = Math.random().toString(36).substring(2, 5).toUpperCase()
    const kode_ujian = `UJIAN-${timestamp}-${randomCode}`

    const { v4: uuidv4 } = await import('uuid')
    const id = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    db.prepare(`
      INSERT INTO ujian (id, kode_ujian, judul, durasi, jumlah_opsi, status, show_result, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'nonaktif', ?, ?, ?, ?)
    `).run(
      id,
      kode_ujian,
      judul.trim(),
      durasi,
      jumlah_opsi,
      show_result ? 1 : 0,
      session.user.id,
      now,
      now
    )

    if (kelas_ids && kelas_ids.length > 0) {
      const insertUjianKelas = db.prepare(`
        INSERT INTO ujian_kelas (id, ujian_id, kelas_id, created_at)
        VALUES (?, ?, ?, ?)
      `)

      const transaction = db.transaction((ids: string[]) => {
        for (const kelasId of ids) {
          const ukId = uuidv4()
          insertUjianKelas.run(ukId, id, kelasId, now)
        }
      })

      transaction(kelas_ids)
    }

    const newUjian = db.prepare(`
      SELECT id, kode_ujian, judul, durasi, jumlah_opsi, status, show_result, created_at
      FROM ujian
      WHERE id = ?
    `).get(id) as any

    return NextResponse.json({
      success: true,
      data: {
        id: newUjian.id,
        kode_ujian: newUjian.kode_ujian,
        judul: newUjian.judul,
        durasi: newUjian.durasi,
        jumlah_opsi: newUjian.jumlah_opsi,
        status: newUjian.status,
        show_result: !!newUjian.show_result,
        created_at: newUjian.created_at
      }
    })

  } catch (error) {
    console.error('Create ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
