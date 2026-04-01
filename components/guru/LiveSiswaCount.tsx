'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

interface SessionCount {
  ujian_id: string
  count: number
}

export interface LiveSiswaCountProps {
  ujianIds: string[]
  onUpdate?: (counts: SessionCount[]) => void
}

export function LiveSiswaCount({ ujianIds, onUpdate }: LiveSiswaCountProps) {
  const [counts, setCounts] = useState<SessionCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCounts = async () => {
    try {
      const response = await fetch('/api/guru/dashboard/realtime', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setCounts(result.data.sessionCounts || [])
        onUpdate?.(result.data.sessionCounts || [])
      }
    } catch (error) {
      console.error('Error fetching session counts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (ujianIds.length > 0) {
      fetchCounts()
      
      const interval = setInterval(() => {
        fetchCounts()
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [ujianIds])

  const totalCount = counts.reduce((sum, c) => sum + c.count, 0)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
      <div className="relative">
        <Users className="w-4 h-4 text-green-600" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-green-700 font-medium">
          {totalCount} siswa sedang{totalCount !== 1 ? '' : ''} mengerjakan
        </p>
        {counts.length > 0 && (
          <div className="flex gap-2 mt-1">
            {counts.filter(c => c.count > 0).map((count) => (
              <span
                key={count.ujian_id}
                className="text-[10px] text-green-600 bg-white px-2 py-0.5 rounded-full border border-green-200"
              >
                Ujian {count.count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
