import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { AssignKelasDialog } from "@/components/ujian/AssignKelasDialog"
import Link from "next/link"
import {
  Clock,
  FileText,
  Users,
  ToggleLeft,
  ToggleRight,
  Copy,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle
} from "lucide-react"

async function getUjianDetail(id: string) {
  const session = await getSession()

  if (!session) {
    return null
  }

  if (session.user.role !== "guru") {
    return null
  }

  try {
    const ujianRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/ujian/${id}`, { cache: 'no-store' })
    const { data: ujianData } = await ujianRes.json()
    
    if (!ujianData) {
      return null
    }

    const soalRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/soal?ujian_id=${id}`, { cache: 'no-store' })
    const { data: soalData } = await soalRes.json()
    const soal = (soalData?.soal || []).map((s: any) => ({
      id: s.id,
      teks_soal: s.teks_soal,
      urutan: s.urutan
    }))

    return {
      ujian: ujianData,
      soal,
      user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }
    }
  } catch {
    return null
  }
}

export default async function UjianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getUjianDetail(id)

  if (!data) {
    redirect("/guru/ujian")
  }

  const { ujian, soal, user } = data

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/guru/ujian">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ujian.judul}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Kode: <span className="font-mono font-medium">{ujian.kode_ujian}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Durasi</p>
                <p className="text-lg font-semibold">{ujian.durasi} menit</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Jumlah Soal</p>
                <p className="text-lg font-semibold">{ujian.jumlah_soal}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Kelas</p>
                <p className="text-lg font-semibold">{ujian.kelas.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${ujian.status === "aktif" ? "bg-green-100" : "bg-gray-100"}`}>
                {ujian.status === "aktif" ? (
                  <CheckCircle className="h-5 w-5 text-green-700" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-700" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-semibold capitalize">{ujian.status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Informasi Ujian</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Kode Ujian</dt>
                <dd className="text-base font-mono font-medium">{ujian.kode_ujian}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Jumlah Opsi</dt>
                <dd className="text-base font-medium">{ujian.jumlah_opsi} pilihan</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Tampilkan Hasil</dt>
                <dd className="text-base font-medium flex items-center gap-2">
                  {ujian.show_result ? (
                    <span className="text-green-700">Ya</span>
                  ) : (
                    <span className="text-gray-700">Tidak</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="text-base">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    ujian.status === "aktif"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {ujian.status === "aktif" ? "Aktif" : "Nonaktif"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Kelas yang Ditugaskan</h2>
                {ujian.kelas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">Belum ada kelas yang ditugaskan</p>
                    <AssignKelasDialog ujianId={ujian.id} onAssignSuccess={() => {}} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ujian.kelas.map((k: { id: string; nama_kelas: string }) => (
                      <div key={k.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium">{k.nama_kelas}</span>
                      </div>
                    ))}
                    <div className="pt-3">
                      <AssignKelasDialog ujianId={ujian.id} onAssignSuccess={() => {}} />
                    </div>
                  </div>
                )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Daftar Soal</h2>
            <Link href={`/guru/soal?ujian_id=${id}`}>
              <Button>Kelola Soal</Button>
            </Link>
          </div>
          {soal.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Belum ada soal untuk ujian ini</p>
              <p className="text-xs text-gray-400 mt-1">Klik "Kelola Soal" untuk menambahkan soal</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {soal.map((s: { id: string; teks_soal: string; urutan: number }, index: number) => (
                <div key={s.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-medium">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 line-clamp-2">{s.teks_soal}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}