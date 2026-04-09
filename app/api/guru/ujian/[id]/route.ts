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
      SELECT 
        u.id,
        u.kode_ujian,
        u.judul,
        u.durasi,
        u.jumlah_opsi,
        u.status,
        u.show_result,
        u.created_at,
        u.updated_at,
        (SELECT GROUP_CONCAT(DISTINCT k.nama_kelas) 
         FROM ujian_kelas uk 
         JOIN kelas k ON uk.kelas_id = k.id 
         WHERE uk.ujian_id = u.id) as kelas_names,
        (SELECT COUNT(*) FROM soal s WHERE s.ujian_id = u.id) as jumlah_soal
      FROM ujian u
      WHERE u.id = ? AND u.created_by = ?
    `).get(id, session.user.id) as any

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    const kelas = ujian.kelas_names 
      ? ujian.kelas_names.split(',').map((nama_kelas: string) => ({
          id: `kelas-${Math.random().toString(36).substring(2, 9)}`,
          nama_kelas: nama_kelas.trim()
        }))
      : []

    return NextResponse.json({
      success: true,
      data: {
        id: ujian.id,
        kode_ujian: ujian.kode_ujian,
        judul: ujian.judul,
        durasi: ujian.durasi,
        jumlah_opsi: ujian.jumlah_opsi,
        status: ujian.status,
        show_result: !!ujian.show_result,
        created_at: ujian.created_at,
        updated_at: ujian.updated_at,
        kelas,
        jumlah_soal: ujian.jumlah_soal || 0
      }
    })

  } catch (error) {
    console.error('Get ujian detail error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const existingUjian = db.prepare(`
      SELECT id, status FROM ujian WHERE id = ? AND created_by = ?
    `).get(id, session.user.id) as any

    if (!existingUjian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    if (existingUjian.status === 'aktif') {
      const allowedFields = ['show_result']
      const requestedFields = Object.keys(body)
      const hasDisallowedField = requestedFields.some(field => !allowedFields.includes(field))

      if (hasDisallowedField) {
        return NextResponse.json(
          { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Ujian sedang aktif. Hanya bisa mengubah pengaturan hasil ujian. Nonaktifkan ujian terlebih dahulu untuk mengubah pengaturan lainnya.' } },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    
    if (body.judul !== undefined) {
      if (typeof body.judul !== 'string' || !body.judul.trim()) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Judul ujian harus diisi' } },
          { status: 400 }
        )
      }
      updateData.judul = body.judul.trim()
    }

    if (body.durasi !== undefined) {
      if (typeof body.durasi !== 'number' || body.durasi < 1) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Durasi ujian harus minimal 1 menit' } },
          { status: 400 }
        )
      }
      updateData.durasi = body.durasi
    }

    if (body.jumlah_opsi !== undefined) {
      if (body.jumlah_opsi !== 4 && body.jumlah_opsi !== 5) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Jumlah opsi harus 4 atau 5' } },
          { status: 400 }
        )
      }
      updateData.jumlah_opsi = body.jumlah_opsi
    }

    if (body.show_result !== undefined) {
      if (typeof body.show_result !== 'boolean') {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Show result harus boolean' } },
          { status: 400 }
        )
      }
      updateData.show_result = body.show_result ? 1 : 0
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada data yang diubah'
      })
    }

    const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ')
    const updateValues = Object.values(updateData)
    
    db.prepare(`
      UPDATE ujian SET ${updateFields}, updated_at = ? WHERE id = ?
    `).run(...updateValues, now, id)

    const updatedUjian = db.prepare(`
      SELECT id, kode_ujian, judul, durasi, jumlah_opsi, status, show_result, created_at, updated_at
      FROM ujian
      WHERE id = ?
    `).get(id) as any

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUjian.id,
        kode_ujian: updatedUjian.kode_ujian,
        judul: updatedUjian.judul,
        durasi: updatedUjian.durasi,
        jumlah_opsi: updatedUjian.jumlah_opsi,
        status: updatedUjian.status,
        show_result: !!updatedUjian.show_result,
        created_at: updatedUjian.created_at,
        updated_at: updatedUjian.updated_at
      }
    })

  } catch (error) {
    console.error('Update ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
      SELECT status FROM ujian WHERE id = ? AND created_by = ?
    `).get(id, session.user.id) as any

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    if (ujian.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Tidak dapat menghapus ujian yang sedang aktif. Nonaktifkan ujian terlebih dahulu.' } },
        { status: 400 }
      )
    }

    db.prepare('DELETE FROM ujian WHERE id = ?').run(id)

    return NextResponse.json({
      success: true,
      message: 'Ujian berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete ujian error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
