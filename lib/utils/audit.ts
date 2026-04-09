import { getDb } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { headers } from 'next/headers'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create_guru'
  | 'update_guru'
  | 'delete_guru'
  | 'create_siswa'
  | 'update_siswa'
  | 'delete_siswa'
  | 'import_siswa'
  | 'create_ujian'
  | 'update_ujian'
  | 'delete_ujian'
  | 'toggle_ujian'
  | 'duplicate_ujian'
  | 'create_soal'
  | 'update_soal'
  | 'delete_soal'
  | 'submit_ujian'
  | 'exam_restored'
  | 'setup_completed'
  | 'change_password'
  | 'reset_data'

export interface AuditLogInput {
  userId: string
  role: 'super_admin' | 'guru' | 'siswa'
  action: AuditAction
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

export async function logAudit({
  userId,
  role,
  action,
  entityType,
  entityId,
  details,
  ipAddress
}: AuditLogInput): Promise<void> {
  try {
    const headersList = await headers()
    const clientIp = ipAddress || headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || null

    const db = getDb()
    
    db.prepare(`
      INSERT INTO audit_log (user_id, role, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      userId,
      role,
      action,
      entityType || null,
      entityId || null,
      details ? JSON.stringify(details) : null,
      clientIp
    )
  } catch {
    console.error('Failed to log audit event')
  }
}

export async function getCurrentUserForAudit(): Promise<{
  userId: string
  role: 'super_admin' | 'guru' | 'siswa'
} | null> {
  try {
    const session = await getSession()

    if (!session) {
      return null
    }

    return { 
      userId: session.user.id, 
      role: session.user.role 
    }
  } catch (error) {
    console.error('Error getting current user for audit')
    return null
  }
}
