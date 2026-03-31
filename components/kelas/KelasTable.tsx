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
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Kelas {
  id: string
  nama_kelas: string
  jumlah_siswa: number
  created_at: string
}

interface KelasTableProps {
  data: Kelas[]
  onDelete: () => void
}

export function KelasTable({ data, onDelete }: KelasTableProps) {
  const router = useRouter()

  const handleDelete = async (id: string, namaKelas: string) => {
    try {
      const response = await fetch(`/api/guru/kelas/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        if (result.error?.code === "KELAS_HAS_SISWA") {
          toast.error(
            `Tidak dapat menghapus "${namaKelas}" - masih ada siswa di kelas ini`
          )
        } else {
          toast.error(result.error?.message || "Gagal menghapus kelas")
        }
        return
      }

      toast.success("Kelas berhasil dihapus")
      onDelete()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Terjadi kesalahan saat menghapus kelas")
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-sm">Belum ada kelas</p>
        <p className="text-gray-400 text-xs mt-1">
          Klik tombol "Kelas Baru" untuk membuat kelas pertama Anda
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
              <TableHead>Nama Kelas</TableHead>
              <TableHead className="text-center">Jumlah Siswa</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((kelas, index) => (
              <TableRow key={kelas.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{kelas.nama_kelas}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                    {kelas.jumlah_siswa}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/guru/kelas/${kelas.id}/edit`)}
                      className="gap-1"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger>
                        <Button variant="destructive" size="sm" className="gap-1">
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kelas "
                            <span className="font-semibold text-foreground">
                              {kelas.nama_kelas}
                            </span>
                            "? Aksi ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(kelas.id, kelas.nama_kelas)}
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
        {data.map((kelas, index) => (
          <div
            key={kelas.id}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    #{index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{kelas.nama_kelas}</h3>
              </div>
              <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                {kelas.jumlah_siswa} siswa
              </span>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guru/kelas/${kelas.id}/edit`)}
                className="flex-1 gap-1"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger>
                  <Button variant="destructive" size="sm" className="flex-1 gap-1">
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Kelas</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus kelas "
                      <span className="font-semibold text-foreground">
                        {kelas.nama_kelas}
                      </span>
                      "? Aksi ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(kelas.id, kelas.nama_kelas)}
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
