import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
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
    const supabase = await createClient()
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' }
      }, { status: 401 })
    }

    const guruId = user.id

    const { data: kelasList } = await supabase
      .from('kelas')
      .select('id, nama_kelas')

    const kelasMap = new Map(kelasList?.map(k => [k.nama_kelas.toLowerCase(), k.id]) || [])

    const errors: ImportError[] = []
    let imported = 0
    let updated = 0
    let skipped = 0

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNumber = i +2

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

      const kelasId = kelasMap.get(kelasName.toLowerCase())
      if (kelasName && !kelasId) {
        errors.push({ row: rowNumber, message: `Kelas '${kelasName}' tidak ditemukan` })
        skipped++
        continue
      }

      const { data: existingSiswa } = await supabase
        .from('siswa')
        .select('id')
        .eq('nisn', nisn)
        .single()

      const passwordHash = await bcrypt.hash(password, 10)

      if (existingSiswa) {
        if (mode === 'update_existing') {
          const { error } = await supabase
            .from('siswa')
            .update({
              nama,
              password_hash: passwordHash,
              kelas_id: kelasId || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSiswa.id)

          if (error) {
            errors.push({ row: rowNumber, message: `Gagal update: ${error.message}` })
            skipped++
          } else {
            updated++
          }
        } else {
          skipped++
        }
      } else {
        const { error } = await supabase
          .from('siswa')
          .insert({
            nisn,
            nama,
            password_hash: passwordHash,
            kelas_id: kelasId || null,
            created_by: guruId
          })

        if (error) {
          errors.push({ row: rowNumber, message: `Gagal import: ${error.message}` })
          skipped++
        } else {
          imported++
        }
      }
    }

    await supabase.from('audit_log').insert({
      user_id: guruId,
      role: 'guru',
      action: 'import_siswa',
      entity_type: 'siswa',
      details: {
        total_rows: jsonData.length,
        imported,
        updated,
        skipped,
        error_count: errors.length
      }
    })

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