import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { KelasTable } from "@/components/kelas/KelasTable"
import { AddKelasDialog } from "@/components/kelas/AddKelasDialog"

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

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/kelas`, { cache: 'no-store' })
    const { data } = await res.json()
    
    const formattedKelas: Kelas[] = (data?.kelas || []).map((k: any) => ({
      id: k.id,
      nama_kelas: k.nama_kelas,
      created_at: k.created_at,
      jumlah_siswa: k.jumlah_siswa || 0,
    }))
    
    return {
      kelas: formattedKelas,
      user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" },
    }
  } catch {
    return {
      kelas: [],
      user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" },
    }
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
          <AddKelasDialog />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <KelasTable data={kelas} />
        </div>
      </div>
    </DashboardLayout>
  )
}