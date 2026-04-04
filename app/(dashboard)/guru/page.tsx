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

async function getDashboardData(userId: string): Promise<{ data: DashboardData; ujianIds: string[] }> {
  const supabase = createAdminClient()

  // Semua query dijalankan PARALEL menggunakan Promise.all
  const [
    { data: kelasData },
    { data: siswaData },
    { data: ujianData },
    { data: recentHasil }
  ] = await Promise.all([
    supabase.from('kelas').select('id').eq('created_by', userId),
    supabase.from('siswa').select('id').eq('created_by', userId),
    supabase.from('ujian').select('id, status').eq('created_by', userId),
    supabase
      .from('hasil_ujian')
      .select(`
        id,
        nilai,
        waktu_selesai,
        siswa:siswa_id (
          nama,
          nisn
        ),
        ujian:ujian_id (
          judul
        )
      `)
      .eq('is_submitted', true)
      .order('waktu_selesai', { ascending: false })
      .limit(5)
  ])

  // Hitung dari data yang sudah ada — tidak perlu query ke-5 (duplikat)
  const ujianAktif = (ujianData || []).filter((u: any) => u.status === 'aktif')
  const activeUjianIds = ujianAktif.map((u: { id: string }) => u.id)

  const formattedRecentHasil = (recentHasil || []).map((h: any) => ({
    id: h.id,
    siswa_nama: h.siswa?.nama || '-',
    siswa_nisn: h.siswa?.nisn || '-',
    ujian_judul: h.ujian?.judul || '-',
    nilai: h.nilai,
    submitted_at: h.waktu_selesai
  }))

  return {
    data: {
      kelas_count: kelasData?.length || 0,
      siswa_count: siswaData?.length || 0,
      ujian_count: ujianData?.length || 0,
      ujian_aktif: ujianAktif.length,
      recent_hasil: formattedRecentHasil
    },
    ujianIds: activeUjianIds
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