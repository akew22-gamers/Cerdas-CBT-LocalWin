import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()
    const headersList = await headers()
    const clientIp = ipAddress || headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || null

    await supabase.from('audit_log').insert({
      user_id: userId,
      role,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || null,
      ip_address: clientIp
    })
  } catch {
    console.error('Failed to log audit event')
  }
}

export async function getCurrentUserForAudit(): Promise<{
  userId: string
  role: 'super_admin' | 'guru' | 'siswa'
} | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: superAdmin } = await supabase
      .from('super_admin')
      .select('id')
      .eq('id', user.id)
      .single()

    if (superAdmin) {
      return { userId: user.id, role: 'super_admin' }
    }

    const { data: guru } = await supabase
      .from('guru')
      .select('id')
      .eq('id', user.id)
      .single()

    if (guru) {
      return { userId: user.id, role: 'guru' }
    }

    const { data: siswa } = await supabase
      .from('siswa')
      .select('id')
      .eq('id', user.id)
      .single()

    if (siswa) {
      return { userId: user.id, role: 'siswa' }
    }

    return null
  } catch (error) {
    console.error('Error getting current user for audit')
    return null
  }
}
