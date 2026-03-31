"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Kelas {
  id: string
  nama_kelas: string
}

interface SiswaFormProps {
  initialData?: {
    id?: string
    nisn?: string
    nama?: string
    kelas_id?: string | null
  }
  kelasList: Kelas[]
  mode: "create" | "edit"
}

export function SiswaForm({ initialData, kelasList, mode }: SiswaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    nisn: initialData?.nisn || "",
    nama: initialData?.nama || "",
    password: "",
    kelas_id: initialData?.kelas_id || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = mode === "create" 
        ? "/api/guru/siswa" 
        : `/api/guru/siswa/${initialData?.id}`
      
      const method = mode === "create" ? "POST" : "PUT"
      
      const body: Record<string, string> = {
        nisn: formData.nisn,
        nama: formData.nama,
      }

      if (mode === "create") {
        body.password = formData.password
      }

      if (formData.kelas_id) {
        body.kelas_id = formData.kelas_id
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || "Terjadi kesalahan")
      }

      toast.success(
        mode === "create" 
          ? "Siswa berhasil ditambahkan" 
          : "Siswa berhasil diupdate"
      )

      router.push("/guru/siswa")
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, password: e.target.value }))
  }

  const handleNisnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, nisn: e.target.value }))
  }

  const handleNamaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, nama: e.target.value }))
  }

  const handleKelasChange = (value: string | null) => {
    setFormData(prev => ({ ...prev, kelas_id: value || "" }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nisn">NISN</Label>
          <Input
            id="nisn"
            name="nisn"
            type="text"
            placeholder="Masukkan NISN"
            value={formData.nisn}
            onChange={handleNisnChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Lengkap</Label>
          <Input
            id="nama"
            name="nama"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={formData.nama}
            onChange={handleNamaChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kelas">Kelas</Label>
          <Select
            value={formData.kelas_id}
            onValueChange={handleKelasChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {kelasList.length > 0 ? (
                kelasList.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.id}>
                    {kelas.nama_kelas}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  Belum ada kelas
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {mode === "create" ? "Password" : "Password Baru (opsional)"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={mode === "create" ? "Masukkan password" : "Kosongkan jika tidak ingin mengubah"}
            value={formData.password}
            onChange={handlePasswordChange}
            required={mode === "create"}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading 
            ? (mode === "create" ? "Menyimpan..." : "Mengupdate...") 
            : (mode === "create" ? "Tambah Siswa" : "Update Siswa")
          }
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push("/guru/siswa")}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}
