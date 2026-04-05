'use client'

import { useEffect, useState, useCallback } from 'react'
import { useHasilUjianRealtime, type HasilUjianData } from '@/lib/hooks/useHasilUjianRealtime'
import { toast } from 'sonner'
import { Users, GraduationCap, FileText, Activity, Plus, ArrowRight, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout'
import { StatsCard, StatsCardSkeleton } from '@/components/ui/stats-card'
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
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

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
      <div className="space-y-6 sm:space-y-8">
        {/* Header - Mobile responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Dashboard
              </h1>
              {isSubscribed && sessionCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  {sessionCount} aktif
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Selamat datang kembali, {user.nama || user.username || 'Guru'}
            </p>
          </div>

          {/* Live indicator */}
          {isSubscribed && (
            <div className="flex items-center gap-2 text-green-600 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium hidden sm:inline">Live</span>
            </div>
          )}
        </div>

        {/* Stats Grid - Mobile: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <StatsCard
            icon={<GraduationCap className="w-5 h-5" />}
            label="Total Kelas"
            value={initialData.kelas_count}
            gradient="from-blue-500 to-indigo-600"
          />

          <StatsCard
            icon={<Users className="w-5 h-5" />}
            label="Total Siswa"
            value={initialData.siswa_count}
            gradient="from-emerald-500 to-teal-600"
          />

          <StatsCard
            icon={<FileText className="w-5 h-5" />}
            label="Total Ujian"
            value={initialData.ujian_count}
            gradient="from-purple-500 to-pink-600"
          />

          <StatsCard
            icon={<Activity className="w-5 h-5" />}
            label="Ujian Aktif"
            value={initialData.ujian_aktif}
            gradient="from-orange-500 to-amber-600"
            highlight
          />
        </div>

        {/* Recent Results + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Results */}
          <Card className="lg:col-span-2 border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                  <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
                    Hasil Ujian Terbaru
                  </CardTitle>
                </div>
                <Link href="/guru/hasil">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1 h-8 text-xs sm:text-sm"
                  >
                    Lihat Semua
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {recentHasil.length > 0 ? (
                <div className="space-y-3">
                  {recentHasil.map((hasil) => (
                    <div
                      key={hasil.id}
                      className="flex items-center justify-between p-3 sm:p-3.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm sm:text-base truncate">
                          {hasil.siswa_nama}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">
                          {hasil.ujian_judul}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-bold text-slate-900 text-base sm:text-lg">
                          {hasil.nilai}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500">
                          {hasil.submitted_at && isHydrated
                            ? new Date(hasil.submitted_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 mb-3 sm:mb-4">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                  </div>
                  <p className="text-sm sm:text-base text-slate-500 font-medium">
                    Belum ada hasil ujian
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Hasil ujian akan muncul di sini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-900">
                Akses Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Link href="/guru/kelas/create" className="col-span-1">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center gap-2 h-auto py-3 sm:py-3.5 px-3 hover:border-blue-300 hover:bg-blue-50 transition-all font-medium text-xs sm:text-sm"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
                    <span className="text-center">Kelas</span>
                  </Button>
                </Link>
                <Link href="/guru/siswa/create" className="col-span-1">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center gap-2 h-auto py-3 sm:py-3.5 px-3 hover:border-emerald-300 hover:bg-emerald-50 transition-all font-medium text-xs sm:text-sm"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span className="text-center">Siswa</span>
                  </Button>
                </Link>
                <Link href="/guru/ujian/create" className="col-span-1">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center gap-2 h-auto py-3 sm:py-3.5 px-3 hover:border-purple-300 hover:bg-purple-50 transition-all font-medium text-xs sm:text-sm"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
                    <span className="text-center">Ujian</span>
                  </Button>
                </Link>
                <Link href="/guru/soal/create" className="col-span-1">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center gap-2 h-auto py-3 sm:py-3.5 px-3 hover:border-amber-300 hover:bg-amber-50 transition-all font-medium text-xs sm:text-sm"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                    <span className="text-center">Soal</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
