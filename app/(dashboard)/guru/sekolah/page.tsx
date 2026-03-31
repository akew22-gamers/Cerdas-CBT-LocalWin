import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SekolahDisplay } from '@/components/sekolah/SekolahDisplay'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default async function GuruSekolahPage() {
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

  const { data: sekolahData } = await supabase
    .from('identitas_sekolah')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const sekolah = sekolahData || {
    nama_sekolah: 'Nama Sekolah belum diatur',
    npsn: null,
    alamat: null,
    logo_url: null,
    telepon: null,
    email: null,
    website: null,
    kepala_sekolah: null,
    tahun_ajaran: '2025/2026'
  }

  return (
    <DashboardLayout
      user={{
        nama: guruData?.nama || 'Guru',
        role: 'guru'
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-indigo-900">Identitas Sekolah</h1>
          <p className="text-gray-600">Lihat informasi sekolah Anda</p>
        </div>

        {!sekolahData && (
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <CardTitle className="text-amber-800 dark:text-amber-200">Informasi belum tersedia</CardTitle>
              </div>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                Data identitas sekolah belum diatur. Hubungi administrator untuk menambahkan informasi sekolah.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <SekolahDisplay data={sekolah as any} />
      </div>
    </DashboardLayout>
  )
}
