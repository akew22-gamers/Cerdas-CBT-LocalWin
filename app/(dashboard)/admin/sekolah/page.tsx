import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardLayout } from '@/components/layout'
import { SekolahForm } from '@/components/sekolah/SekolahForm'
import { SekolahDisplay } from '@/components/sekolah/SekolahDisplay'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { School, Edit3, Eye } from 'lucide-react'

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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur-lg opacity-40" />
                <div className="relative h-14 w-14 flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-xl shadow-violet-500/25">
                  <School className="h-7 w-7 text-white" />
                </div>
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

          <Tabs defaultValue="preview" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm p-1 rounded-xl">
                <TabsTrigger 
                  value="preview" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="edit" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg px-6"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Data
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="space-y-6 mt-0">
              {sekolah ? (
                <SekolahDisplay data={sekolah} />
              ) : (
                <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/40">
                  <CardContent className="py-16">
                    <div className="text-center space-y-4">
                      <div className="mx-auto h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
                        <School className="h-10 w-10 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-slate-900">Belum ada data sekolah</p>
                        <p className="text-slate-500 mt-1">
                          Silakan lengkapi informasi sekolah pada tab "Edit Data"
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-6 mt-0">
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/40">
                <CardContent className="pt-8">
                  <SekolahForm initialData={sekolah || undefined} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}