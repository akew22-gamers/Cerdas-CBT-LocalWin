import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { getTimestamp } from '@/lib/db/utils'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
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
    const { id } = await params

    const kelasRow = db.prepare(`
      SELECT k.id, k.nama_kelas, k.created_at, k.updated_at,
        (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = k.id) as jumlah_siswa
      FROM kelas k
      WHERE k.id = ? AND k.created_by = ?
    `).get(id, guruId) as any

    if (!kelasRow) {
      return NextResponse.json(
        { success: false, error: { code: 'KELAS_NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: kelasRow.id,
        nama_kelas: kelasRow.nama_kelas,
        created_at: kelasRow.created_at,
        updated_at: kelasRow.updated_at,
        jumlah_siswa: kelasRow.jumlah_siswa || 0
      }
    })

  } catch (error) {
    console.error('Get kelas detail error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function PUT(_request: Request, { params }: RouteParams) {
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
    const { id } = await params

    const body = await _request.json()

    if (!body.nama_kelas || typeof body.nama_kelas !== 'string' || !body.nama_kelas.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama kelas harus diisi' } },
        { status: 400 }
      )
    }

    const namaKelas = body.nama_kelas.trim()

    const existingKelas = db.prepare('SELECT id FROM kelas WHERE id = ? AND created_by = ?').get(id, guruId) as { id: string } | undefined

    if (!existingKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'KELAS_NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      )
    }

    const duplicateKelas = db.prepare('SELECT id FROM kelas WHERE nama_kelas = ? AND created_by = ? AND id != ?').get(namaKelas, guruId, id) as { id: string } | undefined

    if (duplicateKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_KELAS', message: 'Kelas dengan nama ini sudah ada' } },
        { status: 400 }
      )
    }

    const now = getTimestamp()

    db.prepare(`
      UPDATE kelas
      SET nama_kelas = ?, updated_at = ?
      WHERE id = ? AND created_by = ?
    `).run(namaKelas, now, id, guruId)

    const updatedKelas = db.prepare('SELECT id, nama_kelas, updated_at FROM kelas WHERE id = ?').get(id) as { id: string; nama_kelas: string; updated_at: string }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKelas.id,
        nama_kelas: updatedKelas.nama_kelas,
        updated_at: updatedKelas.updated_at
      }
    })

  } catch (error) {
    console.error('Update kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
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
    const { id } = await params

    const kelas = db.prepare('SELECT id, nama_kelas FROM kelas WHERE id = ? AND created_by = ?').get(id, guruId) as { id: string; nama_kelas: string } | undefined

    if (!kelas) {
      return NextResponse.json(
        { success: false, error: { code: 'KELAS_NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      )
    }

    const siswaCount = db.prepare('SELECT COUNT(*) as count FROM siswa WHERE kelas_id = ?').get(id) as { count: number }

    if (siswaCount.count > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'KELAS_HAS_SISWA', message: 'Tidak dapat menghapus kelas yang masih memiliki siswa' } },
        { status: 400 }
      )
    }

    db.prepare('DELETE FROM kelas WHERE id = ? AND created_by = ?').run(id, guruId)

    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
