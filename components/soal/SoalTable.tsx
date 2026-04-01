'use client'

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
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MathRenderer } from "./MathRenderer"
import { Card, CardContent } from "@/components/ui/card"

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

interface SoalTableProps {
  data: Soal[]
  ujianStatus: 'aktif' | 'nonaktif'
  onDelete?: () => void
}

export function SoalTable({ data, ujianStatus, onDelete }: SoalTableProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = async (id: string, previewText: string) => {
    if (ujianStatus === 'aktif') {
      toast.error('Tidak dapat menghapus soal karena ujian sedang aktif')
      return
    }

    try {
      const response = await fetch(`/api/guru/soal/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || 'Gagal menghapus soal')
        return
      }

      toast.success('Soal berhasil dihapus')
      onDelete?.() || router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Terjadi kesalahan saat menghapus soal')
    }
  }

  const togglePreview = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500 text-sm">Belum ada soal</p>
        <p className="text-gray-400 text-xs mt-1">
          Klik tombol "Soal Baru" untuk membuat soal pertama Anda
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
              <TableHead className="w-24">Tipe</TableHead>
              <TableHead>Preview Soal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((soal, index) => (
              <TableRow key={soal.id}>
                <TableCell className="font-medium">{soal.urutan + 1}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                    PG
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {soal.teks_soal}
                    </div>
                    {soal.gambar_url && (
                      <div className="mt-1">
                        <img
                          src={soal.gambar_url}
                          alt="Soal image"
                          className="h-12 w-12 object-cover rounded"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => togglePreview(soal.id)}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {expandedId === soal.id ? (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Sembunyikan preview
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          Lihat preview lengkap
                        </>
                      )}
                    </button>
                    {expandedId === soal.id && (
                      <Card className="mt-2">
                        <CardContent className="p-3 bg-gray-50">
                          <div className="space-y-2">
                            <div className="prose prose-sm max-w-none">
                              <MathRenderer text={soal.teks_soal} block />
                            </div>
                            {soal.gambar_url && (
                              <img
                                src={soal.gambar_url}
                                alt="Soal image"
                                className="w-full max-w-md h-auto rounded"
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/guru/soal/${soal.id}/edit`)}
                      className="gap-1"
                      disabled={ujianStatus === 'aktif'}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            disabled={ujianStatus === 'aktif'}
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Soal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus soal ini? Aksi ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(soal.id, soal.teks_soal)}
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
        {data.map((soal, index) => (
          <div
            key={soal.id}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  #{soal.urutan + 1}
                </span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                  PG
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-900 line-clamp-2 mb-2">
              {soal.teks_soal}
            </div>
            {soal.gambar_url && (
              <img
                src={soal.gambar_url}
                alt="Soal image"
                className="h-16 w-16 object-cover rounded mb-2"
              />
            )}
            {expandedId === soal.id && (
              <Card className="mb-3">
                <CardContent className="p-3 bg-gray-50">
                  <div className="space-y-2">
                    <div className="prose prose-sm max-w-none">
                      <MathRenderer text={soal.teks_soal} block />
                    </div>
                    {soal.gambar_url && (
                      <img
                        src={soal.gambar_url}
                        alt="Soal image"
                        className="w-full max-w-md h-auto rounded"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => togglePreview(soal.id)}
                className="flex-1 text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 py-2"
              >
                {expandedId === soal.id ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    Preview
                  </>
                )}
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/guru/soal/${soal.id}/edit`)}
                className="flex-1 gap-1"
                disabled={ujianStatus === 'aktif'}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 gap-1"
                      disabled={ujianStatus === 'aktif'}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Soal</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus soal ini? Aksi ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(soal.id, soal.teks_soal)}
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
