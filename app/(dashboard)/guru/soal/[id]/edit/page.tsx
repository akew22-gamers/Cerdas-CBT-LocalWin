'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SoalForm } from '@/components/soal/SoalForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Soal {
  id: string
  ujian_id: string
  teks_soal: string
  gambar_url?: string | null
  jawaban_benar: string
  pengecoh_1: string
  pengecoh_2: string
  pengecoh_3?: string | null
  pengecoh_4?: string | null
  urutan: number
}

export default function SoalEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const soalId = resolvedParams.id
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isloading, setIsloading] = useState(true)
  const [soal, setSoal] = useState<Soal | null>(null)
  const [user, setUser] = useState<{ nama: string; username: string; role: string } | null>(null)

  useEffect(() => {
    const fetchSoal = async () => {
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

      const soalRes = await fetch(`/api/guru/soal/${soalId}`, { credentials: 'include' })
      const soalData = await soalRes.json()

      if (!soalRes.ok || !soalData.success) {
        toast.error('Soal tidak ditemukan')
        router.push('/guru/soal')
        return
      }

      setSoal(soalData.data)
      setIsloading(false)
    }

    fetchSoal()
  }, [soalId, router])

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
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/guru/soal/${soalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || 'Gagal mengupdate soal')
        return
      }

      toast.success('Soal berhasil diupdate')
      router.push(`/guru/soal?ujian_id=${data.ujian_id}`)
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Terjadi kesalahan saat mengupdate soal')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isloading || !user) {
    return null
  }

  if (!soal) {
    return null
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/guru/soal?ujian_id=${soal.ujian_id}`}>
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Soal</h1>
            <p className="text-gray-500 text-sm mt-1">
              Edit soal yang sudah ada
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Soal</CardTitle>
          </CardHeader>
          <CardContent>
            <SoalForm
              soal={soal}
              ujianId={soal.ujian_id}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/guru/soal?ujian_id=${soal.ujian_id}`)}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}