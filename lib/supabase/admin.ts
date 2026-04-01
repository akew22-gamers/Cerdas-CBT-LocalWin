import { createClient } from '@supabase/supabase-js'

/**
 * Admin client dengan service role key untuk bypass RLS
 * HANYA gunakan untuk operasi yang memerlukan elevated privileges:
 * - Setup wizard (sebelum authentication)
 * - Import data massal
 * - Operasi admin yang bypass RLS
 * 
 * JANGAN gunakan di client-side code!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}