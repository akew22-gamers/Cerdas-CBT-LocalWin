'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ImageUpload } from './ImageUpload'
import { MathRenderer } from './MathRenderer'
import { Eye, EyeOff, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface Soal {
  id?: string
  ujian_id: string
  teks_soal: string
  gambar_url?: string | null
  jawaban_benar: string
  pengecoh_1: string
  pengecoh_2: string
  pengecoh_3?: string | null
  pengecoh_4?: string | null
  urutan?: number
}

interface SoalFormProps {
  soal?: Soal | null
  ujianId: string
  onSubmit: (data: {
    ujian_id: string
    teks_soal: string
    gambar_url?: string | null
    jawaban_benar: string
    pengecoh_1: string
    pengecoh_2: string
    pengecoh_3?: string | null
    pengecoh_4?: string | null
    urutan?: number
  }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function SoalForm({ 
  soal, 
  ujianId, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: SoalFormProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<Soal>({
    ujian_id: ujianId,
    teks_soal: '',
    gambar_url: null,
    jawaban_benar: '',
    pengecoh_1: '',
    pengecoh_2: '',
    pengecoh_3: null,
    pengecoh_4: null,
    urutan: 0
  })

  useEffect(() => {
    if (soal) {
      setFormData({
        id: soal.id,
        ujian_id: soal.ujian_id,
        teks_soal: soal.teks_soal,
        gambar_url: soal.gambar_url,
        jawaban_benar: soal.jawaban_benar,
        pengecoh_1: soal.pengecoh_1,
        pengecoh_2: soal.pengecoh_2,
        pengecoh_3: soal.pengecoh_3,
        pengecoh_4: soal.pengecoh_4,
        urutan: soal.urutan
      })
    }
  }, [soal])

  const handleInputChange = (field: keyof Soal, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.teks_soal.trim()) {
      toast.error('Teks soal harus diisi')
      return
    }
    if (!formData.jawaban_benar.trim()) {
      toast.error('Jawaban benar harus diisi')
      return
    }
    if (!formData.pengecoh_1.trim()) {
      toast.error('Pengecoh 1 harus diisi')
      return
    }
    if (!formData.pengecoh_2.trim()) {
      toast.error('Pengecoh 2 harus diisi')
      return
    }

    try {
      await onSubmit({
        ujian_id: formData.ujian_id,
        teks_soal: formData.teks_soal,
        gambar_url: formData.gambar_url,
        jawaban_benar: formData.jawaban_benar,
        pengecoh_1: formData.pengecoh_1,
        pengecoh_2: formData.pengecoh_2,
        pengecoh_3: formData.pengecoh_3 || null,
        pengecoh_4: formData.pengecoh_4 || null,
        urutan: formData.urutan
      })
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const options = [
    { key: 'jawaban_benar' as const, label: 'Jawaban Benar', order: 'A' },
    { key: 'pengecoh_1' as const, label: 'Pengecoh 1', order: 'B' },
    { key: 'pengecoh_2' as const, label: 'Pengecoh 2', order: 'C' },
    { key: 'pengecoh_3' as const, label: 'Pengecoh 3', order: 'D', optional: true },
    { key: 'pengecoh_4' as const, label: 'Pengecoh 4', order: 'E', optional: true }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="teks_soal" className="text-base">Teks Soal</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs h-8"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="teks_soal"
          value={formData.teks_soal}
          onChange={(e) => handleInputChange('teks_soal', e.target.value)}
          placeholder="Masukkan teks soal (dukung $...$ untuk inline math dan $$...$$ untuk block math)"
          className="min-h-[150px] font-mono text-sm"
          rows={6}
        />
        <p className="text-xs text-gray-500">
          Gunakan $...$ untuk rumus inline dan $$...$$ untuk rumus block. Contoh: $x^2$ atau $$\int_0^1 f(x)dx$$
        </p>

        {showPreview && formData.teks_soal && (
          <Card className="mt-2">
            <CardContent className="p-4 bg-gray-50 min-h-[100px]">
              <p className="text-sm font-medium text-gray-500 mb-2">Preview:</p>
              <div className="prose prose-sm max-w-none">
                <MathRenderer text={formData.teks_soal} block />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ImageUpload
        value={formData.gambar_url}
        onChange={(url) => setFormData(prev => ({ ...prev, gambar_url: url }))}
      />

      <div className="space-y-4">
        <Label className="text-base">Pilihan Jawaban</Label>
        <div className="space-y-4">
          {options.map(({ key, label, order, optional }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold ${
                  key === 'jawaban_benar' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {order}
                </span>
                <Label className={`text-sm font-medium ${optional ? 'text-gray-500' : ''}`}>
                  {label} {optional && '(Opsional)'}
                </Label>
              </div>
              <div>
                <Textarea
                  value={formData[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={`Masukkan ${label.toLowerCase()}`}
                  className="min-h-[60px] font-mono text-sm"
                  rows={2}
                />
                {formData[key] && (
                  <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                    <MathRenderer text={formData[key]} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-2" />
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Menyimpan...' : (soal ? 'Update' : 'Simpan')}
        </Button>
      </div>
    </form>
  )
}
