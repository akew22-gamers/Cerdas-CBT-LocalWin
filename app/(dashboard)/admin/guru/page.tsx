import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { GuruTable } from '@/components/admin/GuruTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface Guru {
  id: string
  username: string
  nama: string
  created_at: string
}

interface GuruListPageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function GuruListPage({ searchParams }: GuruListPageProps) {
  const supabase = await createClient()
  const { search = '', page = '1' } = await searchParams

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: adminData } = await supabase
    .from('super_admin')
    .select('username')
    .eq('id', user.id)
    .single()

  // Fetch guru list
  let query = supabase
    .from('guru')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.or(`username.ilike.%${search}%,nama.ilike.%${search}%`)
  }

  const { data: guruList } = await query.order('created_at', { ascending: false }).limit(50)

  return (
    <DashboardLayout
      user={{
        nama: adminData?.username || 'Super Admin',
        role: 'super_admin'
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900">Manajemen Guru</h1>
            <p className="text-gray-600 mt-1">Kelola data guru Anda</p>
          </div>
          <Link href="/admin/guru/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Guru
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari username atau nama..."
              defaultValue={search}
              className="pl-9"
              name="search"
              onChange={(e) => {
                const form = e.target.form
                if (form) {
                  form.requestSubmit()
                }
              }}
            />
          </div>
        </div>

        <GuruTable 
          guruList={guruList || []} 
          onRefresh={() => {}}
        />
      </div>
    </DashboardLayout>
  )
}
