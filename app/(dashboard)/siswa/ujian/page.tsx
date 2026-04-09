import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { UjianCard } from "@/components/siswa/UjianCard"
import { BookOpen, AlertCircle } from "lucide-react"

async function getAvailableUjian() {
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }
  
  if (session.user.role !== "siswa") {
    redirect("/login")
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/siswa/dashboard`, { cache: 'no-store' })
    const { data } = await res.json()
    
    return (data?.available_ujian || []).map((u: any) => ({
      id: u.id,
      kode_ujian: u.kode_ujian,
      judul: u.judul,
      durasi: u.durasi,
      show_result: u.show_result,
      jumlah_soal: u.jumlah_soal || 0
    }))
  } catch {
    return []
  }
}

export default async function SiswaUjianPage() {
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }
  
  if (session.user.role !== "siswa") {
    redirect("/login")
  }

  const ujianList = await getAvailableUjian()

  const user = {
    nama: session.user.nama || "Siswa",
    username: session.user.username,
    role: "siswa"
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ujian Tersedia</h1>
            <p className="text-gray-500 text-sm">Daftar ujian yang dapat dikerjakan</p>
          </div>
        </div>

          {ujianList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ujianList.map((ujian: {
                id: string
                kode_ujian: string
                judul: string
                durasi: number
                show_result: boolean
                jumlah_soal: number
              }) => (
                <UjianCard
                  key={ujian.id}
                  id={ujian.id}
                  kode_ujian={ujian.kode_ujian}
                  judul={ujian.judul}
                  durasi={ujian.durasi}
                  jumlah_soal={ujian.jumlah_soal}
                />
              ))}
            </div>
          ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">Tidak ada ujian tersedia</p>
              <p className="text-gray-400 text-sm mt-2 max-w-md">
                Belum ada ujian aktif untuk kelas Anda atau semua ujian sudah dikerjakan
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}