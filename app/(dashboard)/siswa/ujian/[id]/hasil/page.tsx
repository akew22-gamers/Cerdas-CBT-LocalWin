'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertTriangle, Award, CheckCircle2, XCircle } from 'lucide-react'

interface HasilData {
  id: string
  nilai: number | null
  jumlah_benar: number
  jumlah_salah: number
  is_submitted: boolean
  waktu_mulai: string
  waktu_selesai: string
  tab_switch_count: number
  fullscreen_exit_count: number
  show_result: boolean
  ujian: {
    id: string
    judul: string
    durasi: number
  }
}

export default function HasilUjianPage() {
  const router = useRouter()
  const params = useParams()
  const ujianId = params.id as string
  const [loading, setLoading] = useState(true)
  const [hasil, setHasil] = useState<HasilData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHasil() {
      try {
        const response = await fetch(`/api/siswa/ujian/${ujianId}/hasil`)
        const data = await response.json()

        if (!data.success) {
          setError(data.error?.message || 'Gagal memuat hasil ujian')
          return
        }

        setHasil(data.data)
      } catch (err) {
        console.error('Error fetching hasil:', err)
        setError('Terjadi kesalahan saat memuat data')
      } finally {
        setLoading(false)
      }
    }

    fetchHasil()
  }, [ujianId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat hasil ujian...</p>
        </div>
      </div>
    )
  }

  if (error || !hasil) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Data tidak ditemukan'}</p>
            <Button onClick={() => router.push('/siswa')} className="w-full">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cheatingDetected = hasil.tab_switch_count > 0 || hasil.fullscreen_exit_count > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">Hasil Ujian</h1>
          <p className="text-gray-600">{hasil.ujian.judul}</p>
        </div>

        <Card className="overflow-hidden border-2 border-indigo-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-8">
            {hasil.show_result && hasil.nilai !== null ? (
              <>
                <Award className="w-16 h-16 mx-auto mb-4 opacity-90" />
                <CardTitle className="text-4xl font-bold">
                  {Math.round(hasil.nilai)}
                </CardTitle>
                <CardDescription className="text-indigo-100 text-lg">
                  Nilai Anda
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">Hasil Belum Diumumkan</CardTitle>
                <CardDescription className="text-indigo-100 mt-2">
                  Guru belum mengumumkan nilai untuk ujian ini
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{hasil.jumlah_benar}</p>
                <p className="text-sm text-green-600">Benar</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">{hasil.jumlah_salah}</p>
                <p className="text-sm text-red-600">Salah</p>
              </div>
            </div>

            <div className="text-center text-gray-600 mb-6">
              <p>Total Soal: <span className="font-semibold">{hasil.jumlah_benar + hasil.jumlah_salah}</span></p>
            </div>

            {cheatingDetected && (
              <Alert className="bg-amber-50 border-amber-200 mb-6">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <p className="font-semibold mb-1">Peringatan Pelanggaran</p>
                  <p className="text-sm">
                    {hasil.tab_switch_count > 0 && (
                      <span>Terdeteksi {hasil.tab_switch_count}x beralih tab. </span>
                    )}
                    {hasil.fullscreen_exit_count > 0 && (
                      <span>Terdeteksi {hasil.fullscreen_exit_count}x keluar fullscreen. </span>
                    )}
                    Aktivitas ini telah dicatat dalam sistem.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-500 text-center space-y-1">
              <p>Waktu Mulai: {new Date(hasil.waktu_mulai).toLocaleString('id-ID')}</p>
              {hasil.waktu_selesai && (
                <p>Selesai: {new Date(hasil.waktu_selesai).toLocaleString('id-ID')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => router.push('/siswa')}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-12 text-lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  )
}
