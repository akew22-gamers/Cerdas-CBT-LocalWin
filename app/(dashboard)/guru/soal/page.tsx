import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { SoalTable } from "@/components/soal/SoalTable"
import { UjianFilter } from "@/components/soal/UjianFilter"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload } from "lucide-react"

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

async function fetchData(searchParamsProps: { ujian_id?: string }): Promise<{
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

  const supabase = createAdminClient()

  const { data: ujianList } = await supabase
    .from("ujian")
    .select("id, judul, kode_ujian, status")
    .eq("created_by", session.user.id)
    .order("created_at", { ascending: false })

  const selectedUjianId = searchParamsProps.ujian_id || null

  let soal: Soal[] = []
  let ujianStatus: 'aktif' | 'nonaktif' = 'nonaktif'

  if (selectedUjianId) {
    const { data: soalData, error } = await supabase
      .from("soal")
      .select("*")
      .eq("ujian_id", selectedUjianId)
      .order("urutan", { ascending: true })

    if (!error && soalData) {
      soal = soalData
    }

    const { data: ujianData } = await supabase
      .from("ujian")
      .select("status")
      .eq("id", selectedUjianId)
      .eq("created_by", session.user.id)
      .single()

    if (ujianData) {
      ujianStatus = ujianData.status
    }
  }

  return {
    soal,
    ujian: ujianList || [],
    selectedUjianId,
    ujianStatus,
    user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }
  }
}

export default async function SoalListPage({ searchParams }: { searchParams: Promise<{ ujian_id?: string }> }) {
  const resolvedSearchParams = await searchParams
  const { soal, ujian, selectedUjianId, ujianStatus, user } = await fetchData(resolvedSearchParams)

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Soal</h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola soal untuk ujian Anda
            </p>
          </div>
          <div className="flex gap-2">
            {selectedUjianId && (
              <Link href={`/guru/soal/import?ujian_id=${selectedUjianId}`}>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import Excel
                </Button>
              </Link>
            )}
            <Link
              href={selectedUjianId ? `/guru/soal/create?ujian_id=${selectedUjianId}` : "/guru/soal/create"}
            >
              <Button className="gap-2">
                Soal Baru
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <UjianFilter ujianList={ujian} selectedUjianId={selectedUjianId} />
        </div>

        {!selectedUjianId ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center">
            <p className="text-gray-500 text-sm">Pilih ujian terlebih dahulu untuk melihat soal</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {ujian.find(u => u.id === selectedUjianId)?.judul}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {soal.length} soal • Status: {ujianStatus === 'aktif' ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
                {ujianStatus === 'aktif' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Edit & hapus dinonaktifkan saat ujian aktif
                  </span>
                )}
              </div>
            </div>
            <SoalTable
              data={soal}
              ujianStatus={ujianStatus}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}