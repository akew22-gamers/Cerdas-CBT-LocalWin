import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client dengan service role key untuk bypass RLS
 * Singleton pattern untuk menghindari pembuatan koneksi baru setiap pemanggilan.
 */
let adminClientInstance: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  // Reuse instance jika sudah ada (efektif dalam warm lambda serverless)
  if (adminClientInstance) return adminClientInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key')
  }

  adminClientInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return adminClientInstance
}