import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { DashboardLayout } from '@/components/layout'
import { GuruTable } from '@/components/admin/GuruTable'
import { GuruSearchForm } from '@/components/admin/GuruSearchForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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

async function getGuruList(search: string) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'super_admin') {
    redirect('/login')
  }

  try {
    const params = new URLSearchParams({ page: '1', limit: '50' })
    if (search) params.set('search', search)
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/guru?${params.toString()}`, { cache: 'no-store' })
    const { data } = await res.json()
    return { guruList: data?.guru || [], session }
  } catch {
    return { guruList: [], session }
  }
}

export default async function GuruListPage({ searchParams }: GuruListPageProps) {
  const resolvedParams = await searchParams
  const { search = '' } = resolvedParams
  const { guruList, session } = await getGuruList(search)

  return (
    <DashboardLayout
      user={{
        nama: session.user.nama,
        username: session.user.username,
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
          <GuruSearchForm defaultValue={search} />
        </div>

        <GuruTable guruList={guruList || []} />
      </div>
    </DashboardLayout>
  )
}