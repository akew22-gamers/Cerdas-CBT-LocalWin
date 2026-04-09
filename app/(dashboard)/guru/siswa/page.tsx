import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SiswaClient } from '@/components/siswa/SiswaClient'

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

async function getSiswaData(kelas_id?: string) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'guru') {
    redirect('/login')
  }

  try {
    const kelasRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/kelas`, { cache: 'no-store' })
    const { data: kelasData } = await kelasRes.json()
    const kelasList: Kelas[] = (kelasData?.kelas || []).map((k: any) => ({
      id: k.id,
      nama_kelas: k.nama_kelas
    }))

    const params = new URLSearchParams()
    if (kelas_id) params.set('kelas_id', kelas_id)
    
    const siswaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/siswa?${params.toString()}`, { cache: 'no-store' })
    const { data: siswaResult } = await siswaRes.json()
    const siswaList: Siswa[] = siswaResult?.siswa || []

    return { kelasList, siswaList, session }
  } catch {
    return { kelasList: [], siswaList: [], session }
  }
}

export default async function SiswaListPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas_id?: string }>
}) {
  const resolvedParams = await searchParams
  const kelas_id = resolvedParams.kelas_id
  const { kelasList, siswaList, session } = await getSiswaData(kelas_id)

  return (
    <DashboardLayout
      user={{
        nama: session.user.nama || 'Guru',
        username: session.user.username,
        role: 'guru'
      }}
    >
      <SiswaClient
        siswaList={siswaList || []}
        kelasList={kelasList || []}
      />
    </DashboardLayout>
  )
}