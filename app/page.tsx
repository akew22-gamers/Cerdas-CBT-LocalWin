import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: identitasSekolah } = await supabase
    .from('identitas_sekolah')
    .select('setup_wizard_completed')
    .limit(1)
    .single()

  if (!identitasSekolah?.setup_wizard_completed) {
    redirect('/setup')
  }

  redirect('/login')
}