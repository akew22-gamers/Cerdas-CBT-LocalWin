import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { UjianForm } from "@/components/ujian/UjianForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default async function EditUjianPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: guru } = await supabase
    .from("guru")
    .select("nama")
    .eq("id", user.id)
    .single()

  const { data: ujian, error } = await supabase
    .from("ujian")
    .select("id, kode_ujian, judul, durasi, jumlah_opsi, show_result, status")
    .eq("id", id)
    .eq("created_by", user.id)
    .single()

  if (error || !ujian) {
    redirect("/guru/ujian")
  }

  return (
    <DashboardLayout user={{ nama: guru?.nama || "Guru", role: "guru" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Ujian</h1>
          <p className="text-gray-500 text-sm mt-1">
            Update informasi ujian
          </p>
        </div>

        {ujian.status === "aktif" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Perhatian:</strong> Ujian sedang aktif. Hanya pengaturan "Tampilkan hasil" yang dapat diubah.
              Untuk mengubah pengaturan lain, nonaktifkan ujian terlebih dahulu.
            </p>
          </div>
        )}

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informasi Ujian
              </CardTitle>
              <CardDescription>
                Kode ujian: <span className="font-mono font-medium">{ujian.kode_ujian}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UjianForm 
                mode="edit" 
                initialData={{
                  id: ujian.id,
                  judul: ujian.judul,
                  durasi: ujian.durasi,
                  jumlah_opsi: ujian.jumlah_opsi as 4 | 5,
                  show_result: ujian.show_result
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
