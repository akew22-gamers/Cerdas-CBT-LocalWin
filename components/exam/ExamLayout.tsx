'use client'

import { useEffect, useState, ReactNode, useCallback } from 'react'
import Image from 'next/image'

interface ExamLayoutProps {
  children: ReactNode
  timer: ReactNode
  progress: string
  onSubmit: () => void
  onFullscreenExit: () => void
  siswaInfo?: {
    nama: string
    nisn: string
  }
}

export function ExamLayout({
  children,
  timer,
  progress,
  onSubmit,
  onFullscreenExit,
  siswaInfo
}: ExamLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [examStarted, setExamStarted] = useState(false)
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)

  const startExam = useCallback(async () => {
    try {
      const elem = document.documentElement
      if (!document.fullscreenElement) {
        await elem.requestFullscreen()
        setIsFullscreen(true)
      }
      setExamStarted(true)
      
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen')
        setWakeLock(lock)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
      setExamStarted(true)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const wasFullscreen = isFullscreen
      const nowFullscreen = !!document.fullscreenElement
      setIsFullscreen(nowFullscreen)
      
      if (wasFullscreen && !nowFullscreen && examStarted) {
        onFullscreenExit()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isFullscreen, onFullscreenExit, examStarted])

  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error)
      }
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }, [wakeLock])

  useEffect(() => {
    if (!examStarted) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault()
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [examStarted])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted) {
        console.log('Tab switch detected')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [examStarted])

  useEffect(() => {
    if (!examStarted) return
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [examStarted])

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Siap Memulai Ujian?</h1>
          
          {siswaInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Peserta:</p>
              <p className="font-semibold text-gray-900">{siswaInfo.nama}</p>
              <p className="text-sm text-gray-500">NISN: {siswaInfo.nisn}</p>
            </div>
          )}
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-amber-800 mb-2">Petunjuk Ujian:</h3>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Ujian akan berlangsung dalam mode fullscreen</li>
              <li>Jangan keluar dari mode fullscreen selama ujian</li>
              <li>Layar akan tetap aktif selama ujian berlangsung</li>
              <li>Klik "Kirim Jawaban" jika sudah selesai</li>
            </ul>
          </div>
          
          <button
            onClick={startExam}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                <Image
                  src="/images/logo_kemendikdasmen.svg"
                  alt="Logo Kemendikdasmen"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">Ujian Berbasis Komputer</h1>
                {siswaInfo ? (
                  <>
                    <p className="text-xs text-gray-500 truncate">{siswaInfo.nama}</p>
                    <p className="text-xs text-gray-400 truncate">{siswaInfo.nisn}</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Cerdas-CBT</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-0.5 hidden sm:block">Waktu Tersisa</p>
                {timer}
              </div>
              <div className="text-center hidden md:block">
                <p className="text-xs text-gray-500 mb-0.5">Progress</p>
                <p className="text-sm font-semibold text-gray-900">{progress}</p>
              </div>
              <button
                onClick={onSubmit}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Kirim Jawaban
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}