'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

export function ImportSiswaDialog() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'skip_existing' | 'update_existing'>('skip_existing')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('File harus berformat .xlsx atau .xls')
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Pilih file terlebih dahulu')
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', mode)

    try {
      const res = await fetch('/api/guru/siswa/import', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (data.success) {
        setResult(data.data)
        toast.success(`Import berhasil: ${data.data.imported} siswa diimpor`)
        router.refresh()
      } else {
        toast.error(data.error?.message || 'Import gagal')
      }
    } catch {
      toast.error('Terjadi kesalahan saat import')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Siswa dari Excel
        </CardTitle>
        <CardDescription>
          Upload file Excel (.xlsx) dengan format: NISN, Nama, Password, Kelas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">File Excel</Label>
          <Input
            id="file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Mode Import</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="skip_existing"
                checked={mode === 'skip_existing'}
                onChange={() => setMode('skip_existing')}
              />
              <span className="text-sm">Skip jika NISN sudah ada</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value="update_existing"
                checked={mode === 'update_existing'}
                onChange={() => setMode('update_existing')}
              />
              <span className="text-sm">Update jika NISN sudah ada</span>
            </label>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Format Excel:</strong>
            <br />
            Kolom A: NISN (angka)
            <br />
            Kolom B: Nama Siswa
            <br />
            Kolom C: Password
            <br />
            Kolom D: Nama Kelas (harus sesuai dengan data kelas yang ada)
          </AlertDescription>
        </Alert>

        {result && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{result.imported} siswa berhasil diimpor</span>
            </div>
            {result.updated > 0 && (
              <div className="flex items-center gap-2 text-blue-600">
                <CheckCircle className="h-4 w-4" />
                <span>{result.updated} siswa diupdate</span>
              </div>
            )}
            {result.skipped > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{result.skipped} baris di-skip</span>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="space-y-1">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>Baris {err.row}: {err.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={!file || isLoading}>
            {isLoading ? (
              'Mengimport...'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}