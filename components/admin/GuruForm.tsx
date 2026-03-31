"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GuruFormProps {
  initialData?: {
    id?: string
    username?: string
    nama?: string
  }
  mode: "create" | "edit"
}

export function GuruForm({ initialData, mode }: GuruFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    username: initialData?.username || "",
    nama: initialData?.nama || "",
    password: "",
    confirmPassword: ""
  })
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const url = mode === "create" 
        ? "/api/admin/guru" 
        : `/api/admin/guru/${initialData?.id}`
      
      const method = mode === "create" ? "POST" : "PUT"
      
      const body: Record<string, string> = {
        nama: formData.nama,
      }

      if (mode === "create") {
        body.username = formData.username
        body.password = formData.password
      } else {
        if (formData.username) {
          body.username = formData.username
        }
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
          ? "Guru berhasil ditambahkan" 
          : "Guru berhasil diupdate"
      )

      router.push("/admin/guru")
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, password: e.target.value }))
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, username: e.target.value }))
  }

  const handleNamaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, nama: e.target.value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {mode === "create" && (
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Masukkan username"
              value={formData.username}
              onChange={handleUsernameChange}
              required
              disabled={isLoading}
              pattern="[a-zA-Z0-9_]+"
              title="Username hanya boleh berisi huruf, angka, dan underscore"
            />
          </div>
        )}

        {mode === "edit" && (
          <div className="space-y-2">
            <Label htmlFor="username">Username (opsional)</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Kosongkan jika tidak ingin mengubah"
              value={formData.username}
              onChange={handleUsernameChange}
              disabled={isLoading}
              pattern="[a-zA-Z0-9_]+"
              title="Username hanya boleh berisi huruf, angka, dan underscore"
            />
            <p className="text-xs text-muted-foreground">
              Kosongkan jika tidak ingin mengubah username
            </p>
          </div>
        )}

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
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {mode === "create" ? "Konfirmasi Password" : "Konfirmasi Password Baru"}
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder={mode === "create" ? "Konfirmasi password" : "Kosongkan jika tidak ingin mengubah"}
            value={formData.confirmPassword}
            onChange={handleConfirmPasswordChange}
            required={mode === "create"}
            disabled={isLoading}
          />
        </div>

        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-sm text-destructive">Password tidak cocok</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={isLoading || !!(formData.password && formData.password !== formData.confirmPassword)}
          className="flex-1"
        >
          {isLoading 
            ? (mode === "create" ? "Menyimpan..." : "Mengupdate...") 
            : (mode === "create" ? "Tambah Guru" : "Update Guru")
          }
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push("/admin/guru")}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}
