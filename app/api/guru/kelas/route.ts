import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/guru/kelas - List all kelas owned by current guru
export async function GET() {
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

    // Get all kelas created by this guru with jumlah siswa count
    const { data: kelasList, error } = await supabase
      .from('kelas')
      .select(`
        id,
        nama_kelas,
        created_at,
        siswa_count:siswa(count)
      `)
      .eq('created_by', user.id)
      .order('nama_kelas', { ascending: true })

    if (error) {
      console.error('Error fetching kelas:', error)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengambil data kelas' } },
        { status: 500 }
      )
    }

    // Transform data to include jumlah_siswa
    const formattedKelas = kelasList.map((k: any) => ({
      id: k.id,
      nama_kelas: k.nama_kelas,
      created_at: k.created_at,
      jumlah_siswa: k.siswa_count?.[0]?.count || 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        kelas: formattedKelas
      }
    })

  } catch (error) {
    console.error('Get kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

// POST /api/guru/kelas - Create new kelas
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

    // Validation
    if (!body.nama_kelas || typeof body.nama_kelas !== 'string' || !body.nama_kelas.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama kelas harus diisi' } },
        { status: 400 }
      )
    }

    const namaKelas = body.nama_kelas.trim()

    // Check if kelas with same name already exists for this guru
    const { data: existingKelas } = await supabase
      .from('kelas')
      .select('id')
      .eq('nama_kelas', namaKelas)
      .eq('created_by', user.id)
      .single()

    if (existingKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_KELAS', message: 'Kelas dengan nama ini sudah ada' } },
        { status: 400 }
      )
    }

    // Insert new kelas
    const { data: newKelas, error } = await supabase
      .from('kelas')
      .insert({
        nama_kelas: namaKelas,
        created_by: user.id
      })
      .select('id, nama_kelas, created_at')
      .single()

    if (error) {
      console.error('Error creating kelas:', error)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal membuat kelas' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newKelas.id,
        nama_kelas: newKelas.nama_kelas,
        created_at: newKelas.created_at
      }
    })

  } catch (error) {
    console.error('Create kelas error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
