import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
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

async function getDashboardData(): Promise<{ data: DashboardData; ujianIds: string[]; session: any }> {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/dashboard`, { cache: 'no-store' })
    const { data } = await res.json()
    
    return { 
      data: data || {
        kelas_count: 0,
        siswa_count: 0,
        ujian_count: 0,
        ujian_aktif: 0,
        recent_hasil: []
      },
      ujianIds: [],
      session
    }
  } catch {
    return { 
      data: {
        kelas_count: 0,
        siswa_count: 0,
        ujian_count: 0,
        ujian_aktif: 0,
        recent_hasil: []
      },
      ujianIds: [],
      session
    }
  }
}

export default async function GuruDashboardPage() {
  const { data, ujianIds, session } = await getDashboardData()

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