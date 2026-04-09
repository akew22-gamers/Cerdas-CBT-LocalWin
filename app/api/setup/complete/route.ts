import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import { generateId, toJsonField, getTimestamp } from '@/lib/db/utils'
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

    const db = getDb()

    const existingSetup = db.prepare('SELECT id, setup_wizard_completed FROM identitas_sekolah LIMIT 1').get() as { id: string; setup_wizard_completed: number } | undefined

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

    const existingAdmin = db.prepare('SELECT id FROM super_admin LIMIT 1').get() as { id: string } | undefined

    if (existingAdmin) {
      db.prepare('DELETE FROM super_admin WHERE id = ?').run(existingAdmin.id)
    }

    const adminId = generateId()
    db.prepare(`
      INSERT INTO super_admin (id, username, password_hash)
      VALUES (?, ?, ?)
    `).run(adminId, super_admin.username, passwordHash)

    const timestamp = getTimestamp()

    let sekolahData: { id: string; nama_sekolah: string; npsn?: string }

    if (existingSetup) {
      db.prepare(`
        UPDATE identitas_sekolah SET
          nama_sekolah = ?,
          npsn = ?,
          alamat = ?,
          telepon = ?,
          email = ?,
          website = ?,
          kepala_sekolah = ?,
          tahun_ajaran = ?,
          logo_url = ?,
          setup_wizard_completed = 1,
          updated_by = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        sekolah.nama_sekolah,
        sekolah.npsn || null,
        sekolah.alamat || null,
        sekolah.telepon || null,
        sekolah.email || null,
        sekolah.website || null,
        sekolah.kepala_sekolah || null,
        sekolah.tahun_ajaran,
        sekolah.logo_url || null,
        adminId,
        timestamp,
        existingSetup.id
      )

      sekolahData = {
        id: existingSetup.id,
        nama_sekolah: sekolah.nama_sekolah,
        npsn: sekolah.npsn ?? undefined
      }
    } else {
      const schoolId = generateId()
      db.prepare(`
        INSERT INTO identitas_sekolah (
          id, nama_sekolah, npsn, alamat, telepon, email, website,
          kepala_sekolah, tahun_ajaran, logo_url, setup_wizard_completed, updated_by, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `).run(
        schoolId,
        sekolah.nama_sekolah,
        sekolah.npsn || null,
        sekolah.alamat || null,
        sekolah.telepon || null,
        sekolah.email || null,
        sekolah.website || null,
        sekolah.kepala_sekolah || null,
        sekolah.tahun_ajaran,
        sekolah.logo_url || null,
        adminId,
        timestamp,
        timestamp,
        timestamp
      )

      sekolahData = {
        id: schoolId,
        nama_sekolah: sekolah.nama_sekolah,
        npsn: sekolah.npsn ?? undefined
      }
    }

    const auditLogId = generateId()
    db.prepare(`
      INSERT INTO audit_log (id, user_id, role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, 'super_admin', 'setup_completed', 'identitas_sekolah', ?, ?, ?)
    `).run(auditLogId, adminId, sekolahData.id, toJsonField({ username: super_admin.username }), timestamp)

    return NextResponse.json<ApiSuccessResponse<{
      message: string
      super_admin: { id: string; username: string }
      sekolah: { id: string; nama_sekolah: string; npsn?: string }
    }>>({
      success: true,
      data: {
        message: 'Setup completed successfully',
        super_admin: {
          id: adminId,
          username: super_admin.username
        },
        sekolah: sekolahData
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
