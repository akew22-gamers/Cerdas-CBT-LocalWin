import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { KelasForm } from "@/components/kelas/KelasForm"
import Link from "next/link"

interface EditKelasPageProps {
  params: Promise<{ id: string }>
}

async function getKelasData(id: string) {
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

  const { data: kelas, error } = await supabase
    .from("kelas")
    .select("id, nama_kelas")
    .eq("id", id)
    .eq("created_by", user.id)
    .single()

  if (error || !kelas) {
    redirect("/guru/kelas")
  }

  return {
    user: { nama: guru?.nama || "Guru", role: "guru" },
    kelas,
  }
}

export default async function EditKelasPage({ params }: EditKelasPageProps) {
  const { id } = await params
  const { user, kelas } = await getKelasData(id)

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Kelas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ubah nama kelas sesuai kebutuhan
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <KelasForm mode="edit" initialData={kelas} />
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
