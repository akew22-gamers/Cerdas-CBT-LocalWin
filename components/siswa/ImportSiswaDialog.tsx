"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from "lucide-react"

interface ImportSiswaDialogProps {
  onSuccess?: () => void
}

export function ImportSiswaDialog({ onSuccess }: ImportSiswaDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; errors: any[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error("File harus berformat Excel (.xlsx atau .xls)")
        return
      }
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NISN': '1234567890',
        'Nama': 'Contoh Nama Siswa',
        'Password': 'password123',
        'Kelas': 'X-A'
      },
      {
        'NISN': '0987654321',
        'Nama': 'Contoh Siswa Kedua',
        'Password': 'password456',
        'Kelas': 'X-A'
      }
    ]

    import('xlsx').then((XLSX) => {
      const worksheet = XLSX.utils.json_to_sheet(templateData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa')
      XLSX.writeFile(workbook, 'template_siswa.xlsx')
    })
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Pilih file Excel terlebih dahulu")
      return
    }

    setIsLoading(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/guru/siswa/import', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const result = await response.json()

      if (!result.success) {
        if (result.error?.errors) {
          toast.error(`${result.error.message}: ${result.error.errors.length} baris error`)
          setImportResult({ imported: 0, errors: result.error.errors })
        } else {
          toast.error(result.error?.message || "Gagal mengimpor siswa")
        }
        return
      }

      setImportResult({ imported: result.data.imported, errors: [] })
      toast.success(`Berhasil mengimpor ${result.data.imported} siswa`)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onSuccess?.()

      setTimeout(() => {
        setOpen(false)
        resetForm()
      }, 1500)
    } catch (error) {
      console.error('Import error:', error)
      toast.error("Terjadi kesalahan saat mengimpor")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="gap-2 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Siswa dari Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Format File Excel</h4>
            <p className="text-sm text-blue-800 mb-3">
              File Excel harus memiliki kolom berikut:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li><strong>NISN</strong> - Nomor Induk Siswa Nasional (wajib)</li>
              <li><strong>Nama</strong> - Nama lengkap siswa (wajib)</li>
              <li><strong>Password</strong> - Password untuk login siswa (wajib)</li>
              <li><strong>Kelas</strong> - Nama kelas (wajib)</li>
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 gap-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Pilih File Excel</Label>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isLoading}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{selectedFile.name}</span>
                <span className="text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {importResult && importResult.imported > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">
                Berhasil mengimpor {importResult.imported} siswa
              </span>
            </div>
          )}

          {importResult && importResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Error pada baris:</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside max-h-32 overflow-y-auto">
                {importResult.errors.map((err: any, idx: number) => (
                  <li key={idx}>Baris {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedFile}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengimpor...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Siswa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}