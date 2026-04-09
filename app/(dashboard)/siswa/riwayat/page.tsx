import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { RiwayatCard } from "@/components/siswa/RiwayatCard"
import { History, AlertCircle } from "lucide-react"

async function getRiwayatUjian() {
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
    
    return (data?.recent_hasil || []).map((h: any) => ({
      id: h.id,
      ujian_id: h.ujian_id,
      ujian_judul: h.ujian_judul || '-',
      show_result: h.show_result,
      nilai: h.nilai,
      completed_at: h.completed_at,
      is_submitted: h.is_submitted
    }))
  } catch {
    return []
  }
}

export default async function SiswaRiwayatPage() {
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }
  
  if (session.user.role !== "siswa") {
    redirect("/login")
  }

  const riwayatList = await getRiwayatUjian()

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
            <History className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Riwayat Ujian</h1>
            <p className="text-gray-500 text-sm">Daftar ujian yang telah dikerjakan</p>
          </div>
        </div>

          {riwayatList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {riwayatList.map((hasil: {
                id: string
                ujian_id: string
                ujian_judul: string
                show_result: boolean
                nilai: number
                completed_at: string | null
                is_submitted: boolean
              }) => (
                <RiwayatCard
                  key={hasil.id}
                  id={hasil.id}
                  ujian_judul={hasil.ujian_judul}
                  nilai={hasil.nilai}
                  show_result={hasil.show_result}
                  completed_at={hasil.completed_at}
                />
              ))}
            </div>
          ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">Belum ada riwayat ujian</p>
              <p className="text-gray-400 text-sm mt-2 max-w-md">
                Anda belum mengerjakan ujian apapun. Silakan kerjakan ujian yang tersedia.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}