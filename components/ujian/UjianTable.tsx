"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import { Pencil, Trash2, Copy, ToggleRight, ToggleLeft, Users } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead className="text-center">Durasi</TableHead>
              <TableHead className="text-center">Soal</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((ujian) => (
              <TableRow key={ujian.id}>
                <TableCell className="font-medium">{data.findIndex(u => u.id === ujian.id) + 1}</TableCell>
                <TableCell className="font-mono text-sm">{ujian.kode_ujian}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{ujian.judul}</p>
                    {ujian.kelas.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {ujian.kelas.length} kelas
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                    {ujian.durasi} mnt
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-sm font-medium">
                    {ujian.jumlah_soal}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      ujian.status === "aktif"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ujian.status === "aktif" ? "Aktif" : "Nonaktif"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/guru/ujian/${ujian.id}`)}
                      className="gap-1"
                      title="Lihat Detail"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/guru/ujian/${ujian.id}/edit`)}
                      className="gap-1"
                      disabled={ujian.status === "aktif"}
                      title={ujian.status === "aktif" ? "Nonaktifkan ujian terlebih dahulu untuk edit" : "Edit"}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(ujian.id, ujian.status, ujian.judul)}
                      className="gap-1"
                    >
                      {ujian.status === "aktif" ? (
                        <ToggleLeft className="h-4 w-4" />
                      ) : (
                        <ToggleRight className="h-4 w-4" />
                      )}
                      {ujian.status === "aktif" ? "Nonaktif" : "Aktif"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(ujian.id)}
                      className="gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Duplikat
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            disabled={ujian.status === "aktif"}
                            title={ujian.status === "aktif" ? "Nonaktifkan ujian terlebih dahulu untuk hapus" : "Hapus"}
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {data.map((ujian) => (
          <div
            key={ujian.id}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {ujian.kode_ujian}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ujian.status === "aktif"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ujian.status === "aktif" ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{ujian.judul}</h3>
                {ujian.kelas.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{ujian.kelas.length} kelas</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mb-3 text-sm">
              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                {ujian.durasi} menit
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium">
                {ujian.jumlah_soal} soal
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guru/ujian/${ujian.id}`)}
                className="flex-1 gap-1 min-w-[45%]"
              >
                <Users className="h-4 w-4" />
                Detail
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guru/ujian/${ujian.id}/edit`)}
                className="flex-1 gap-1 min-w-[45%]"
                disabled={ujian.status === "aktif"}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggle(ujian.id, ujian.status, ujian.judul)}
                className="flex-1 gap-1 min-w-[45%]"
              >
                {ujian.status === "aktif" ? (
                  <ToggleLeft className="h-4 w-4" />
                ) : (
                  <ToggleRight className="h-4 w-4" />
                )}
                {ujian.status === "aktif" ? "Nonaktif" : "Aktif"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate(ujian.id)}
                className="flex-1 gap-1 min-w-[45%]"
              >
                <Copy className="h-4 w-4" />
                Duplikat
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 gap-1 min-w-[45%]"
                      disabled={ujian.status === "aktif"}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
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
                      "? Aksi ini tidak dapat dibatalkan.
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
        ))}
      </div>
    </>
  )
}
