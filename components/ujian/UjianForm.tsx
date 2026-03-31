"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UjianFormProps {
  mode: "create" | "edit"
  initialData?: {
    id?: string
    judul: string
    durasi: number
    jumlah_opsi: 4 | 5
    show_result: boolean
  }
}

export function UjianForm({ mode, initialData }: UjianFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [judul, setJudul] = useState(initialData?.judul || "")
  const [durasi, setDurasi] = useState(initialData?.durasi?.toString() || "")
  const [jumlahOpsi, setJumlahOpsi] = useState<"4" | "5">(initialData?.jumlah_opsi?.toString() as "4" | "5" || "4")
  const [showResult, setShowResult] = useState(initialData?.show_result ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!judul.trim()) {
      toast.error("Judul ujian harus diisi")
      return
    }

    const durasiNum = parseInt(durasi, 10)
    if (!durasi || isNaN(durasiNum) || durasiNum < 1) {
      toast.error("Durasi ujian harus minimal 1 menit")
      return
    }

    setIsLoading(true)

    try {
      const url = mode === "create" ? "/api/guru/ujian" : `/api/guru/ujian/${initialData?.id}`

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          judul: judul.trim(),
          durasi: durasiNum,
          jumlah_opsi: parseInt(jumlahOpsi, 10),
          show_result: showResult,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || "Terjadi kesalahan")
        return
      }

      toast.success(
        mode === "create" ? "Ujian berhasil dibuat" : "Ujian berhasil diupdate"
      )
      
      if (mode === "create") {
        router.push(`/guru/ujian/${result.data.id}/edit`)
      } else {
        router.push("/guru/ujian")
      }
      router.refresh()
    } catch (error) {
      console.error("Form error:", error)
      toast.error("Terjadi kesalahan pada server")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="judul">Judul Ujian</Label>
        <Input
          id="judul"
          type="text"
          placeholder="Contoh: Ujian Matematika Bab 1 - Persamaan Linear"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="max-w-md"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="durasi">Durasi (menit)</Label>
        <Input
          id="durasi"
          type="number"
          placeholder="Contoh: 60"
          value={durasi}
          onChange={(e) => setDurasi(e.target.value)}
          className="max-w-md"
          min="1"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jumlah_opsi">Jumlah Opsi Jawaban</Label>
        <Select
          value={jumlahOpsi}
          onValueChange={(value) => value && setJumlahOpsi(value as "4" | "5")}
        >
          <SelectTrigger id="jumlah_opsi" className="max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 Opsi (A, B, C, D)</SelectItem>
            <SelectItem value="5">5 Opsi (A, B, C, D, E)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showResult}
            onChange={(e) => setShowResult(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            disabled={isLoading}
          />
          <span>Tampilkan hasil ujian kepada siswa setelah selesai</span>
        </Label>
        <p className="text-xs text-gray-500">
          Jika dicentang, siswa dapat melihat nilai mereka setelahsubmit ujian
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Menyimpan..."
            : mode === "create"
            ? "Buat Ujian"
            : "Simpan Perubahan"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/guru/ujian")}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}
