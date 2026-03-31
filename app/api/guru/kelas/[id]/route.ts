import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/guru/kelas/[id] - Get single kelas detail
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Get kelas detail with siswa count
    const { data: kelas, error } = await supabase
      .from('kelas')
      .select(`
        id,
        nama_kelas,
        created_at,
        updated_at,
        siswa_count:siswa(count)
      `)
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (error || !kelas) {
      return NextResponse.json(
        { success: false, error: { code: 'KELAS_NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: kelas.id,
        nama_kelas: kelas.nama_kelas,
        created_at: kelas.created_at,
        updated_at: kelas.updated_at,
        jumlah_siswa: kelas.siswa_count?.[0]?.count || 0
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

// PUT /api/guru/kelas/[id] - Update kelas
export async function PUT(_request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await _request.json()

    // Validation
    if (!body.nama_kelas || typeof body.nama_kelas !== 'string' || !body.nama_kelas.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama kelas harus diisi' } },
        { status: 400 }
      )
    }

    const namaKelas = body.nama_kelas.trim()

    // Check if kelas exists and belongs to user
    const { data: existingKelas } = await supabase
      .from('kelas')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!existingKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'KELAS_NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Check if new name already exists for this guru (excluding current kelas)
    const { data: duplicateKelas } = await supabase
      .from('kelas')
      .select('id')
      .eq('nama_kelas', namaKelas)
      .eq('created_by', user.id)
      .neq('id', id)
      .single()

    if (duplicateKelas) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_KELAS', message: 'Kelas dengan nama ini sudah ada' } },
        { status: 400 }
      )
    }

    const { data: updatedKelas, error } = await supabase
      .from('kelas')
      .update({
        nama_kelas: namaKelas
      })
      .eq('id', id)
      .eq('created_by', user.id)
      .select('id, nama_kelas, updated_at')
      .single()

    if (error) {
      console.error('Error updating kelas:', error)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengupdate kelas' } },
        { status: 500 }
      )
    }

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

// DELETE /api/guru/kelas/[id] - Delete kelas (only if no siswa)
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Tidak terautentikasi' } },
        { status: 401 }
      )
    }

    // Check if kelas exists and belongs to user
    const { data: kelas } = await supabase
      .from('kelas')
      .select('id, nama_kelas')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!kelas) {
      return NextResponse.json(
        { success: false, error: { code: 'KELAS_NOT_FOUND', message: 'Kelas tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Check if kelas has siswa
    const { data: siswaCount } = await supabase
      .from('siswa')
      .select('id', { count: 'exact', head: true })
      .eq('kelas_id', id)

    const hasSiswa = (siswaCount?.length ?? 0) > 0

    if (hasSiswa) {
      return NextResponse.json(
        { success: false, error: { code: 'KELAS_HAS_SISWA', message: 'Tidak dapat menghapus kelas yang masih memiliki siswa' } },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('kelas')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) {
      console.error('Error deleting kelas:', error)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal menghapus kelas' } },
        { status: 500 }
      )
    }

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
