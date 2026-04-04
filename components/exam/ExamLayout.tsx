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
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)

  const enterFullscreen = useCallback(async () => {
    if (!document.fullscreenElement && document.fullscreenEnabled) {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } catch (err) {
        console.error('Re-enter fullscreen error:', err)
      }
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const wasFullscreen = isFullscreen
      const nowFullscreen = !!document.fullscreenElement
      setIsFullscreen(nowFullscreen)
      
      if (wasFullscreen && !nowFullscreen) {
        onFullscreenExit()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isFullscreen, onFullscreenExit])

  useEffect(() => {
    let wakeLockInstance: WakeLockSentinel | null = null
    
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => {
        wakeLockInstance = lock
        setWakeLock(lock)
      }).catch(console.error)
    }
    
    return () => {
      if (wakeLockInstance) {
        wakeLockInstance.release().catch(console.error)
      }
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    }
  }, [])

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
  }, [])

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
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 drop-shadow-sm">
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
                    <p className="text-xs text-slate-500 truncate">{siswaInfo.nama}</p>
                    <p className="text-[11px] text-slate-400 truncate">NISN: {siswaInfo.nisn || '-'}</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Cerdas-CBT</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 font-medium uppercase tracking-wider hidden sm:block">Sisa Waktu</p>
                {timer}
              </div>
              <div className="text-center hidden md:block">
                <p className="text-[10px] sm:text-xs text-slate-500 mb-0.5 font-medium uppercase tracking-wider">Progress</p>
                <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  {progress}
                </div>
              </div>
              <button
                onClick={onSubmit}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[11px] sm:text-sm font-semibold rounded-lg sm:rounded-xl shadow-sm shadow-emerald-500/25 transition-all whitespace-nowrap active:scale-[0.98]"
              >
                Selesai
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
