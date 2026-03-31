"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface KelasFormProps {
  mode: "create" | "edit"
  initialData?: {
    id?: string
    nama_kelas: string
  }
}

export function KelasForm({ mode, initialData }: KelasFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [namaKelas, setNamaKelas] = useState(initialData?.nama_kelas || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaKelas.trim()) {
      toast.error("Nama kelas harus diisi")
      return
    }

    setIsLoading(true)

    try {
      const url =
        mode === "create"
          ? "/api/guru/kelas"
          : `/api/guru/kelas/${initialData?.id}`

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_kelas: namaKelas.trim(),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || "Terjadi kesalahan")
        return
      }

      toast.success(
        mode === "create" ? "Kelas berhasil dibuat" : "Kelas berhasil diupdate"
      )
      router.push("/guru/kelas")
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
        <Label htmlFor="nama_kelas">Nama Kelas</Label>
        <Input
          id="nama_kelas"
          type="text"
          placeholder="Contoh: X IPA 1"
          value={namaKelas}
          onChange={(e) => setNamaKelas(e.target.value)}
          className="max-w-md"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">
          Masukkan nama kelas yang jelas dan mudah dikenali
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Menyimpan..."
            : mode === "create"
            ? "Buat Kelas"
            : "Simpan Perubahan"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/guru/kelas")}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}
