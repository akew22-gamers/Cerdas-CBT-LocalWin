"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2 } from "lucide-react"
import { ResetPasswordDialog } from "./ResetPasswordDialog"

interface Siswa {
  id: string
  nisn: string
  nama: string
  kelas: {
    id: string
    nama_kelas: string
  } | null
}

interface SiswaTableProps {
  siswaList: Siswa[]
  onRefresh: () => void
}

export function SiswaTable({ siswaList, onRefresh }: SiswaTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedSiswa, setSelectedSiswa] = React.useState<Siswa | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleEdit = (siswa: Siswa) => {
    router.push(`/guru/siswa/${siswa.id}/edit`)
  }

  const handleDeleteClick = (siswa: Siswa) => {
    setSelectedSiswa(siswa)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedSiswa) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/guru/siswa/${selectedSiswa.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || "Gagal menghapus siswa")
      }

      toast.success("Siswa berhasil dihapus")
      onRefresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus siswa"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedSiswa(null)
    }
  }

  const handlePasswordReset = () => {
    onRefresh()
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              <TableHead>NISN</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kelas</TableHead>
              <TableHead className="w-48">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {siswaList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada data siswa
                </TableCell>
              </TableRow>
            ) : (
              siswaList.map((siswa, index) => (
                <TableRow key={siswa.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{siswa.nisn}</TableCell>
                  <TableCell>{siswa.nama}</TableCell>
                  <TableCell>
                    {siswa.kelas?.nama_kelas || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(siswa)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ResetPasswordDialog
                        siswaId={siswa.id}
                        siswaNama={siswa.nama}
                        onPasswordReset={handlePasswordReset}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(siswa)}
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus siswa {selectedSiswa?.nama}?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
