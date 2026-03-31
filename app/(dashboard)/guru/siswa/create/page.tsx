import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SiswaForm } from '@/components/siswa/SiswaForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CreateSiswaPage() {
  const supabase = await createClient()

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

  return (
    <DashboardLayout
      user={{
        nama: guruData?.nama || 'Guru',
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
