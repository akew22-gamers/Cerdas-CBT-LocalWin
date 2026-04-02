import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SiswaTable } from '@/components/siswa/SiswaTable'
import { AddSiswaDialog } from '@/components/siswa/AddSiswaDialog'
import { ImportSiswaDialog } from '@/components/siswa/ImportSiswaDialog'
import { Button } from '@/components/ui/button'
import { Plus, Users, Filter } from 'lucide-react'
import { KelasFilter } from '@/components/siswa/KelasFilter'

interface Kelas {
  id: string
  nama_kelas: string
}

interface Siswa {
  id: string
  nisn: string
  nama: string
  kelas: {
    id: string
    nama_kelas: string
  } | null
}

export default async function SiswaListPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas_id?: string }>
}) {
  const session = await getSession()
  const resolvedParams = await searchParams
  const kelas_id = resolvedParams.kelas_id

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'guru') {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: kelasList } = await supabase
    .from('kelas')
    .select('id, nama_kelas')
    .eq('created_by', session.user.id)
    .order('nama_kelas', { ascending: true })

  let query = supabase
    .from('siswa')
    .select(`
      *,
      kelas:kelas_id (
        id,
        nama_kelas
      )
    `)
    .eq('created_by', session.user.id)

  if (kelas_id) {
    query = query.eq('kelas_id', kelas_id)
  }

  const { data: siswaList } = await query.order('nama', { ascending: true })

  const selectedKelas = kelas_id ? kelasList?.find(k => k.id === kelas_id) : null

  return (
    <DashboardLayout
      user={{
        nama: session.user.nama || 'Guru',
        username: session.user.username,
        role: 'guru'
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manajemen Siswa</h1>
              <p className="text-slate-500 mt-0.5">Kelola data siswa dan kelas Anda</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ImportSiswaDialog onSuccess={() => {}} />
            <AddSiswaDialog />
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filter:</span>
          <KelasFilter 
            kelasList={kelasList || []} 
            selectedKelasId={kelas_id || null}
            selectedKelasName={selectedKelas?.nama_kelas || null}
          />
        </div>

        <SiswaTable
          siswaList={siswaList || []}
          kelasList={kelasList || []}
        />
      </div>
    </DashboardLayout>
  )
}