"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  School, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  User, 
  Calendar,
  ImagePlus,
  Save,
  RotateCcw,
  Sparkles
} from "lucide-react"

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
        credentials: "include",
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="h-12 w-12 flex items-center justify-center bg-violet-100 rounded-xl border border-violet-200 flex-shrink-0">
          <School className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Edit Informasi Sekolah</h2>
          <p className="text-slate-500 text-sm mt-0.5">Perbarui data identitas sekolah dengan format yang benar</p>
        </div>
      </div>

      <div className="space-y-8">
        <FormSection title="Informasi Utama" icon={School}>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="nama_sekolah"
              label="Nama Sekolah"
              icon={Building2}
              required
              placeholder="Masukkan nama sekolah"
              value={formData.nama_sekolah || ""}
              onChange={handleInputChange}
              disabled={isLoading || readOnly}
            />
            <FormField
              id="tahun_ajaran"
              label="Tahun Ajaran"
              icon={Calendar}
              required
              placeholder="Contoh: 2025/2026"
              value={formData.tahun_ajaran || ""}
              onChange={handleInputChange}
              disabled={isLoading || readOnly}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 mt-6">
            <FormField
              id="npsn"
              label="NPSN"
              icon={Hash}
              placeholder="Masukkan NPSN"
              value={formData.npsn || ""}
              onChange={handleInputChange}
              disabled={isLoading || readOnly}
            />
            <FormField
              id="kepala_sekolah"
              label="Kepala Sekolah"
              icon={User}
              placeholder="Nama kepala sekolah"
              value={formData.kepala_sekolah || ""}
              onChange={handleInputChange}
              disabled={isLoading || readOnly}
            />
          </div>
        </FormSection>

        <FormSection title="Kontak" icon={Phone}>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="telepon"
              label="Telepon"
              icon={Phone}
              placeholder="Masukkan nomor telepon"
              value={formData.telepon || ""}
              onChange={handleInputChange}
              disabled={isLoading || readOnly}
            />
            <FormField
              id="email"
              label="Email"
              icon={Mail}
              type="email"
              placeholder="contoh@sekolah.sch.id"
              value={formData.email || ""}
              onChange={handleInputChange}
              disabled={isLoading || readOnly}
            />
          </div>
          <div className="mt-6">
            <FormField
              id="website"
              label="Website"
              icon={Globe}
              type="url"
              placeholder="https://www.sekolah.sch.id"
              value={formData.website || ""}
              onChange={handleInputChange}
              disabled={isLoading || readOnly}
            />
          </div>
        </FormSection>

        <FormSection title="Alamat" icon={MapPin}>
          <TextareaField
            id="alamat"
            label="Alamat Lengkap"
            placeholder="Masukkan alamat lengkap sekolah"
            value={formData.alamat || ""}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
          />
        </FormSection>

        <FormSection title="Media" icon={ImagePlus}>
          <FormField
            id="logo_url"
            label="URL Logo Sekolah"
            icon={ImagePlus}
            type="url"
            placeholder="https://example.com/logo.png"
            value={formData.logo_url || ""}
            onChange={handleInputChange}
            disabled={isLoading || readOnly}
            hint="Masukkan URL gambar logo sekolah (format PNG/JPG)"
          />
          {formData.logo_url && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-3 font-medium">Preview Logo:</p>
              <div className="h-24 w-24 rounded-xl bg-white border border-slate-200 p-2 shadow-sm">
                <img 
                  src={formData.logo_url} 
                  alt="Logo Preview"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
        </FormSection>
      </div>

      {!readOnly && (
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.refresh()}
            disabled={isLoading}
            className="border-slate-200 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      )}
    </form>
  )
}

function FormSection({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Icon className="h-4 w-4 text-violet-600" />
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="pt-2">
        {children}
      </div>
    </div>
  )
}

function FormField({
  id,
  label,
  icon: Icon,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled,
  hint
}: {
  id: string
  label: string
  icon: any
  required?: boolean
  type?: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2 text-slate-700">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="border-slate-200 focus:border-violet-400 focus:ring-violet-400/20"
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function TextareaField({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-700">{label}</Label>
      <Textarea
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={3}
        className="border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 resize-none"
      />
    </div>
  )
}

function Hash({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  )
}