"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { FileDown, Search, Eye, FileText, Loader2 } from "lucide-react"
import Link from "next/link"

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
}

interface User {
  nama: string
  username: string
  role: string
}

export default function HasilListPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [ujianList, setUjianList] = useState<Ujian[]>([])
  const [selectedUjian, setSelectedUjian] = useState<string>("")
  const [hasilList, setHasilList] = useState<Hasil[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchUserAndUjian()
  }, [])

  useEffect(() => {
    if (selectedUjian) {
      fetchHasil(selectedUjian)
    }
  }, [selectedUjian])

  const fetchUserAndUjian = async () => {
    try {
      const [meRes, ujianRes] = await Promise.all([
        fetch('/api/auth/me', { credentials: 'include' }),
        fetch('/api/guru/ujian', { credentials: 'include' })
      ])

      if (meRes.ok) {
        const meData = await meRes.json()
        if (meData.success && meData.data?.user) {
          const sessionUser = meData.data.user
          if (sessionUser.role !== 'guru') {
            router.push('/login')
            return
          }
          setUser({
            nama: sessionUser.nama || 'Guru',
            username: sessionUser.username,
            role: 'guru'
          })
        }
      }

      if (ujianRes.ok) {
        const ujianData = await ujianRes.json()
        if (ujianData.success) {
          setUjianList(ujianData.data?.ujian || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }

    setLoading(false)
  }

  const fetchHasil = async (ujianId: string) => {
    setLoading(true)
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
    setLoading(false)
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

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
              <Select value={selectedUjian} onValueChange={(value) => setSelectedUjian(value || "")}>
                <SelectTrigger className="w-full sm:w-[400px]">
                  <SelectValue placeholder="Pilih ujian..." />
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
              <CardTitle>Daftar Hasil</CardTitle>
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
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
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
                          <TableCell className="text-right">
                            <Link href={`/guru/hasil/${selectedUjian}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye className="w-4 h-4" />
                                Detail
                              </Button>
                            </Link>
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