import { getSession } from '@/lib/auth/session'
import { redirect, notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SiswaForm } from '@/components/siswa/SiswaForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EditSiswaPageProps {
  params: Promise<{ id: string }>
}

async function getSiswaData(id: string) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'guru') {
    redirect('/login')
  }

  try {
    const siswaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/siswa/${id}`, { cache: 'no-store' })
    const { data: siswaResult } = await siswaRes.json()
    
    if (!siswaResult?.siswa) {
      notFound()
    }
    
    const siswaData = siswaResult.siswa

    const kelasRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/kelas`, { cache: 'no-store' })
    const { data: kelasData } = await kelasRes.json()
    const kelasList = kelasData?.kelas || []

    return { siswaData, kelasList, session }
  } catch {
    notFound()
  }
}

export default async function EditSiswaPage({ params }: EditSiswaPageProps) {
  const { id } = await params
  const { siswaData, kelasList, session } = await getSiswaData(id)

  if (!siswaData) {
    notFound()
  }

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
          <h1 className="text-3xl font-bold text-indigo-900">Edit Siswa</h1>
          <p className="text-gray-600 mt-1">Update data siswa</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Data Siswa</CardTitle>
            <CardDescription>
              Update informasi siswa {siswaData.nama}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SiswaForm
              initialData={{
                id: siswaData.id,
                nisn: siswaData.nisn,
                nama: siswaData.nama,
                kelas_id: siswaData.kelas_id,
              }}
              kelasList={kelasList || []}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}