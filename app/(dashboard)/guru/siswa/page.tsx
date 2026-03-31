import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SiswaTable } from '@/components/siswa/SiswaTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Upload } from 'lucide-react'
import Link from 'next/link'

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
  const supabase = await createClient()
  const { kelas_id } = await searchParams

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: guruData } = await supabase
    .from('guru')
    .select('nama')
    .eq('id', user.id)
    .single()

  const { data: kelasList } = await supabase
    .from('kelas')
    .select('id, nama_kelas')
    .eq('created_by', user.id)
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
    .eq('created_by', user.id)

  if (kelas_id) {
    query = query.eq('kelas_id', kelas_id)
  }

  const { data: siswaList } = await query.order('nama', { ascending: true })

  return (
    <DashboardLayout
      user={{
        nama: guruData?.nama || 'Guru',
        role: 'guru'
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900">Manajemen Siswa</h1>
            <p className="text-gray-600 mt-1">Kelola data siswa Anda</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import Excel
            </Button>
            <Link href="/guru/siswa/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Siswa
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select defaultValue={kelas_id || ""}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kelas</SelectItem>
              {kelasList?.map((kelas) => (
                <SelectItem key={kelas.id} value={kelas.id}>
                  {kelas.nama_kelas}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SiswaTable 
          siswaList={siswaList || []} 
          onRefresh={() => {}}
        />
      </div>
    </DashboardLayout>
  )
}
