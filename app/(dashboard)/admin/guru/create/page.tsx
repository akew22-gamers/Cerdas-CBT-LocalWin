import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { GuruForm } from '@/components/admin/GuruForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CreateGuruPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: adminData } = await supabase
    .from('super_admin')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <DashboardLayout
      user={{
        nama: adminData?.username || 'Super Admin',
        role: 'super_admin'
      }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Tambah Guru</h1>
          <p className="text-gray-600 mt-1">Tambahkan guru baru ke database</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Data Guru</CardTitle>
            <CardDescription>
              Isi form di bawah untuk menambahkan guru baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuruForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
