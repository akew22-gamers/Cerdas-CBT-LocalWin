import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SekolahForm } from '@/components/sekolah/SekolahForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SekolahDisplay } from '@/components/sekolah/SekolahDisplay'

export default async function AdminSekolahPage() {
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

  const { data: sekolahData } = await supabase
    .from('identitas_sekolah')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const sekolah = sekolahData || null

  return (
    <DashboardLayout
      user={{
        nama: adminData?.username || 'Administrator',
        role: 'super_admin'
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-indigo-900">Identitas Sekolah</h1>
          <p className="text-gray-600">Kelola informasi sekolah</p>
        </div>

        <Tabs defaultValue="edit" className="space-y-4">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="edit">Edit Data</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Identitas Sekolah</CardTitle>
                <CardDescription>
                  Lengkapi informasi sekolah Anda. Field bertanda * wajib diisi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SekolahForm initialData={sekolah || undefined} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {sekolah ? (
              <SekolahDisplay data={sekolah} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Belum ada data sekolah untuk ditampilkan. Silakan isi form pada tab &quot;Edit Data&quot;.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
