import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { UjianTable } from "@/components/ujian/UjianTable"
import { AddUjianDialog } from "@/components/ujian/AddUjianDialog"

async function getUjianList(): Promise<{ ujian: any[]; user: { nama: string; username: string; role: string } }> {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/ujian`, { cache: 'no-store' })
    const { data } = await res.json()
    
    return {
      ujian: data?.ujian || [],
      user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }
    }
  } catch {
    return {
      ujian: [],
      user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }
    }
  }
}

export default async function UjianListPage() {
  const { ujian, user } = await getUjianList()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Ujian</h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola ujian dan tugaskan ke kelas
            </p>
          </div>
          <AddUjianDialog />
        </div>

        <UjianTable data={ujian} />
      </div>
    </DashboardLayout>
  )
}