import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { KelasForm } from "@/components/kelas/KelasForm"
import Link from "next/link"

async function getGuruInfo() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  return {
    user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" },
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