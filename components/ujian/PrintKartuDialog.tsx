"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Check, Users, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { pdf } from "@react-pdf/renderer"
import QRCode from "qrcode"
import { KartuUjianPDF } from "./KartuUjianPDF"
import type { KartuUjianData } from "@/types/kartu"

interface PrintKartuDialogProps {
  ujianId: string
  ujianJudul: string
  ujianKode: string
}

const DEFAULT_LOGO_URL = "/images/logo_kemendikdasmen.svg"

export function PrintKartuDialog({ ujianId, ujianJudul, ujianKode }: PrintKartuDialogProps) {
  const [open, setOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [students, setStudents] = useState<KartuUjianData[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchStudents()
    }
  }, [open])

  const fetchStudents = async () => {
    setIsFetching(true)
    setError(null)
    try {
      const response = await fetch(`/api/guru/ujian/${ujianId}/kartu`, {
        credentials: "include",
      })
      const result = await response.json()

      if (result.success) {
        setStudents(result.data)
        setSelectedIds(new Set(result.data.map((s: KartuUjianData) => s.siswa.id)))
      } else {
        setError(result.error?.message || "Gagal mengambil data siswa")
        toast.error(result.error?.message || "Gagal mengambil data siswa")
      }
    } catch (error) {
      console.error("Fetch students error:", error)
      setError("Terjadi kesalahan saat mengambil data siswa")
      toast.error("Terjadi kesalahan saat mengambil data siswa")
    } finally {
      setIsFetching(false)
    }
  }

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(students.map((s) => s.siswa.id)))
    }
  }

  const generateQRCode = async (loginUrl: string): Promise<string> => {
    try {
      const qrDataUrl = await QRCode.toDataURL(loginUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      })
      return qrDataUrl
    } catch (error) {
      console.error("QR generation error:", error)
      return ""
    }
  }

  const prepareLogoForPdf = (logoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!logoUrl) return resolve("");
      // React-PDF only supports PNG/JPG. If it's an SVG (Base64 or path), draw to canvas first.
      if (!logoUrl.includes('image/svg+xml') && !logoUrl.endsWith('.svg')) {
        return resolve(logoUrl);
      }
      
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width || 200;
        canvas.height = img.height || 200;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(logoUrl);
        }
      };
      img.onerror = () => resolve(logoUrl);
      img.src = logoUrl;
    });
  };

  const handleDownload = async () => {
    if (selectedIds.size === 0) {
      toast.error("Pilih minimal satu siswa untuk dicetak")
      return
    }

    setIsDownloading(true)
    const downloadToastId = toast.loading("Membuat QR code dan PDF kartu ujian...")

    try {
      const selectedStudents = students.filter((s) => selectedIds.has(s.siswa.id))

      const studentsWithQR = await Promise.all(
        selectedStudents.map(async (student) => {
          const qrDataUrl = await generateQRCode(student.loginUrl)
          
          let pngLogo = student.sekolah.logo_url;
          if (pngLogo) {
             pngLogo = await prepareLogoForPdf(pngLogo);
          } else {
             // Fallback to default logo
             pngLogo = await prepareLogoForPdf("/images/logo_kemendikdasmen.svg");
          }

          return {
            ...student,
            qrData: qrDataUrl,
            sekolah: {
              ...student.sekolah,
              logo_url: pngLogo
            }
          }
        })
      )

      const blob = await pdf(
        <KartuUjianPDF data={studentsWithQR} />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `kartu-ujian-${ujianKode}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      toast.dismiss(downloadToastId)
      toast.success(`Berhasil mengunduh PDF kartu ujian (${selectedIds.size} siswa)`)
      setOpen(false)
    } catch (error) {
      console.error("PDF generation error:", error)
      toast.dismiss(downloadToastId)
      toast.error("Gagal membuat PDF kartu ujian")
    } finally {
      setIsDownloading(false)
    }
  }

  const selectedCount = selectedIds.size
  const totalCount = students.length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1 bg-green-600 text-white hover:bg-green-700 border-green-700 hover:border-green-800"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Kartu</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cetak Kartu Ujian - {ujianJudul}</DialogTitle>
          <DialogDescription>
            Pilih siswa untuk dicetak kartu ujiannya
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Memuat data siswa...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <X className="w-10 h-10 text-destructive mb-3" />
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStudents}
                className="mt-4"
              >
                Coba Lagi
              </Button>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                Tidak ada siswa terdaftar di ujian ini
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pastikan sudah ada kelas yang ditugaskan ke ujian ini
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={toggleSelectAll}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors mb-2 bg-muted/50 hover:bg-muted border-border"
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    selectedCount === totalCount
                      ? "bg-primary border-primary"
                      : selectedCount > 0
                      ? "bg-primary/80 border-primary/80"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {selectedCount === totalCount ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : selectedCount > 0 ? (
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  ) : null}
                </div>
                <span className="text-sm font-medium">
                  Pilih Semua ({totalCount} siswa)
                </span>
              </button>

              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {students.map((student) => {
                  const isSelected = selectedIds.has(student.siswa.id)
                  return (
                    <button
                      key={student.siswa.id}
                      onClick={() => toggleStudent(student.siswa.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">
                          {student.siswa.nama}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {student.siswa.nisn} - {student.siswa.kelas?.nama_kelas || "-"}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedCount} siswa dipilih
                </span>
                {selectedCount > 0 && selectedCount < totalCount && (
                  <span className="text-xs text-muted-foreground">
                    dari {totalCount} total
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDownloading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={
              isDownloading ||
              isFetching ||
              students.length === 0 ||
              selectedCount === 0
            }
            className="gap-1"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <Printer className="h-4 w-4" />
                <span>Download PDF</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}