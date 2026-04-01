import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { KelasTable } from "@/components/kelas/KelasTable"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Kelas {
  id: string
  nama_kelas: string
  jumlah_siswa: number
  created_at: string
}

async function getKelasList(): Promise<{ kelas: Kelas[]; user: { nama: string; username: string; role: string } }> {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  const supabase = createAdminClient()

  const { data: kelasList, error } = await supabase
    .from("kelas")
    .select(`
      id,
      nama_kelas,
      created_at,
      siswa_count:siswa(count)
    `)
    .eq("created_by", session.user.id)
    .order("nama_kelas", { ascending: true })

  if (error) {
    console.error("Error fetching kelas:", error)
    return {
      kelas: [],
      user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }
    }
  }

  const formattedKelas: Kelas[] = kelasList.map((k: any) => ({
    id: k.id,
    nama_kelas: k.nama_kelas,
    created_at: k.created_at,
    jumlah_siswa: k.siswa_count?.[0]?.count || 0,
  }))

  return {
    kelas: formattedKelas,
    user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" },
  }
}

export default async function KelasListPage() {
  const { kelas, user } = await getKelasList()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola kelas Anda untuk mengatur siswa
            </p>
          </div>
          <Link href="/guru/kelas/create" className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            Kelas Baru
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <KelasTable data={kelas} />
        </div>
      </div>
    </DashboardLayout>
  )
}