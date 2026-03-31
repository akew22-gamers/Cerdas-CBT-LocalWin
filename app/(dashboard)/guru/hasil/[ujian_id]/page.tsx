"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileDown, ArrowLeft, Loader2, Users, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface SoalStat {
  soal_id: string
  teks_soal: string
  urutan: number
  jumlah_benar: number
  jumlah_salah: number
  persentase_benar: number
}

interface Summary {
  total_siswa: number
  nilai_rata_rata: number
  nilai_tertinggi: number
  nilai_terendah: number
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
  waktu_selesai: string
  is_submitted: boolean
}

interface Ujian {
  id: string
  judul: string
  kode_ujian: string
}

interface User {
  nama: string
  role: string
}

export default function HasilDetailPage() {
  const params = useParams()
  const ujianId = params.ujian_id as string

  const [user, setUser] = useState<User | null>(null)
  const [ujian, setUjian] = useState<Ujian | null>(null)
  const [stats, setStats] = useState<SoalStat[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [hasilList, setHasilList] = useState<Hasil[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [ujianId])

  const fetchData = async () => {
    const supabase = createClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: guru } = await supabase
      .from("guru")
      .select("nama")
      .eq("id", authUser.id)
      .single()

    setUser({ nama: guru?.nama || "Guru", role: "guru" })

    const { data: ujianData } = await supabase
      .from("ujian")
      .select("id, judul, kode_ujian")
      .eq("id", ujianId)
      .single()

    setUjian(ujianData)

    try {
      const statsResponse = await fetch(`/api/guru/hasil/${ujianId}/stats`)
      const statsResult = await statsResponse.json()
      if (statsResult.success) {
        setStats(statsResult.data.stats)
        setSummary(statsResult.data.summary)
      }

      const hasilResponse = await fetch(`/api/guru/hasil?ujian_id=${ujianId}`)
      const hasilResult = await hasilResponse.json()
      if (hasilResult.success) {
        setHasilList(hasilResult.data.hasil)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }

    setLoading(false)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch(`/api/guru/hasil/${ujianId}/export?format=xlsx`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
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

  if (!user || loading) {
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
          <div className="flex items-center gap-4">
            <Link href="/guru/hasil">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Hasil</h1>
              <p className="text-gray-500 text-sm mt-1">
                {ujian?.judul} ({ujian?.kode_ujian})
              </p>
            </div>
          </div>
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
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Siswa</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.total_siswa}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rata-rata</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.nilai_rata_rata.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tertinggi</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.nilai_tertinggi}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600 rotate-180" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Terendah</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.nilai_terendah}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="siswa" className="w-full">
          <TabsList>
            <TabsTrigger value="siswa">Daftar Siswa</TabsTrigger>
            <TabsTrigger value="statistik">Statistik Soal</TabsTrigger>
          </TabsList>

          <TabsContent value="siswa" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Siswa</CardTitle>
              </CardHeader>
              <CardContent>
                {hasilList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">No</TableHead>
                          <TableHead>NISN</TableHead>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Nilai</TableHead>
                          <TableHead>Benar</TableHead>
                          <TableHead>Salah</TableHead>
                          <TableHead>Waktu Selesai</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hasilList.map((hasil, index) => (
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
                            <TableCell>{hasil.jumlah_benar}</TableCell>
                            <TableCell>{hasil.jumlah_salah}</TableCell>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Belum ada hasil untuk ujian ini
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistik" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistik Per Soal</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.length > 0 ? (
                  <div className="space-y-4">
                    {stats.map((stat) => (
                      <div
                        key={stat.soal_id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              Soal {stat.urutan}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {stat.teks_soal}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              stat.persentase_benar >= 70 ? 'text-green-600' :
                              stat.persentase_benar >= 40 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {stat.persentase_benar}%
                            </p>
                            <p className="text-xs text-gray-500">benar</p>
                          </div>
                        </div>
                        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full ${
                              stat.persentase_benar >= 70 ? 'bg-green-500' :
                              stat.persentase_benar >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${stat.persentase_benar}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-green-600">
                            {stat.jumlah_benar} benar
                          </span>
                          <span className="text-red-600">
                            {stat.jumlah_salah} salah
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Belum ada statistik untuk ujian ini
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
