import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { UjianForm } from "@/components/ujian/UjianForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default async function CreateUjianPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: guru } = await supabase
    .from("guru")
    .select("nama")
    .eq("id", user.id)
    .single()

  return (
    <DashboardLayout user={{ nama: guru?.nama || "Guru", role: "guru" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Ujian Baru</h1>
          <p className="text-gray-500 text-sm mt-1">
            Isi form di bawah untuk membuat ujian baru
          </p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informasi Ujian
              </CardTitle>
              <CardDescription>
                Kode ujian akan dibuat otomatis setelah ujian disimpan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UjianForm mode="create" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
