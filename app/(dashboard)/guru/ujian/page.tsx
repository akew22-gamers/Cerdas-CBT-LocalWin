import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { UjianTable } from "@/components/ujian/UjianTable"
import { AddUjianDialog } from "@/components/ujian/AddUjianDialog"

interface Kelas {
  id: string
  nama_kelas: string
}

interface Ujian {
  id: string
  kode_ujian: string
  judul: string
  durasi: number
  jumlah_opsi: number
  status: "aktif" | "nonaktif"
  show_result: boolean
  created_at: string
  kelas: Kelas[]
  jumlah_soal: number
}

async function getUjianList(): Promise<{ ujian: Ujian[]; user: { nama: string; username: string; role: string } }> {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  const supabase = createAdminClient()

  const { data: ujianList, error } = await supabase
    .from("ujian")
    .select(`
      id,
      kode_ujian,
      judul,
      durasi,
      jumlah_opsi,
      status,
      show_result,
      created_at,
      ujian_kelas(kelas_id, kelas(nama_kelas)),
      soal_count:soal(count)
    `)
    .eq("created_by", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching ujian:", error)
    return { ujian: [], user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" } }
  }

  const formattedUjian: Ujian[] = ujianList.map((u: any) => {
    const kelasMap = new Map()
    u.ujian_kelas?.forEach((uk: any) => {
      if (uk.kelas) {
        kelasMap.set(uk.kelas_id, {
          id: uk.kelas_id,
          nama_kelas: uk.kelas.nama_kelas
        })
      }
    })

    return {
      id: u.id,
      kode_ujian: u.kode_ujian,
      judul: u.judul,
      durasi: u.durasi,
      jumlah_opsi: u.jumlah_opsi,
      status: u.status,
      show_result: u.show_result,
      created_at: u.created_at,
      kelas: Array.from(kelasMap.values()),
      jumlah_soal: u.soal_count?.[0]?.count || 0
    }
  })

  return {
    ujian: formattedUjian,
    user: { nama: session.user.nama || "Guru", username: session.user.username, role: "guru" }
  }
}

export default async function UjianListPage() {
  const { ujian, user } = await getUjianList()

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Ujian</h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola ujian dan tugaskan ke kelas
            </p>
          </div>
          <AddUjianDialog />
        </div>

        <UjianTable data={ujian} />
      </div>
    </DashboardLayout>
  )
}