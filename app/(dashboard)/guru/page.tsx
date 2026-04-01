import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { GuruDashboardClient } from "./GuruDashboardClient"

interface DashboardData {
  kelas_count: number
  siswa_count: number
  ujian_count: number
  ujian_aktif: number
  recent_hasil: {
    id: string
    siswa_nama: string
    siswa_nisn: string
    ujian_judul: string
    nilai: number
    submitted_at: string
  }[]
}

async function getDashboardData(userId: string): Promise<{ data: DashboardData; user: { nama: string | null; username: string; role: string }; ujianIds: string[] }> {
  const supabase = createAdminClient()

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/guru/dashboard`, {
    headers: {
      'X-User-Id': userId,
      'X-User-Role': 'guru'
    }
  })

  if (!response.ok) {
    return {
      data: {
        kelas_count: 0,
        siswa_count: 0,
        ujian_count: 0,
        ujian_aktif: 0,
        recent_hasil: []
      },
      user: { nama: null, username: '', role: "guru" },
      ujianIds: []
    }
  }

  const result = await response.json()

  const { data: activeUjian } = await supabase
    .from('ujian')
    .select('id')
    .eq('created_by', userId)
    .eq('status', 'aktif')

  return {
    data: result.data,
    user: { nama: null, username: '', role: "guru" },
    ujianIds: activeUjian ? activeUjian.map((u: { id: string }) => u.id) : []
  }
}

export default async function GuruDashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  const { data, ujianIds } = await getDashboardData(session.user.id)

  return (
    <GuruDashboardClient
      initialData={data}
      ujianIds={ujianIds}
      user={{
        nama: session.user.nama,
        username: session.user.username,
        role: "guru"
      }}
    />
  )
}