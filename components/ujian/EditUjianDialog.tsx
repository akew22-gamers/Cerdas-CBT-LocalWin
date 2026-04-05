"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil } from "lucide-react"

interface Ujian {
  id: string
  kode_ujian: string
  judul: string
  durasi: number
  jumlah_opsi: number
  show_result: boolean
  status: "aktif" | "nonaktif"
}

interface EditUjianDialogProps {
  ujian: Ujian
  onUpdated?: () => void
}

export function EditUjianDialog({ ujian, onUpdated }: EditUjianDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    judul: ujian.judul,
    durasi: ujian.durasi.toString(),
    jumlah_opsi: ujian.jumlah_opsi.toString() as "4" | "5",
    show_result: ujian.show_result,
  })

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        judul: ujian.judul,
        durasi: ujian.durasi.toString(),
        jumlah_opsi: ujian.jumlah_opsi.toString() as "4" | "5",
        show_result: ujian.show_result,
      })
    }
  }, [isOpen, ujian])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.judul.trim()) {
      toast.error("Judul ujian harus diisi")
      return
    }

    const durasiNum = parseInt(formData.durasi, 10)
    if (!formData.durasi || isNaN(durasiNum) || durasiNum < 1) {
      toast.error("Durasi ujian harus minimal 1 menit")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/guru/ujian/${ujian.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          judul: formData.judul.trim(),
          durasi: durasiNum,
          jumlah_opsi: parseInt(formData.jumlah_opsi, 10),
          show_result: formData.show_result,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || "Gagal mengupdate ujian")
        return
      }

      toast.success("Ujian berhasil diupdate")
      setIsOpen(false)
      onUpdated?.()
    } catch (error) {
      console.error("Update error:", error)
      toast.error("Terjadi kesalahan saat mengupdate ujian")
    } finally {
      setIsLoading(false)
    }
  }

  const isActive = ujian.status === "aktif"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={isActive}
          >
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Ujian</DialogTitle>
            <DialogDescription>
              Update informasi ujian. Kode ujian: <span className="font-mono font-medium">{ujian.kode_ujian}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_judul">Judul Ujian</Label>
              <Input
                id="edit_judul"
                type="text"
                placeholder="Contoh: Ujian Matematika Bab 1"
                value={formData.judul}
                onChange={(e) => setFormData(prev => ({ ...prev, judul: e.target.value }))}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_durasi">Durasi (menit)</Label>
              <Input
                id="edit_durasi"
                type="number"
                placeholder="Contoh: 60"
                value={formData.durasi}
                onChange={(e) => setFormData(prev => ({ ...prev, durasi: e.target.value }))}
                disabled={isLoading}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_jumlah_opsi">Jumlah Opsi Jawaban</Label>
              <Select
                value={formData.jumlah_opsi}
                onValueChange={(value: string | null) => setFormData(prev => ({ ...prev, jumlah_opsi: (value as "4" | "5") || "4" }))}
                disabled={isLoading}
              >
                <SelectTrigger id="edit_jumlah_opsi">
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
                  checked={formData.show_result}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_result: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={isLoading}
                />
                <span>Tampilkan hasil ujian kepada siswa setelah selesai</span>
              </Label>
              <p className="text-xs text-gray-500">
                Jika dicentang, siswa dapat melihat nilai mereka setelah submit ujian
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
