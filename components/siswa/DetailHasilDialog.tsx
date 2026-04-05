"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Calendar,
  Clock,
  PlayCircle,
  StopCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  Loader2,
  AlertCircle,
  PartyPopper
} from "lucide-react"

interface DetailHasilDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasilId: string
}

interface HasilDetail {
  id: string
  ujian_judul: string
  durasi: number
  nilai: number | null
  jumlah_benar: number
  jumlah_salah: number
  total_soal: number
  waktu_mulai: string
  waktu_selesai: string | null
  show_result: boolean
  is_submitted: boolean
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDuration(startTime: string, endTime: string | null, maxDuration: number): string {
  if (!endTime) return '-'
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffSeconds = Math.floor((diffMs % 60000) / 1000)

  if (diffMinutes >= maxDuration) {
    return `${maxDuration} menit`
  }

  if (diffMinutes > 0) {
    return `${diffMinutes} menit ${diffSeconds} detik`
  }
  return `${diffSeconds} detik`
}

export function DetailHasilDialog({ open, onOpenChange, hasilId }: DetailHasilDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<HasilDetail | null>(null)

  React.useEffect(() => {
    if (open && hasilId) {
      fetchDetail()
    }
  }, [open, hasilId])

  const fetchDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/siswa/hasil/${hasilId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Gagal mengambil data')
      }

      setData(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getGradeColor = (nilai: number): string => {
    if (nilai >= 85) return 'text-emerald-600'
    if (nilai >= 70) return 'text-blue-600'
    if (nilai >= 55) return 'text-amber-600'
    return 'text-red-600'
  }

  const getGradeBgColor = (nilai: number): string => {
    if (nilai >= 85) return 'bg-emerald-100'
    if (nilai >= 70) return 'bg-blue-100'
    if (nilai >= 55) return 'bg-amber-100'
    return 'bg-red-100'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-500" />
            Detail Hasil Ujian
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchDetail}>
              Coba Lagi
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-5 py-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h3 className="font-semibold text-lg text-slate-900 mb-2">
                {data.ujian_judul}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>Durasi: {data.durasi} menit</span>
              </div>
            </div>

            {data.show_result ? (
              <>
                <div className="flex items-center justify-center py-4">
                  <div className={`flex flex-col items-center gap-2 px-8 py-6 rounded-2xl ${getGradeBgColor(data.nilai || 0)}`}>
                    <Trophy className={`h-8 w-8 ${getGradeColor(data.nilai || 0)}`} />
                    <span className={`text-4xl font-bold ${getGradeColor(data.nilai || 0)}`}>
                      {Math.round(data.nilai || 0)}
                    </span>
                    <span className="text-sm text-slate-600">Nilai</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">Jawaban Benar</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">
                      {data.jumlah_benar}
                    </p>
                    <p className="text-xs text-emerald-500 mt-1">
                      dari {data.total_soal} soal
                    </p>
                  </div>

                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">Jawaban Salah</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      {data.jumlah_salah}
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      dari {data.total_soal} soal
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Tanggal Ujian</p>
                      <p className="font-medium text-slate-900">
                        {formatDate(data.waktu_mulai)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <PlayCircle className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Waktu Mulai</p>
                      <p className="font-medium text-slate-900">
                        {formatTime(data.waktu_mulai)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <StopCircle className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Waktu Selesai</p>
                      <p className="font-medium text-slate-900">
                        {formatTime(data.waktu_selesai)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Waktu Pengerjaan</p>
                      <p className="font-medium text-slate-900">
                        {formatDuration(data.waktu_mulai, data.waktu_selesai, data.durasi)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <PartyPopper className="h-12 w-12 text-emerald-600" />
                  <h4 className="text-lg font-semibold text-emerald-800">
                    Terima Kasih!
                  </h4>
                  <p className="text-sm text-emerald-700 max-w-xs">
                    Anda telah menyelesaikan ujian <strong>{data.ujian_judul}</strong> dengan baik.
                  </p>
                  <p className="text-xs text-emerald-600">
                    Hasil ujian tidak ditampilkan oleh guru.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}