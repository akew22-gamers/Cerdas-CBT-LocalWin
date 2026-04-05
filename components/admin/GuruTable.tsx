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
import { Pencil, Trash2, User, Calendar } from "lucide-react"
import { ResetPasswordDialog } from "./ResetPasswordDialog"
import { useState, useEffect } from "react"

interface Guru {
  id: string
  username: string
  nama: string
  created_at: string
}

interface GuruTableProps {
  guruList: Guru[]
  onRefresh?: () => void
}

export function GuruTable({ guruList, onRefresh }: GuruTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedGuru, setSelectedGuru] = React.useState<Guru | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      router.refresh()
    }
  }

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
      handleRefresh()
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
    handleRefresh()
  }

  const formatDate = (dateString: string) => {
    if (!isHydrated) return '-'
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
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="w-16 text-slate-600 font-semibold">No</TableHead>
              <TableHead className="text-slate-600 font-semibold">Username</TableHead>
              <TableHead className="text-slate-600 font-semibold">Nama</TableHead>
              <TableHead className="text-slate-600 font-semibold">Dibuat</TableHead>
              <TableHead className="w-48 text-slate-600 font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guruList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <User className="w-8 h-8 text-slate-300" />
                    <p>Belum ada data guru</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              guruList.map((guru, index) => (
                <TableRow key={guru.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-600">{index + 1}</TableCell>
                  <TableCell className="text-slate-900 font-medium">{guru.username}</TableCell>
                  <TableCell className="text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                        {guru.nama?.substring(0, 2).toUpperCase() || "GU"}
                      </div>
                      {guru.nama}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(guru.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(guru)}
                        title="Edit"
                        className="hover:bg-blue-50 hover:text-blue-600"
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
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
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
        <AlertDialogContent className="border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Hapus Guru</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Apakah Anda yakin ingin menghapus guru <span className="font-semibold text-slate-700">{selectedGuru?.nama}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-slate-200">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
