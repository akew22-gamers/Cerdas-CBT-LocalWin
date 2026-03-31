'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout'
import { SoalForm } from '@/components/soal/SoalForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SoalCreatePage({ searchParams }: { searchParams: Promise<{ ujian_id?: string }> }) {
  const resolvedSearchParams = use(searchParams)
  const ujianId = resolvedSearchParams.ujian_id
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<{ nama: string; role: string } | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        redirect('/login')
        return
      }

      const { data: guruData } = await supabase
        .from('guru')
        .select('nama')
        .eq('id', user.id)
        .single()

      setUser({ nama: guruData?.nama || 'Guru', role: 'guru' })
    }

    getUser()
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
    if (!ujianId) {
      toast.error('Ujian ID tidak ditemukan')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/guru/soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ujian_id: ujianId })
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || 'Gagal membuat soal')
        return
      }

      toast.success('Soal berhasil dibuat')
      router.push(`/guru/soal?ujian_id=${ujianId}`)
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

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={ujianId ? `/guru/soal?ujian_id=${ujianId}` : '/guru/soal'}>
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
              ujianId={ujianId || ''}
              onSubmit={handleSubmit}
              onCancel={() => router.push(ujianId ? `/guru/soal?ujian_id=${ujianId}` : '/guru/soal')}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
