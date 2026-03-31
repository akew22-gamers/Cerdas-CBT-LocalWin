"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SekolahFormData {
  nama_sekolah?: string
  npsn?: string
  alamat?: string
  logo_url?: string
  telepon?: string
  email?: string
  website?: string
  kepala_sekolah?: string
  tahun_ajaran?: string
}

interface SekolahFormProps {
  initialData?: SekolahFormData
  readOnly?: boolean
  apiEndpoint?: string
}

export function SekolahForm({ initialData, readOnly = false, apiEndpoint = "/api/admin/sekolah" }: SekolahFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<SekolahFormData>({
    nama_sekolah: initialData?.nama_sekolah || "",
    npsn: initialData?.npsn || "",
    alamat: initialData?.alamat || "",
    logo_url: initialData?.logo_url || "",
    telepon: initialData?.telepon || "",
    email: initialData?.email || "",
    website: initialData?.website || "",
    kepala_sekolah: initialData?.kepala_sekolah || "",
    tahun_ajaran: initialData?.tahun_ajaran || "2025/2026"
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(apiEndpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || "Terjadi kesalahan")
      }

      toast.success("Data sekolah berhasil disimpan")
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nama_sekolah">Nama Sekolah</Label>
          <Input
            id="nama_sekolah"
            name="nama_sekolah"
            type="text"
            placeholder="Masukkan nama sekolah"
            value={formData.nama_sekolah}
            onChange={handleInputChange}
            required
            disabled={isLoading || readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tahun_ajaran">Tahun Ajaran</Label>
          <Input
            id="tahun_ajaran"
            name="tahun_ajaran"
            type="text"
            placeholder="Contoh: 2025/2026"
            value={formData.tahun_ajaran}
            onChange={handleInputChange}
            required
            disabled={isLoading || readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="npsn">NPSN</Label>
          <Input
            id="npsn"
            name="npsn"
            type="text"
            placeholder="Masukkan NPSN"
            value={formData.npsn}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kepala_sekolah">Kepala Sekolah</Label>
          <Input
            id="kepala_sekolah"
            name="kepala_sekolah"
            type="text"
            placeholder="Nama kepala sekolah"
            value={formData.kepala_sekolah}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Textarea
            id="alamat"
            name="alamat"
            placeholder="Masukkan alamat lengkap"
            value={formData.alamat}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telepon">Telepon</Label>
          <Input
            id="telepon"
            name="telepon"
            type="text"
            placeholder="Masukkan nomor telepon"
            value={formData.telepon}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="contoh@sekolah.sch.id"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://www.sekolah.sch.id"
            value={formData.website}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="logo_url">URL Logo</Label>
          <Input
            id="logo_url"
            name="logo_url"
            type="url"
            placeholder="https://example.com/logo.png"
            value={formData.logo_url}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Masukkan URL gambar untuk logo sekolah
          </p>
        </div>
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.refresh()}
            disabled={isLoading}
          >
            Batal
          </Button>
        </div>
      )}
    </form>
  )
}
