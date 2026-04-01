'use client'

import { useEffect, useState, useCallback } from 'react'
import { useHasilUjianRealtime, type HasilUjianData } from '@/lib/hooks/useHasilUjianRealtime'
import { toast } from 'sonner'
import { Users, GraduationCap, FileText, Activity, Plus, ArrowRight, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout'
import Link from 'next/link'

interface GuruDashboardClientProps {
  initialData: {
    kelas_count: number
    siswa_count: number
    ujian_count: number
    ujian_aktif: number
    recent_hasil: Array<{
      id: string
      siswa_nama: string
      siswa_nisn: string
      ujian_judul: string
      nilai: number
      submitted_at: string
    }>
  }
  ujianIds: string[]
  user: { nama: string | null; username?: string; role: string }
}

export function GuruDashboardClient({ initialData, ujianIds, user }: GuruDashboardClientProps) {
  const [recentHasil, setRecentHasil] = useState(initialData.recent_hasil)
  const [sessionCount, setSessionCount] = useState(0)

  const handleNewResult = useCallback((hasil: HasilUjianData) => {
    if (hasil.nilai !== undefined && hasil.is_submitted) {
      toast.success('Hasil ujian baru masuk!', {
        description: `Nilai: ${hasil.nilai}`,
        duration: 4000
      })

      setRecentHasil((prev) => [
        {
          id: hasil.id,
          siswa_nama: 'Siswa',
          siswa_nisn: '-',
          ujian_judul: 'Ujian',
          nilai: hasil.nilai ?? 0,
          submitted_at: hasil.waktu_selesai || new Date().toISOString()
        },
        ...prev.slice(0, 4)
      ])
    }
  }, [])

  const { isSubscribed } = useHasilUjianRealtime({
    ujianIds,
    onNewResultAction: handleNewResult
  })

  const fetchSessionCount = useCallback(async () => {
    try {
      const response = await fetch('/api/guru/dashboard/realtime')
      const result = await response.json()
      
      if (result.success) {
        const total = (result.data.sessionCounts || []).reduce(
          (sum: number, c: { count: number }) => sum + c.count,
          0
        )
        setSessionCount(total)
      }
    } catch (error) {
      console.error('Error fetching session count:', error)
    }
  }, [])

  useEffect(() => {
    if (ujianIds.length > 0) {
      fetchSessionCount()
      const interval = setInterval(fetchSessionCount, 10000)
      return () => clearInterval(interval)
    }
  }, [ujianIds, fetchSessionCount])

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
<p className="text-gray-500 text-sm mt-1">
               Selamat datang kembali, {user.nama || user.username || 'Guru'}
             </p>
          </div>
          <div className="flex items-center gap-4">
            {isSubscribed && sessionCount > 0 && (
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                <div className="relative">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                </div>
                <span className="text-sm text-green-700 font-medium">
                  {sessionCount} siswa sedang mengerjakan
                </span>
              </div>
            )}
            {isSubscribed && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-600 font-medium">Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Kelas</p>
                <p className="text-2xl font-bold text-gray-900">{initialData.kelas_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Siswa</p>
                <p className="text-2xl font-bold text-gray-900">{initialData.siswa_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Ujian</p>
                <p className="text-2xl font-bold text-gray-900">{initialData.ujian_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ujian Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{initialData.ujian_aktif}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                Hasil Ujian Terbaru
              </CardTitle>
            </div>
            <Link href="/guru/hasil">
              <Button variant="ghost" size="sm" className="gap-1">
                Lihat Semua
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentHasil.length > 0 ? (
              <div className="space-y-3">
                {recentHasil.map((hasil) => (
                  <div
                    key={hasil.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {hasil.siswa_nama}
                      </p>
                      <p className="text-sm text-gray-500">
                        {hasil.ujian_judul}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {hasil.nilai}
                      </p>
                      <p className="text-xs text-gray-500">
                        {hasil.submitted_at
                          ? new Date(hasil.submitted_at).toLocaleDateString('id-ID')
                          : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Belum ada hasil ujian
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Akses Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/guru/kelas/create">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Tambah Kelas Baru
              </Button>
            </Link>
            <Link href="/guru/siswa/create">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Tambah Siswa Baru
              </Button>
            </Link>
            <Link href="/guru/ujian/create">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Buat Ujian Baru
              </Button>
            </Link>
            <Link href="/guru/hasil">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="w-4 h-4" />
                Lihat Hasil Ujian
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  )
}
