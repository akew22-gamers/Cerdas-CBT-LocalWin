import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/guru/ujian/[id] - Get ujian detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get ujian detail with kelas info and soal count
    const { data: ujian, error } = await supabase
      .from('ujian')
      .select(`
        id,
        kode_ujian,
        judul,
        durasi,
        jumlah_opsi,
        status,
        show_result,
        created_at,
        updated_at,
        ujian_kelas!inner(kelas_id, kelas:kelas(nama_kelas)),
        soal_count:soal(count)
      `)
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (error || !ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Extract unique kelas
    const kelasMap = new Map()
    ujian.ujian_kelas?.forEach((uk: any) => {
      if (uk.kelas) {
        kelasMap.set(uk.kelas_id, {
          id: uk.kelas_id,
          nama_kelas: uk.kelas.nama_kelas
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: ujian.id,
        kode_ujian: ujian.kode_ujian,
        judul: ujian.judul,
        durasi: ujian.durasi,
        jumlah_opsi: ujian.jumlah_opsi,
        status: ujian.status,
        show_result: ujian.show_result,
        created_at: ujian.created_at,
        updated_at: ujian.updated_at,
        kelas: Array.from(kelasMap.values()),
        jumlah_soal: ujian.soal_count?.[0]?.count || 0
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

// PUT /api/guru/ujian/[id] - Update ujian
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Check if ujian exists and belongs to user
    const { data: existingUjian, error: fetchError } = await supabase
      .from('ujian')
      .select('id, status')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (fetchError || !existingUjian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // If ujian is aktif, only allow updating show_result
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

    // Build update object
    const updateData: any = {}
    
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
      updateData.show_result = body.show_result
    }

    // Update ujian
    const { data: updatedUjian, error: updateError } = await supabase
      .from('ujian')
      .update(updateData)
      .eq('id', id)
      .select('id, kode_ujian, judul, durasi, jumlah_opsi, status, show_result, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating ujian:', updateError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal mengupdate ujian' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUjian.id,
        kode_ujian: updatedUjian.kode_ujian,
        judul: updatedUjian.judul,
        durasi: updatedUjian.durasi,
        jumlah_opsi: updatedUjian.jumlah_opsi,
        status: updatedUjian.status,
        show_result: updatedUjian.show_result,
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

// DELETE /api/guru/ujian/[id] - Delete ujian
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if ujian exists and belongs to user
    const { data: ujian, error: fetchError } = await supabase
      .from('ujian')
      .select('status')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (fetchError || !ujian) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Ujian tidak ditemukan' } },
        { status: 404 }
      )
    }

    // Check if ujian is aktif
    if (ujian.status === 'aktif') {
      return NextResponse.json(
        { success: false, error: { code: 'UJIAN_ACTIVE', message: 'Tidak dapat menghapus ujian yang sedang aktif. Nonaktifkan ujian terlebih dahulu.' } },
        { status: 400 }
      )
    }

    // Delete ujian (cascade will handle soal and ujian_kelas)
    const { error: deleteError } = await supabase
      .from('ujian')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting ujian:', deleteError)
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_ERROR', message: 'Gagal menghapus ujian' } },
        { status: 500 }
      )
    }

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
