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
import { Pencil, Trash2, KeyRound } from "lucide-react"
import { ResetPasswordDialog } from "./ResetPasswordDialog"

interface Guru {
  id: string
  username: string
  nama: string
  created_at: string
}

interface GuruTableProps {
  guruList: Guru[]
  onRefresh: () => void
}

export function GuruTable({ guruList, onRefresh }: GuruTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedGuru, setSelectedGuru] = React.useState<Guru | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleEdit = (guru: Guru) => {
    router.push(`/admin/guru/${guru.id}/edit`)
  }

  const handleDeleteClick = (guru: Guru) => {
    setSelectedGuru(guru)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedGuru) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/guru/${selectedGuru.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || "Gagal menghapus guru")
      }

      toast.success("Guru berhasil dihapus")
      onRefresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menghapus guru"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedGuru(null)
    }
  }

  const handlePasswordReset = () => {
    onRefresh()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-48">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guruList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada data guru
                </TableCell>
              </TableRow>
            ) : (
              guruList.map((guru, index) => (
                <TableRow key={guru.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{guru.username}</TableCell>
                  <TableCell>{guru.nama}</TableCell>
                  <TableCell>{formatDate(guru.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(guru)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ResetPasswordDialog
                        guruId={guru.id}
                        guruNama={guru.nama}
                        onPasswordReset={handlePasswordReset}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(guru)}
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
            <AlertDialogTitle>Hapus Guru</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus guru {selectedGuru?.nama}?
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
