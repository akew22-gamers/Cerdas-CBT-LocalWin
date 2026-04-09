import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SiswaForm } from '@/components/siswa/SiswaForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

async function getKelasList() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'guru') {
    redirect('/login')
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/kelas`, { cache: 'no-store' })
    const { data } = await res.json()
    return { kelasList: data?.kelas || [], session }
  } catch {
    return { kelasList: [], session }
  }
}

export default async function CreateSiswaPage() {
  const { kelasList, session } = await getKelasList()

  return (
    <DashboardLayout
      user={{
        nama: session.user.nama || 'Guru',
        username: session.user.username,
        role: 'guru'
      }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Tambah Siswa</h1>
          <p className="text-gray-600 mt-1">Tambahkan siswa baru ke database</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Data Siswa</CardTitle>
            <CardDescription>
              Isi form di bawah untuk menambahkan siswa baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SiswaForm
              kelasList={kelasList || []}
              mode="create"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}