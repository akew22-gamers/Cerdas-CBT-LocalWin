import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/guru/soal - List soal with ujian_id filter
export async function GET(request: Request) {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const ujian_id = searchParams.get('ujian_id')

    if (!ujian_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ujian_id harus diisi' } },
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

    // Get all soal for this ujian
    const { data: soalList, error } = await supabase
      .from('soal')
      .select('*')
      .eq('ujian_id', ujian_id)
      .order('urutan', { ascending: true })

    if (error) {
      console.error('Error fetching soal:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

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

// POST /api/guru/soal - Create new soal
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

    // Parse request body
    const body = await request.json()
    const { ujian_id, teks_soal, gambar_url, jawaban_benar, pengecoh_1, pengecoh_2, pengecoh_3, pengecoh_4, urutan } = body

    // Validation
    if (!ujian_id || !teks_soal || !jawaban_benar || !pengecoh_1 || !pengecoh_2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ujian_id, teks_soal, jawaban_benar, pengecoh_1, dan pengecoh_2 harus diisi' } },
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

    // Get next urutan if not provided
    let urutanSoal = urutan
    if (urutanSoal === undefined || urutanSoal === null) {
      const { data: maxUrutan } = await supabase
        .from('soal')
        .select('urutan')
        .eq('ujian_id', ujian_id)
        .order('urutan', { ascending: false })
        .limit(1)
        .single()
      urutanSoal = maxUrutan ? maxUrutan.urutan + 1 : 0
    }

    // Insert new soal
    const { data: newSoal, error } = await supabase
      .from('soal')
      .insert({
        ujian_id,
        teks_soal,
        gambar_url: gambar_url || null,
        jawaban_benar,
        pengecoh_1,
        pengecoh_2,
        pengecoh_3: pengecoh_3 || null,
        pengecoh_4: pengecoh_4 || null,
        urutan: urutanSoal
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating soal:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Log audit
    await supabase.from('audit_log').insert({
      user_id: user.id,
      role: 'guru',
      action: 'create',
      entity_type: 'soal',
      entity_id: newSoal.id,
      details: { ujian_id, teks_soal: teks_soal.substring(0, 50) }
    })

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
