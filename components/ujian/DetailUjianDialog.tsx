"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Clock, HelpCircle, Users, Calendar, CheckCircle2, XCircle } from "lucide-react"

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

interface DetailUjianDialogProps {
  ujian: Ujian
}

export function DetailUjianDialog({ ujian }: DetailUjianDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isHydrated, setIsHydrated] = React.useState(false)

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])


  const formatDate = (dateString: string) => {
    if (!isHydrated) return "-"
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            <span>Detail</span>
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Ujian</DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang ujian
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Kode Ujian</p>
            <p className="font-mono text-lg font-semibold text-gray-900">{ujian.kode_ujian}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Judul</p>
            <p className="text-gray-900 font-medium">{ujian.judul}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Durasi</span>
              </div>
              <p className="text-lg font-semibold text-blue-900">{ujian.durasi} menit</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Jumlah Soal</span>
              </div>
              <p className="text-lg font-semibold text-purple-900">{ujian.jumlah_soal} soal</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Opsi Jawaban</span>
            <span className="font-medium">{ujian.jumlah_opsi} opsi (A{ujian.jumlah_opsi >= 4 ? ", B, C, D" : ""}{ujian.jumlah_opsi === 5 ? ", E" : ""})</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Status</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                ujian.status === "aktif"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {ujian.status === "aktif" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Aktif
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Nonaktif
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Tampilkan Hasil</span>
            <span className={`font-medium ${ujian.show_result ? "text-green-600" : "text-gray-500"}`}>
              {ujian.show_result ? "Ya" : "Tidak"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Kelas Terdaftar</span>
            </div>
            {ujian.kelas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {ujian.kelas.map((kelas) => (
                  <span
                    key={kelas.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700"
                  >
                    {kelas.nama_kelas}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Belum ada kelas terdaftar</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-500 text-sm pt-2">
            <Calendar className="h-4 w-4" />
            <span>Dibuat pada {formatDate(ujian.created_at)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
