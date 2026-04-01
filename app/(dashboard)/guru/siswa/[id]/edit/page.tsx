import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SiswaForm } from '@/components/siswa/SiswaForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EditSiswaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSiswaPage({ params }: EditSiswaPageProps) {
  const session = await getSession()
  const { id } = await params

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'guru') {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: siswaData } = await supabase
    .from('siswa')
    .select(`
      *,
      kelas:kelas_id (
        id,
        nama_kelas
      )
    `)
    .eq('id', id)
    .eq('created_by', session.user.id)
    .single()

  if (!siswaData) {
    notFound()
  }

  const { data: kelasList } = await supabase
    .from('kelas')
    .select('id, nama_kelas')
    .eq('created_by', session.user.id)
    .order('nama_kelas', { ascending: true })

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