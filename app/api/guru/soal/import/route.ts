import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { read, utils } from 'xlsx'

// POST /api/guru/soal/import - Import soal from Excel
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const ujian_id = formData.get('ujian_id') as string

    if (!file || !ujian_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File dan ujian_id harus diisi' } },
        { status: 400 }
      )
    }

    // Verify user owns this ujian
    const { data: ujian } = await supabase
      .from('ujian')
      .select('id, status')
      .eq('id', ujian_id)
      .eq('created_by', user.id)
      .single()

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Check if ujian is active
    if (ujian.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Tidak dapat mengimpor soal karena ujian sedang aktif' } },
        { status: 400 }
      )
    }

    // Parse Excel file
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

    // Validate and process rows
    const errors: Array<{ row: number; message: string }> = []
    const soalToInsert: any[] = []
    let currentUrutan = 0

    // Get current max urutan
    const { data: maxUrutanData } = await supabase
      .from('soal')
      .select('urutan')
      .eq('ujian_id', ujian_id)
      .order('urutan', { ascending: false })
      .limit(1)
      .single()
    
    currentUrutan = maxUrutanData ? maxUrutanData.urutan + 1 : 0

    data.forEach((row: any, index: number) => {
      const rowNum = index + 1 // 1-based row number

      // Check required fields
      if (!row['Soal'] || !row['Jawaban Benar'] || !row['Pengecoh 1'] || !row['Pengecoh 2']) {
        errors.push({
          row: rowNum,
          message: 'Kolom Soal, Jawaban Benar, Pengecoh 1, dan Pengecoh 2 harus diisi'
        })
        return
      }

      soalToInsert.push({
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

    // Batch insert soal (max 100 per batch)
    const batchSize = 100
    const batches = []
    for (let i = 0; i < soalToInsert.length; i += batchSize) {
      const batch = soalToInsert.slice(i, i + batchSize)
      batches.push(batch)
    }

    let insertedCount = 0
    for (const batch of batches) {
      const { error } = await supabase
        .from('soal')
        .insert(batch)

      if (error) {
        console.error('Batch insert error:', error)
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
          { status: 500 }
        )
      }
      insertedCount += batch.length
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      role: 'guru',
      action: 'create',
      entity_type: 'soal',
      details: { ujian_id, imported_count: insertedCount, source: 'excel_import' }
    })

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
