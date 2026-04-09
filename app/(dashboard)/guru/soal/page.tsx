import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { SoalTable } from "@/components/soal/SoalTable"
import { UjianFilter } from "@/components/soal/UjianFilter"
import { SoalActions } from "@/components/soal/SoalActions"
import { FileQuestion, AlertCircle } from "lucide-react"
import { UjianStatusToggle } from "@/components/ujian/UjianStatusToggle"

interface Soal {
  id: string
  ujian_id: string
  teks_soal: string
  gambar_url?: string | null
  jawaban_benar: string
  pengecoh_1: string
  pengecoh_2: string
  pengecoh_3?: string | null
  pengecoh_4?: string | null
  urutan: number
}

interface Ujian {
  id: string
  judul: string
  kode_ujian: string
  status: 'aktif' | 'nonaktif'
}

async function fetchData(ujian_id: string | null): Promise<{
  soal: Soal[]
  ujian: Ujian[]
  selectedUjianId: string | null
  ujianStatus: 'aktif' | 'nonaktif'
  user: { nama: string; username: string; role: string }
}> {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  try {
    const ujianRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/ujian`, { cache: 'no-store' })
    const { data: ujianData } = await ujianRes.json()
    const ujianList: Ujian[] = ujianData?.ujian || []

    let soal: Soal[] = []
    let ujianStatus: 'aktif' | 'nonaktif' = 'nonaktif'

    if (ujian_id) {
      const soalRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/soal?ujian_id=${ujian_id}`, { cache: 'no-store' })
      const { data: soalData } = await soalRes.json()
      soal = soalData?.soal || []
      ujianStatus = (soalData?.ujian_status as 'aktif' | 'nonaktif') || 'nonaktif'
    }

    return {
      soal,
      ujian: ujianList,
      selectedUjianId: ujian_id,
      ujianStatus,
      user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }
    }
  } catch {
    return {
      soal: [],
      ujian: [],
      selectedUjianId: ujian_id,
      ujianStatus: 'nonaktif',
      user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }
    }
  }
}

export default async function SoalListPage({ searchParams }: { searchParams: Promise<{ ujian_id?: string }> }) {
  const resolvedSearchParams = await searchParams
  const selectedUjianId = resolvedSearchParams.ujian_id || null
  const { soal, ujian, selectedUjianId: selectedId, ujianStatus, user } = await fetchData(selectedUjianId)

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/25">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manajemen Soal</h1>
              <p className="text-slate-500 mt-0.5">Kelola soal untuk ujian Anda</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <SoalActions 
                selectedUjianId={selectedUjianId} 
                ujianStatus={ujianStatus as 'aktif' | 'nonaktif'} 
              />
            </div>
            {!selectedUjianId && (
              <p className="text-xs text-slate-500 ml-2">Pilih ujian terlebih dahulu untuk menambah soal</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <UjianFilter ujianList={ujian} selectedUjianId={selectedUjianId} />
        </div>

        {!selectedUjianId ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Pilih ujian terlebih dahulu</p>
            <p className="text-sm text-slate-400 mt-1">Silakan pilih ujian dari dropdown di atas</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">
                    {ujian.find(u => u.id === selectedUjianId)?.judul}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {soal.length} soal
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <UjianStatusToggle 
                    ujianId={selectedUjianId} 
                    currentStatus={ujianStatus as 'aktif' | 'nonaktif'} 
                  />
                  {ujianStatus === 'aktif' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">
                        Edit & hapus dinonaktifkan
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <SoalTable
              data={soal}
              ujianStatus={ujianStatus as 'aktif' | 'nonaktif'}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}