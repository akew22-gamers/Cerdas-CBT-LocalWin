import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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

async function getDashboardData(): Promise<{ data: DashboardData; user: { nama: string; role: string }; ujianIds: string[] }> {
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

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/guru/dashboard`, {
    headers: {
      'Cookie': (await supabase.auth.getSession()).data.session ? `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}` : ''
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
      user: { nama: guru?.nama || "Guru", role: "guru" },
      ujianIds: []
    }
  }

  const result = await response.json()

  const { data: activeUjian } = await supabase
    .from('ujian')
    .select('id')
    .eq('created_by', user.id)
    .eq('status', 'aktif')

  return {
    data: result.data,
    user: { nama: guru?.nama || "Guru", role: "guru" },
    ujianIds: activeUjian ? activeUjian.map((u: any) => u.id) : []
  }
}

export default async function GuruDashboardPage() {
  const { data, user, ujianIds } = await getDashboardData()

  return (
    <GuruDashboardClient initialData={data} ujianIds={ujianIds} user={user} />
  )
}
