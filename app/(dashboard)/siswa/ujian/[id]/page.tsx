'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { ExamLayout } from '@/components/exam/ExamLayout'
import { PreExamModal } from '@/components/exam/PreExamModal'
import { QuestionDisplay } from '@/components/exam/QuestionDisplay'
import { QuestionNavigator } from '@/components/exam/QuestionNavigator'
import { Timer } from '@/components/exam/Timer'

interface Soal {
  id: string
  questionNumber: number
  teks_soal: string
  gambar_url?: string | null
  options: { label: string; text: string }[]
  jawaban_siswa: string | null
}

interface StatusData {
  is_submitted: boolean
  is_finished: boolean
  time_remaining_ms: number
  time_remaining_seconds: number
  answered_count: number
  total_questions: number
  tab_switch_count: number
  fullscreen_exit_count: number
}

interface SiswaInfo {
  nama: string
  nisn: string
}

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  
  const [showPreExamModal, setShowPreExamModal] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [durasi, setDurasi] = useState<number>(60)
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [status, setStatus] = useState<StatusData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [siswaInfo, setSiswaInfo] = useState<SiswaInfo | null>(null)

  
  useEffect(() => {
    const fetchSiswaInfo = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (data.success && data.data?.user) {
          setSiswaInfo({
            nama: data.data.user.nama || 'Siswa',
            nisn: data.data.user.nisn || '-'
          })
        }
      } catch (err) {
        console.error('Error fetching siswa info:', err)
      }
    }
    fetchSiswaInfo()
  }, [])

  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/siswa/ujian/${resolvedParams.id}/status`)
        const data = await res.json()
        if (data.success) {
          if (data.data.is_finished || data.data.is_submitted) {
            router.push(`/siswa/ujian/${resolvedParams.id}/hasil`)
          }
          setStatus(data.data)
        }
      } catch (err) {
        console.error('Error checking status:', err)
      }
    }
    checkStatus()
  }, [resolvedParams.id, router])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/siswa/ujian/${resolvedParams.id}/status`)
      const data = await res.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (err) {
      console.error('Error fetching status:', err)
    }
  }, [resolvedParams.id])

  const loadExam = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      
      const startRes = await fetch(`/api/siswa/ujian/${resolvedParams.id}/start`, { method: 'POST' })
      const startData = await startRes.json()
      
      if (!startData.success) {
        setError(startData.error?.message || 'Gagal memulai ujian')
        setIsLoading(false)
        return
      }
      
      setDurasi(startData.data.durasi || 60)
      
      
      const soalRes = await fetch(`/api/siswa/ujian/${resolvedParams.id}/soal`)
      const soalData = await soalRes.json()
      
      if (soalData.success) {
        setSoalList(soalData.data.soal)
        setShowPreExamModal(false)
        fetchStatus()
      } else {
        setError(soalData.error?.message || 'Gagal memuat soal')
      }
    } catch (err) {
      console.error('Error loading exam:', err)
      setError('Gagal memuat ujian')
    } finally {
      setIsLoading(false)
    }
  }, [resolvedParams.id])

  
  useEffect(() => {
    if (showPreExamModal) return
    
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [showPreExamModal, fetchStatus])

  useEffect(() => {
    if (status && durasi > 0) {
      const warningThreshold = durasi * 60 * 0.1
      setShowWarning(status.time_remaining_seconds <= warningThreshold)
    }
  }, [status, durasi])

  const handleAnswerChange = async (jawaban: string) => {
    const currentSoal = soalList.find((s) => s.questionNumber === currentQuestion)
    if (!currentSoal) return

    setSoalList((prev) =>
      prev.map((s) =>
        s.questionNumber === currentQuestion ? { ...s, jawaban_siswa: jawaban } : s
      )
    )

    try {
      await fetch(`/api/siswa/ujian/${resolvedParams.id}/jawaban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soal_id: currentSoal.id,
          jawaban_pilihan: jawaban,
          urutan_soal: currentQuestion - 1
        })
      })
    } catch (err) {
      console.error('Error saving answer:', err)
      setSoalList((prev) =>
        prev.map((s) =>
          s.questionNumber === currentQuestion ? { ...s, jawaban_siswa: currentSoal.jawaban_siswa } : s
        )
      )
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/siswa/ujian/${resolvedParams.id}/submit`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
        router.push(`/siswa/ujian/${resolvedParams.id}/hasil`)
      } else {
        setError(data.error?.message || 'Gagal mengumpulkan jawaban')
        setShowConfirmSubmit(false)
      }
    } catch (err) {
      console.error('Error submitting exam:', err)
      setError('Gagal mengumpulkan jawaban')
      setShowConfirmSubmit(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFullscreenExit = async () => {
    try {
      await fetch(`/api/siswa/ujian/${resolvedParams.id}/cheating-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'fullscreen_exit',
          details: { timestamp: new Date().toISOString() }
        })
      })
      await fetchStatus()
    } catch (err) {
      console.error('Error logging fullscreen exit:', err)
    }
  }

  const handleTabSwitch = async () => {
    try {
      await fetch(`/api/siswa/ujian/${resolvedParams.id}/cheating-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'tab_switch',
          details: { timestamp: new Date().toISOString() }
        })
      })
    } catch (err) {
      console.error('Error logging tab switch:', err)
    }
  }

  const currentSoal = soalList.find((s) => s.questionNumber === currentQuestion)
  const answeredQuestions = soalList.filter((s) => s.jawaban_siswa).map((s) => s.questionNumber)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showPreExamModal) {
        handleTabSwitch()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [showPreExamModal])

  
  if (showPreExamModal) {
    return (
      <PreExamModal 
        siswaInfo={siswaInfo || undefined}
        onStartExam={loadExam}
      />
    )
  }

  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat soal ujian...</p>
        </div>
      </div>
    )
  }

  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/siswa/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  
  return (
    <ExamLayout
      timer={
        <Timer
          timeRemainingMs={status?.time_remaining_ms || 0}
          durasi={durasi}
          onTimeUp={handleSubmit}
        />
      }
      progress={`${answeredQuestions.length}/${soalList.length}`}
      onSubmit={() => setShowConfirmSubmit(true)}
      onFullscreenExit={handleFullscreenExit}
      siswaInfo={siswaInfo || undefined}
    >
      {showWarning && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">
            ⚠️ Waktu tersisa kurang dari 10%! Segerakan menyelesaikan ujian.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {currentSoal && (
            <QuestionDisplay
              questionNumber={currentSoal.questionNumber}
              teksSoal={currentSoal.teks_soal}
              gambarUrl={currentSoal.gambar_url}
              options={currentSoal.options}
              selectedAnswer={currentSoal.jawaban_siswa}
              onAnswerChange={handleAnswerChange}
            />
          )}

          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={() => setCurrentQuestion((q) => Math.max(1, q - 1))}
              disabled={currentQuestion === 1}
              className="flex-1 px-4 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setCurrentQuestion((q) => Math.min(soalList.length, q + 1))}
              disabled={currentQuestion === soalList.length}
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Selanjutnya</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <QuestionNavigator
            totalQuestions={soalList.length}
            answeredQuestions={answeredQuestions}
            currentQuestion={currentQuestion}
            onQuestionSelect={setCurrentQuestion}
          />
        </div>
      </div>

      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kirim Jawaban?</h2>
            <p className="text-gray-600 mb-6">
              Pastikan semua jawaban sudah terisi. Anda tidak dapat mengubah jawaban setelah pengiriman.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengirim...
                  </span>
                ) : 'Ya, Kirim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ExamLayout>
  )
}