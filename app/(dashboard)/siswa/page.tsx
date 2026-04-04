import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UjianCard } from "@/components/siswa/UjianCard"
import { RiwayatCard } from "@/components/siswa/RiwayatCard"
import { CheckCircle, TrendingUp, AlertCircle } from "lucide-react"

interface DashboardData {
  siswa_nama: string
  siswa_nisn: string
  total_ujian_selesai: number
  rata_rata_nilai: number
  available_ujian: Array<{
    id: string
    kode_ujian: string
    judul: string
    durasi: number
    show_result: boolean
  }>
  recent_hasil: Array<{
    id: string
    ujian_id: string
    ujian_judul: string
    show_result: boolean
    nilai: number
    completed_at: string | null
    is_submitted: boolean
  }>
}

async function getDashboardData(siswaId: string): Promise<DashboardData> {
  const supabase = createAdminClient()

  // Query 1: Ambil data siswa
  const { data: siswa } = await supabase
    .from('siswa')
    .select('id, nama, nisn, kelas_id')
    .eq('id', siswaId)
    .single()

  if (!siswa) {
    return {
      siswa_nama: "Siswa",
      siswa_nisn: "",
      total_ujian_selesai: 0,
      rata_rata_nilai: 0,
      available_ujian: [],
      recent_hasil: []
    }
  }

  // Queries 2, 3, 4 dijalankan PARALEL — semua tidak bergantung satu sama lain
  const [
    { data: hasilData },
    { data: ujianKelas },
    { data: recentHasil }
  ] = await Promise.all([
    supabase
      .from('hasil_ujian')
      .select('nilai, ujian_id')
      .eq('siswa_id', siswaId)
      .eq('is_submitted', true),
    supabase
      .from('ujian_kelas')
      .select('ujian_id')
      .eq('kelas_id', siswa.kelas_id),
    supabase
      .from('hasil_ujian')
      .select(`
        id,
        nilai,
        waktu_selesai,
        is_submitted,
        ujian:ujian_id (
          id,
          judul,
          show_result
        )
      `)
      .eq('siswa_id', siswaId)
      .eq('is_submitted', true)
      .order('waktu_selesai', { ascending: false })
      .limit(5)
  ])

  const totalUjianSelesai = hasilData?.length || 0
  const rataRataNilai = totalUjianSelesai > 0 && hasilData
    ? Math.round(hasilData.reduce((sum, h) => sum + Number(h.nilai), 0) / totalUjianSelesai)
    : 0

  // Hitung ujian tersedia: dari ujian kelas, filter yang sudah selesai
  const completedIds = new Set((hasilData || []).map(h => h.ujian_id))
  const ujianIds = (ujianKelas || []).map(uk => uk.ujian_id).filter(id => !completedIds.has(id))

  // Query 5: Ambil detail ujian yang tersedia (bergantung pada ujianIds)
  const { data: availableUjian } = ujianIds.length > 0
    ? await supabase
        .from('ujian')
        .select('id, kode_ujian, judul, durasi, show_result')
        .in('id', ujianIds)
        .eq('status', 'aktif')
    : { data: [] }

  const formattedAvailableUjian = (availableUjian || []).map((u: any) => ({
    id: u.id,
    kode_ujian: u.kode_ujian,
    judul: u.judul,
    durasi: u.durasi,
    show_result: u.show_result
  }))

  const formattedRecentHasil = (recentHasil || []).map((h: any) => ({
    id: h.id,
    ujian_id: h.ujian?.id,
    ujian_judul: h.ujian?.judul || '-',
    show_result: h.ujian?.show_result ?? false,
    nilai: h.nilai,
    completed_at: h.waktu_selesai,
    is_submitted: h.is_submitted
  }))

  return {
    siswa_nama: siswa.nama,
    siswa_nisn: siswa.nisn || "",
    total_ujian_selesai: totalUjianSelesai,
    rata_rata_nilai: rataRataNilai,
    available_ujian: formattedAvailableUjian,
    recent_hasil: formattedRecentHasil
  }
}

export default async function SiswaDashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }
  
  if (session.user.role !== "siswa") {
    redirect("/login")
  }

  const data = await getDashboardData(session.user.id)

  const user = {
    nama: session.user.nama || "Siswa",
    username: session.user.username,
    role: "siswa"
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Siswa</h1>
          <p className="text-gray-500 text-sm mt-1">
            Selamat datang, {data.siswa_nama}
          </p>
          {data.siswa_nisn && (
            <p className="text-gray-400 text-sm">NISN: {data.siswa_nisn}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ujian Selesai</p>
                  <p className="text-2xl font-bold text-gray-900">{data.total_ujian_selesai}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rata-rata Nilai</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.rata_rata_nilai > 0 ? `${data.rata_rata_nilai}` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Ujian Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ujian Tersedia</h2>
          {data.available_ujian.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.available_ujian.map((ujian) => (
                <UjianCard
                  key={ujian.id}
                  id={ujian.id}
                  kode_ujian={ujian.kode_ujian}
                  judul={ujian.judul}
                  durasi={ujian.durasi}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Tidak ada ujian tersedia</p>
                <p className="text-gray-400 text-sm mt-1">
                  Belum ada ujian aktif untuk kelas Anda atau semua ujian sudah dikerjakan
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Riwayat Ujian Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Ujian</h2>
          {data.recent_hasil.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.recent_hasil.map((hasil) => (
                <RiwayatCard
                  key={hasil.id}
                  ujian_judul={hasil.ujian_judul}
                  nilai={hasil.nilai}
                  show_result={hasil.show_result}
                  completed_at={hasil.completed_at}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Belum ada riwayat ujian</p>
                <p className="text-gray-400 text-sm mt-1">
                  Anda belum mengerjakan ujian apapun
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
