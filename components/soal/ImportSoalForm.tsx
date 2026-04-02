"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from "lucide-react"

interface ImportSoalFormProps {
  ujianId: string
  ujianStatus: string
}

export function ImportSoalForm({ ujianId, ujianStatus }: ImportSoalFormProps) {
  const router = useRouter()
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
        'Soal': 'Contoh soal pertama?',
        'Jawaban Benar': 'Jawaban yang benar',
        'Pengecoh 1': 'Pengecoh pertama',
        'Pengecoh 2': 'Pengecoh kedua',
        'Pengecoh 3': 'Pengecoh ketiga (opsional)',
        'Pengecoh 4': 'Pengecoh keempat (opsional)',
        'Gambar_URL': 'https://example.com/image.png (opsional)'
      },
      {
        'Soal': 'Contoh soal kedua?',
        'Jawaban Benar': 'Jawaban benar soal kedua',
        'Pengecoh 1': 'Pengecoh 1 soal kedua',
        'Pengecoh 2': 'Pengecoh 2 soal kedua',
        'Pengecoh 3': '',
        'Pengecoh 4': '',
        'Gambar_URL': ''
      }
    ]

    const XLSX = require('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal')
    XLSX.writeFile(workbook, 'template_soal.xlsx')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast.error("Pilih file Excel terlebih dahulu")
      return
    }

    if (ujianStatus === 'aktif') {
      toast.error("Tidak dapat mengimpor soal karena ujian sedang aktif")
      return
    }

    setIsLoading(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('ujian_id', ujianId)

      const response = await fetch('/api/guru/soal/import', {
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
          toast.error(result.error?.message || "Gagal mengimpor soal")
        }
        return
      }

      setImportResult({ imported: result.data.imported, errors: [] })
      toast.success(`Berhasil mengimpor ${result.data.imported} soal`)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      router.refresh()
    } catch (error) {
      console.error('Import error:', error)
      toast.error("Terjadi kesalahan saat mengimpor")
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = ujianStatus === 'aktif'

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Format File Excel</h3>
        <p className="text-sm text-blue-800 mb-3">
          File Excel harus memiliki kolom berikut (nama kolom harus sama persis):
        </p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>Soal</strong> - Teks pertanyaan (wajib)</li>
          <li><strong>Jawaban Benar</strong> - Jawaban yang benar (wajib)</li>
          <li><strong>Pengecoh 1</strong> - Pengecoh pertama (wajib)</li>
          <li><strong>Pengecoh 2</strong> - Pengecoh kedua (wajib)</li>
          <li><strong>Pengecoh 3</strong> - Pengecoh ketiga (opsional)</li>
          <li><strong>Pengecoh 4</strong> - Penech keempat (opsional)</li>
          <li><strong>Gambar_URL</strong> - URL gambar soal (opsional)</li>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">File Excel</Label>
          <div className="flex items-center gap-3">
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isLoading || isDisabled}
              className="flex-1"
            />
          </div>
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
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
              Berhasil mengimpor {importResult.imported} soal
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

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading || !selectedFile || isDisabled}
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
                Import Soal
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/guru/soal?ujian_id=${ujianId}`)}
            disabled={isLoading}
          >
            Kembali
          </Button>
        </div>
      </form>
    </div>
  )
}