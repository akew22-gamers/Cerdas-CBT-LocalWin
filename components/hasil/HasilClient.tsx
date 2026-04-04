"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileDown, Search, FileText, Loader2 } from "lucide-react"

interface Ujian {
  id: string
  judul: string
  kode_ujian: string
  status: string
}

interface Hasil {
  id: string
  siswa: {
    id: string
    nisn: string
    nama: string
  }
  kelas: string
  nilai: number
  jumlah_benar: number
  jumlah_salah: number
  waktu_mulai: string
  waktu_selesai: string
  is_submitted: boolean
  tab_switch_count: number
  fullscreen_exit_count: number
}

interface User {
  nama: string
  username: string
  role: string
}

interface HasilClientProps {
  user: User
  ujianList: Ujian[]
}

export function HasilClient({ user, ujianList }: HasilClientProps) {
  const [selectedUjian, setSelectedUjian] = useState<string>("")
  const [selectedUjianName, setSelectedUjianName] = useState<string>("")
  const [hasilList, setHasilList] = useState<Hasil[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingHasil, setLoadingHasil] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (selectedUjian) {
      fetchHasil(selectedUjian)
    }
  }, [selectedUjian])

  const fetchHasil = async (ujianId: string) => {
    setLoadingHasil(true)
    try {
      const response = await fetch(`/api/guru/hasil?ujian_id=${ujianId}`, {
        credentials: 'include'
      })
      const result = await response.json()
      if (result.success) {
        setHasilList(result.data.hasil)
      }
    } catch (error) {
      console.error("Error fetching hasil:", error)
    }
    setLoadingHasil(false)
  }

  const handleUjianChange = (value: string | null) => {
    const val = value || ""
    setSelectedUjian(val)
    const ujian = ujianList.find(u => u.id === val)
    setSelectedUjianName(ujian ? `${ujian.judul} (${ujian.kode_ujian})` : "")
  }

  const handleExport = async () => {
    if (!selectedUjian) return
    setExporting(true)
    try {
      const response = await fetch(`/api/guru/hasil/${selectedUjian}/export?format=xlsx`, {
        credentials: 'include'
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const ujian = ujianList.find(u => u.id === selectedUjian)
        a.download = `hasil-${ujian?.kode_ujian || 'ujian'}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting:", error)
    }
    setExporting(false)
  }

  const filteredHasil = hasilList.filter(hasil =>
    hasil.siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hasil.siswa.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hasil.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hasil Ujian</h1>
            <p className="text-gray-500 text-sm mt-1">
              Lihat dan export hasil ujian siswa
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Ujian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedUjian} onValueChange={handleUjianChange}>
                <SelectTrigger className="w-full sm:w-[400px]">
                  <SelectValue placeholder="Pilih ujian...">
                    {selectedUjianName || "Pilih ujian..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ujianList.map((ujian) => (
                    <SelectItem key={ujian.id} value={ujian.id}>
                      {ujian.judul} ({ujian.kode_ujian}) - {ujian.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedUjian && (
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exporting || hasilList.length === 0}
                  className="gap-2"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  Export Excel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedUjian && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Daftar Hasil ({hasilList.length} siswa)</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[300px]"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingHasil ? (
                <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Memuat data hasil...</span>
                </div>
              ) : filteredHasil.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>NISN</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Nilai</TableHead>
                        <TableHead>Waktu Selesai</TableHead>
                        <TableHead>Ganti Tab</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHasil.map((hasil, index) => (
                        <TableRow key={hasil.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{hasil.siswa.nisn}</TableCell>
                          <TableCell>{hasil.siswa.nama}</TableCell>
                          <TableCell>{hasil.kelas}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${
                              hasil.nilai >= 80 ? 'text-green-600' :
                              hasil.nilai >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {hasil.nilai.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {hasil.waktu_selesai
                              ? new Date(hasil.waktu_selesai).toLocaleString('id-ID')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {hasil.tab_switch_count > 0 ? (
                              <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                {hasil.tab_switch_count}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasil.is_submitted ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                Selesai
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                Belum Selesai
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada hasil untuk ujian ini</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
