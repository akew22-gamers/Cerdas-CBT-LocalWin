import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    const { data: sekolah, error } = await supabase
      .from('identitas_sekolah')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching school identity:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        sekolah: sekolah || null
      }
    })

  } catch (error) {
    console.error('Error in GET /api/admin/sekolah:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    const body = await request.json()
    const {
      nama_sekolah,
      npsn,
      alamat,
      logo_url,
      telepon,
      email,
      website,
      kepala_sekolah,
      tahun_ajaran
    } = body

    if (!nama_sekolah || !tahun_ajaran) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Nama sekolah dan tahun ajaran harus diisi' } },
        { status: 400 }
      )
    }

    const { data: existingData } = await supabase
      .from('identitas_sekolah')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    let updatedSekolah

    if (existingData) {
      const { data, error } = await supabase
        .from('identitas_sekolah')
        .update({
          nama_sekolah,
          npsn: npsn || null,
          alamat: alamat || null,
          logo_url: logo_url || null,
          telepon: telepon || null,
          email: email || null,
          website: website || null,
          kepala_sekolah: kepala_sekolah || null,
          tahun_ajaran,
          updated_by: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating school identity:', error)
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
          { status: 500 }
        )
      }

      updatedSekolah = data
    } else {
      const { data, error } = await supabase
        .from('identitas_sekolah')
        .insert({
          nama_sekolah,
          npsn: npsn || null,
          alamat: alamat || null,
          logo_url: logo_url || null,
          telepon: telepon || null,
          email: email || null,
          website: website || null,
          kepala_sekolah: kepala_sekolah || null,
          tahun_ajaran,
          updated_by: session.user.id,
          setup_wizard_completed: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating school identity:', error)
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
          { status: 500 }
        )
      }

      updatedSekolah = data
    }

    return NextResponse.json({
      success: true,
      data: {
        sekolah: updatedSekolah
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/sekolah:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    )
  }
}
