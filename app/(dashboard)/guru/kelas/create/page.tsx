import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { KelasForm } from "@/components/kelas/KelasForm"
import Link from "next/link"

async function getGuruInfo() {
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

  return {
    user: { nama: guru?.nama || "Guru", role: "guru" },
  }
}

export default async function CreateKelasPage() {
  const { user } = await getGuruInfo()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Kelas Baru</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tambahkan kelas baru untuk mengelola siswa
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <KelasForm mode="create" />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/guru/kelas" className="hover:text-gray-700">
            ← Kembali ke Daftar Kelas
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
