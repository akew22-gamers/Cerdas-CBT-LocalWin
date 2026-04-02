import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { ImportSoalForm } from "@/components/soal/ImportSoalForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ImportSoalPage({ searchParams }: { searchParams: Promise<{ ujian_id?: string }> }) {
  const session = await getSession()
  const resolvedSearchParams = await searchParams

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  const ujianId = resolvedSearchParams.ujian_id

  if (!ujianId) {
    redirect("/guru/soal")
  }

  const supabase = createAdminClient()

  const { data: ujian } = await supabase
    .from("ujian")
    .select("id, judul, kode_ujian, status")
    .eq("id", ujianId)
    .eq("created_by", session.user.id)
    .single()

  if (!ujian) {
    redirect("/guru/soal")
  }

  return (
    <DashboardLayout user={{ nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/guru/soal?ujian_id=${ujianId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Soal dari Excel</h1>
            <p className="text-gray-500 text-sm mt-1">
              {ujian.judul} ({ujian.kode_ujian})
            </p>
          </div>
        </div>

        {ujian.status === 'aktif' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Perhatian:</strong> Tidak dapat mengimpor soal karena ujian sedang aktif. 
              Nonaktifkan ujian terlebih dahulu.
            </p>
          </div>
        )}

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File Excel
              </CardTitle>
              <CardDescription>
                Format file Excel harus mengikuti template yang ditentukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportSoalForm ujianId={ujianId} ujianStatus={ujian.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}