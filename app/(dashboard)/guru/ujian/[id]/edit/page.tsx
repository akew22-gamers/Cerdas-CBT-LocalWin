import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { UjianForm } from "@/components/ujian/UjianForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

async function getUjianData(id: string) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/ujian/${id}`, { cache: 'no-store' })
    const { data } = await res.json()
    
    if (!data?.ujian) {
      redirect("/guru/ujian")
    }
    
    return { ujian: data.ujian, session }
  } catch {
    redirect("/guru/ujian")
  }
}

export default async function EditUjianPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { ujian, session } = await getUjianData(id)

  return (
    <DashboardLayout user={{ nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }}>
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