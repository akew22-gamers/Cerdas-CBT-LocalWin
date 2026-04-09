'use client'

import { useEffect, useRef } from 'react'

export interface PollingOptions<T extends Record<string, unknown>> {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema?: string
  filter?: {
    column: string
    value: string
  }
  fetchEndpoint?: string
  pollingInterval?: number
  compareFn?: (prev: T | null, current: T) => boolean
}

export function useRealtimeSubscription<T extends Record<string, unknown>>(
  table: string,
  callback: (data: T) => void,
  options?: PollingOptions<T>
): void {
  const lastDataRef = useRef<T | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchEndpoint = options?.fetchEndpoint || `/api/${table}`
    const pollingInterval = options?.pollingInterval || 5000

    const fetchData = async () => {
      try {
        const url = new URL(fetchEndpoint, window.location.origin)
        
        if (options?.filter) {
          url.searchParams.set(options.filter.column, options.filter.value)
        }

        const res = await fetch(url.toString())
        if (!res.ok) {
          console.error(`Polling failed for ${table}: ${res.status}`)
          return
        }

        const result = await res.json()
        
        let data: T | null = null
        
        if (result.success && result.data) {
          data = result.data as T
        } else if (Array.isArray(result) && result.length > 0) {
          data = result[0] as T
        } else if (result.data) {
          data = result.data as T
        } else {
          data = result as T
        }

        if (data) {
          const hasChanged = !lastDataRef.current || 
            !options?.compareFn || 
            options.compareFn(lastDataRef.current, data)

          if (hasChanged) {
            lastDataRef.current = data
            callback(data)
          }
        }
      } catch (error) {
        console.error(`Polling error for ${table}:`, error)
      }
    }

    fetchData()

    intervalRef.current = setInterval(fetchData, pollingInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [table, callback, options?.event, options?.schema, options?.filter, options?.fetchEndpoint, options?.pollingInterval, options?.compareFn])
}
