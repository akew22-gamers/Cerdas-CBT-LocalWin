'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface HasilUjianData {
  id: string
  siswa_id: string
  ujian_id: string
  nilai?: number
  is_submitted: boolean
  waktu_selesai?: string
  created_at: string
}

export function useHasilUjianRealtime({
  ujianIds,
  onNewResultAction,
  pollingInterval = 5000
}: {
  ujianIds: string[]
  onNewResultAction?: (hasil: HasilUjianData) => void
  pollingInterval?: number
}): {
  newResults: HasilUjianData[]
  subscribe: () => void
  unsubscribe: () => void
  isSubscribed: boolean
} {
  const [newResults, setNewResults] = useState<HasilUjianData[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const seenResultsRef = useRef<Set<string>>(new Set())

  const fetchResults = useCallback(async () => {
    if (ujianIds.length === 0) return

    try {
      const res = await fetch('/api/guru/hasil')
      if (!res.ok) {
        console.error('Failed to fetch hasil ujian')
        return
      }

      const result = await res.json()
      
      if (!result.success) return

      const results: HasilUjianData[] = result.data?.hasils || result.data || []
      
      const filteredResults = results.filter(
        (r: HasilUjianData) => ujianIds.includes(r.ujian_id)
      )

      filteredResults.forEach((hasil: HasilUjianData) => {
        if (!seenResultsRef.current.has(hasil.id)) {
          seenResultsRef.current.add(hasil.id)
          setNewResults((prev) => [...prev, hasil])
          onNewResultAction?.(hasil)
        }
      })
    } catch (error) {
      console.error('Error polling hasil ujian:', error)
    }
  }, [ujianIds, onNewResultAction])

  const subscribe = useCallback(() => {
    if (isSubscribed || ujianIds.length === 0) return

    fetchResults()
    
    intervalRef.current = setInterval(fetchResults, pollingInterval)
    setIsSubscribed(true)
  }, [isSubscribed, ujianIds, fetchResults, pollingInterval])

  const unsubscribe = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsSubscribed(false)
  }, [])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  useEffect(() => {
    if (!isSubscribed && ujianIds.length > 0) {
      subscribe()
    }
    
    if (isSubscribed && ujianIds.length === 0) {
      unsubscribe()
    }
  }, [ujianIds, isSubscribed, subscribe, unsubscribe])

  return {
    newResults,
    subscribe,
    unsubscribe,
    isSubscribed
  }
}
