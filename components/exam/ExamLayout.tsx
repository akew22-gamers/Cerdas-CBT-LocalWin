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
  const [examEnded, setExamEnded] = useState(false)
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement
      if (!document.fullscreenElement) {
        await elem.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Exit fullscreen error:', err)
    }
  }, [])

  useEffect(() => {
    enterFullscreen()
  }, [enterFullscreen])

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen')
          setWakeLock(lock)
        }
      } catch (err) {
        console.log('Wake Lock error:', err)
      }
    }

    requestWakeLock()

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error)
      }
    }
  }, [])

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
    const handleFullscreenChange = () => {
      const wasFullscreen = isFullscreen
      const nowFullscreen = !!document.fullscreenElement
      setIsFullscreen(nowFullscreen)
      
      if (wasFullscreen && !nowFullscreen && !examEnded) {
        onFullscreenExit()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isFullscreen, onFullscreenExit, examEnded])

  useEffect(() => {
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
      if (e.key === 'Escape' && isFullscreen && !examEnded) {
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
  }, [isFullscreen, examEnded])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab switch detected')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

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
