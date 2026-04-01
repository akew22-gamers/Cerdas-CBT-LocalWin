'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SoalForm } from '@/components/soal/SoalForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SoalCreatePage({ searchParams }: { searchParams: Promise<{ ujian_id?: string }> }) {
  const resolvedSearchParams = use(searchParams)
  const ujianId = resolvedSearchParams.ujian_id
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<{ nama: string; username: string; role: string } | null>(null)
  const [ujianList, setUjianList] = useState<any[]>([])
  const [selectedUjianId, setSelectedUjianId] = useState(ujianId || '')

  useEffect(() => {
    const getUser = async () => {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) { router.push('/login'); return }
      const meData = await meRes.json()
      if (!meData.success || meData.data.user.role !== 'guru') {
        router.push('/login')
        return
      }
      const user = meData.data.user
      setUser({
        nama: user.nama || 'Guru',
        username: user.username,
        role: 'guru'
      })
    }

    getUser()
  }, [])

  useEffect(() => {
    const fetchUjian = async () => {
      const res = await fetch('/api/guru/ujian', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setUjianList(data.data.ujian || [])
      }
    }
    fetchUjian()
  }, [])

  const handleSubmit = async (data: {
    ujian_id: string
    teks_soal: string
    gambar_url?: string | null
    jawaban_benar: string
    pengecoh_1: string
    pengecoh_2: string
    pengecoh_3?: string | null
    pengecoh_4?: string | null
    urutan?: number
  }) => {
    if (!selectedUjianId) {
      toast.error('Ujian ID tidak ditemukan')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/guru/soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ujian_id: selectedUjianId }),
        credentials: 'include'
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || 'Gagal membuat soal')
        return
      }

      toast.success('Soal berhasil dibuat')
      router.push(`/guru/soal?ujian_id=${selectedUjianId}`)
    } catch (error) {
      console.error('Create error:', error)
      toast.error('Terjadi kesalahan saat membuat soal')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  if (!selectedUjianId) {
    return (
      <DashboardLayout user={user}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/guru/soal">
              <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Buat Soal Baru</h1>
              <p className="text-gray-500 text-sm mt-1">
                Pilih ujian terlebih dahulu
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pilih Ujian</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedUjianId ?? ""} onValueChange={(value) => setSelectedUjianId(value ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ujian..." />
                </SelectTrigger>
                <SelectContent>
                  {ujianList.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.judul} ({u.kode_ujian})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/guru/soal?ujian_id=${selectedUjianId}`}>
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buat Soal Baru</h1>
            <p className="text-gray-500 text-sm mt-1">
              Tambahkan soal baru untuk ujian Anda
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Soal</CardTitle>
          </CardHeader>
          <CardContent>
            <SoalForm
              ujianId={selectedUjianId}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/guru/soal?ujian_id=${selectedUjianId}`)}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}