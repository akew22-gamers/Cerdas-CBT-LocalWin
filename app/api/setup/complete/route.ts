import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api'
import type { SetupCompleteRequest } from '@/types/api'

export async function POST(request: Request) {
  try {
    const body = await request.json() as SetupCompleteRequest
    const { super_admin, sekolah } = body

    if (!super_admin?.username || !super_admin?.password) {
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username dan password super-admin wajib diisi'
        }
      }, { status: 400 })
    }

    if (!sekolah?.nama_sekolah || !sekolah?.tahun_ajaran) {
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nama sekolah dan tahun ajaran wajib diisi'
        }
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: existingSetup } = await supabase
      .from('identitas_sekolah')
      .select('setup_wizard_completed')
      .single()

    if (existingSetup?.setup_wizard_completed) {
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'SETUP_ALREADY_COMPLETED',
          message: 'Setup wizard sudah pernah dijalankan'
        }
      }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(super_admin.password, 10)

    const { data: adminData, error: adminError } = await supabase
      .from('super_admin')
      .insert({
        username: super_admin.username,
        password_hash: passwordHash
      })
      .select('id, username')
      .single()

    if (adminError) {
      console.error('Super-admin creation error:', adminError)
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Gagal membuat akun super-admin'
        }
      }, { status: 500 })
    }

    const { data: sekolahData, error: sekolahError } = await supabase
      .from('identitas_sekolah')
      .insert({
        nama_sekolah: sekolah.nama_sekolah,
        npsn: sekolah.npsn || null,
        alamat: sekolah.alamat || null,
        telepon: sekolah.telepon || null,
        email: sekolah.email || null,
        website: sekolah.website || null,
        kepala_sekolah: sekolah.kepala_sekolah || null,
        tahun_ajaran: sekolah.tahun_ajaran,
        logo_url: sekolah.logo_url || null,
        setup_wizard_completed: true,
        updated_by: adminData.id
      })
      .select('id, nama_sekolah, npsn')
      .single()

    if (sekolahError) {
      console.error('Identitas sekolah creation error:', sekolahError)
      await supabase.from('super_admin').delete().eq('id', adminData.id)
      return NextResponse.json<ApiErrorResponse>({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Gagal menyimpan data sekolah'
        }
      }, { status: 500 })
    }

    await supabase.from('audit_log').insert({
      user_id: adminData.id,
      role: 'super_admin',
      action: 'setup_completed',
      entity_type: 'identitas_sekolah',
      entity_id: sekolahData.id,
      details: { username: super_admin.username }
    })

    return NextResponse.json<ApiSuccessResponse<{
      message: string
      super_admin: { id: string; username: string }
      sekolah: { id: string; nama_sekolah: string; npsn?: string }
    }>>({
      success: true,
      data: {
        message: 'Setup completed successfully',
        super_admin: {
          id: adminData.id,
          username: adminData.username
        },
        sekolah: {
          id: sekolahData.id,
          nama_sekolah: sekolahData.nama_sekolah,
          npsn: sekolahData.npsn ?? undefined
        }
      }
    })
  } catch (error) {
    console.error('Setup complete error:', error)
    return NextResponse.json<ApiErrorResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan saat setup'
      }
    }, { status: 500 })
  }
}
