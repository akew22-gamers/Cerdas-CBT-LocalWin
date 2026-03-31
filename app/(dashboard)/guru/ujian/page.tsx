import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { UjianTable } from "@/components/ujian/UjianTable"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

async function getUjianList(): Promise<{ ujian: Ujian[]; user: { nama: string; role: string } }> {
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
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching ujian:", error)
    return { ujian: [], user: { nama: guru?.nama || "Guru", role: "guru" } }
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
    user: { nama: guru?.nama || "Guru", role: "guru" }
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
          <Link href="/guru/ujian/create">
            <Button>Ujian Baru</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <UjianTable 
            data={ujian} 
            onDelete={() => {}}
            onToggle={() => {}}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
