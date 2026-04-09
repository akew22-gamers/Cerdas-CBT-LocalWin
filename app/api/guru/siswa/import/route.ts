import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getDb } from '@/lib/db/client'
import { generateId, getTimestamp } from '@/lib/db/utils'
import { hashPassword } from '@/lib/auth/password'
import * as XLSX from 'xlsx'

interface ImportRow {
  NISN: string
  Nama: string
  Password: string
  Kelas: string
}

interface ImportError {
  row: number
  message: string
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string || 'skip_existing'

    if (!file) {
      return NextResponse.json({
        success: false,
        error: { code: 'NO_FILE', message: 'File tidak ditemukan' }
      }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_FORMAT', message: 'File harus berformat .xlsx atau .xls' }
      }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<ImportRow>(worksheet)

    if (jsonData.length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'EMPTY_FILE', message: 'File kosong atau format tidak sesuai' }
      }, { status: 400 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' }
      }, { status: 401 })
    }

    if (session.user.role !== 'guru') {
      return NextResponse.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses ditolak' }
      }, { status: 403 })
    }

    const db = getDb()
    const guruId = session.user.id

    const kelasRows = db.prepare('SELECT id, nama_kelas FROM kelas').all() as { id: string; nama_kelas: string }[]
    const kelasMap = new Map(kelasRows.map((k) => [k.nama_kelas.toLowerCase(), k.id]))

    const errors: ImportError[] = []
    let imported = 0
    let updated = 0
    let skipped = 0

    const now = getTimestamp()

    const transaction = db.transaction(() => {
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        const rowNumber = i + 2

        const nisn = String(row.NISN || '').trim()
        const nama = String(row.Nama || '').trim()
        const password = String(row.Password || '').trim()
        const kelasName = String(row.Kelas || '').trim()

        if (!nisn || !nama || !password) {
          errors.push({ row: rowNumber, message: 'NISN, Nama, dan Password wajib diisi' })
          skipped++
          continue
        }

        if (!/^\d+$/.test(nisn)) {
          errors.push({ row: rowNumber, message: 'NISN harus berupa angka' })
          skipped++
          continue
        }

        const kelasId = kelasName ? kelasMap.get(kelasName.toLowerCase()) : undefined
        if (kelasName && !kelasId) {
          errors.push({ row: rowNumber, message: `Kelas '${kelasName}' tidak ditemukan` })
          skipped++
          continue
        }

        const existingSiswa = db.prepare('SELECT id FROM siswa WHERE nisn = ?').get(nisn) as { id: string } | undefined
        const passwordHash = hashPasswordSync(password)

        if (existingSiswa) {
          if (mode === 'update_existing') {
            db.prepare(`
              UPDATE siswa
              SET nama = ?, password_hash = ?, kelas_id = ?, updated_at = ?
              WHERE id = ?
            `).run(nama, passwordHash, kelasId || null, now, existingSiswa.id)
            updated++
          } else {
            skipped++
          }
        } else {
          const id = generateId()
          db.prepare(`
            INSERT INTO siswa (id, nisn, nama, password_hash, kelas_id, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(id, nisn, nama, passwordHash, kelasId || null, guruId, now, now)
          imported++
        }
      }
    })

    transaction()

    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      guruId,
      'guru',
      'import_siswa',
      'siswa',
      JSON.stringify({ total_rows: jsonData.length, imported, updated, skipped, error_count: errors.length }),
      now
    )

    return NextResponse.json({
      success: true,
      data: {
        imported,
        updated,
        skipped,
        errors: errors.slice(0, 10)
      }
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({
      success: false,
      error: { code: 'IMPORT_ERROR', message: 'Terjadi kesalahan saat import' }
    }, { status: 500 })
  }
}

function hashPasswordSync(password: string): string {
  const bcrypt = require('bcryptjs')
  return bcrypt.hashSync(password, 10)
}
