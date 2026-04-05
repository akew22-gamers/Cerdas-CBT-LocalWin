"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Copy, ToggleRight, ToggleLeft, Search, FileText, Clock } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EditUjianDialog } from "./EditUjianDialog"
import { DetailUjianDialog } from "./DetailUjianDialog"
import { AssignKelasDialog } from "./AssignKelasDialog"

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

interface UjianTableProps {
  data: Ujian[]
  onDelete?: () => void
  onToggle?: () => void
}

export function UjianTable({ data, onDelete, onToggle }: UjianTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase()
    return data.filter(
      (ujian) =>
        ujian.judul.toLowerCase().includes(query) ||
        ujian.kode_ujian.toLowerCase().includes(query)
    )
  }, [data, searchQuery])

  const handleToggle = async (id: string, currentStatus: "aktif" | "nonaktif", judul: string) => {
    try {
      const newStatus = currentStatus === "aktif" ? "nonaktif" : "aktif"
      
      const response = await fetch(`/api/guru/ujian/${id}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || "Gagal mengubah status ujian")
        return
      }

      toast.success(`Ujian "${judul}" berhasil di${newStatus === "aktif" ? "aktifkan" : "nonaktifkan"}`)
      onToggle?.() || router.refresh()
    } catch (error) {
      console.error("Toggle error:", error)
      toast.error("Terjadi kesalahan saat mengubah status ujian")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/guru/ujian/${id}/duplicate`, {
        method: "POST",
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || "Gagal menduplikasi ujian")
        return
      }

      toast.success("Ujian berhasil diduplikasi")
      router.push(`/guru/ujian/${result.data.id}`)
    } catch (error) {
      console.error("Duplicate error:", error)
      toast.error("Terjadi kesalahan saat menduplikasi ujian")
    }
  }

  const handleDelete = async (id: string, judul: string) => {
    try {
      const response = await fetch(`/api/guru/ujian/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        if (result.error?.code === "UJIAN_ACTIVE") {
          toast.error(`Tidak dapat menghapus "${judul}" - ujian sedang aktif`)
        } else {
          toast.error(result.error?.message || "Gagal menghapus ujian")
        }
        return
      }

      toast.success("Ujian berhasil dihapus")
      onDelete?.() || router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Terjadi kesalahan saat menghapus ujian")
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-sm">Belum ada ujian</p>
        <p className="text-gray-400 text-xs mt-1">
          Klik tombol "Ujian Baru" untuk membuat ujian pertama Anda
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari berdasarkan nama ujian atau kode ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {searchQuery && (
        <p className="text-sm text-gray-500 mb-4">
          Menampilkan {filteredData.length} dari {data.length} ujian
        </p>
      )}

      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((ujian) => (
            <div
              key={ujian.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {ujian.kode_ujian}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ujian.status === "aktif"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ujian.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate" title={ujian.judul}>
                      {ujian.judul}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-blue-500 uppercase font-medium">Durasi</p>
                      <p className="text-sm font-semibold text-blue-700">{ujian.durasi} menit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-amber-500 uppercase font-medium">Soal</p>
                      <p className="text-sm font-semibold text-amber-700">{ujian.jumlah_soal}</p>
                    </div>
                  </div>
                </div>

                {ujian.kelas.length > 0 && (
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <p className="text-[10px] text-emerald-500 uppercase font-medium mb-1">Kelas ({ujian.kelas.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {ujian.kelas.map((k) => (
                        <span
                          key={k.id}
                          className="text-xs bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-200"
                        >
                          {k.nama_kelas}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                    <DetailUjianDialog ujian={ujian} />
                    <AssignKelasDialog
                      ujianId={ujian.id}
                      initialKelas={ujian.kelas}
                      onAssignSuccess={() => router.refresh()}
                    />
                    <EditUjianDialog ujian={ujian} onUpdated={onDelete || onToggle} />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(ujian.id, ujian.status, ujian.judul)}
                      className={`gap-1 ${ujian.status === "aktif" ? "border-orange-200 text-orange-600 hover:bg-orange-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
                    >
                      {ujian.status === "aktif" ? (
                        <>
                          <ToggleLeft className="h-4 w-4" />
                          <span>Off</span>
                        </>
                      ) : (
                        <>
                          <ToggleRight className="h-4 w-4" />
                          <span>On</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(ujian.id)}
                      className="gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            disabled={ujian.status === "aktif"}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Hapus</span>
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Ujian</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus ujian "
                            <span className="font-semibold text-foreground">
                              {ujian.judul}
                            </span>
                            "? Semua soal akan ikut terhapus. Aksi ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(ujian.id, ujian.judul)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Tidak ada hasil</p>
          <p className="text-gray-400 text-sm mt-1">
            Tidak ditemukan ujian dengan kata kunci "{searchQuery}"
          </p>
        </div>
      )}
    </>
  )
}