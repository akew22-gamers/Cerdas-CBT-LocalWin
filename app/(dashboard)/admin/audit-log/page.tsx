import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditLogPageClient from './AuditLogPageClient'

export default async function AuditLogPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: adminData } = await supabase
    .from('super_admin')
    .select('username')
    .eq('id', user.id)
    .single()

  return <AuditLogPageClient userName={adminData?.username || 'Administrator'} />
}
