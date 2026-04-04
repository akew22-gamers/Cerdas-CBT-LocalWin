import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardLayout } from '@/components/layout'
import { SekolahDisplay } from '@/components/sekolah/SekolahDisplay'
import { Badge } from '@/components/ui/badge'
import { School } from 'lucide-react'

export default async function AdminSekolahPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'super_admin') {
    redirect('/login')
  }

  const supabase = createAdminClient()

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
        nama: session.user.nama,
        username: session.user.username,
        role: 'super_admin'
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
        <div className="max-w-6xl mx-auto space-y-8 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-100 flex flex-shrink-0 items-center justify-center border border-violet-200">
                <School className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Identitas Sekolah
                </h1>
                <p className="text-slate-500 mt-1">
                  Kelola informasi dan identitas sekolah Anda
                </p>
              </div>
            </div>
            {sekolah?.npsn && (
              <Badge variant="secondary" className="self-start sm:self-auto px-4 py-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                Terdaftar
              </Badge>
            )}
          </div>

          <div className="mt-8">
            <SekolahDisplay data={sekolah} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}