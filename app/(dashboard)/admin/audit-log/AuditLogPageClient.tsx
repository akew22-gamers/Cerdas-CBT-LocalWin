'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuditLog } from '@/types/database'
import { DashboardLayout } from '@/components/layout'
import { AuditLogTable } from '@/components/admin/AuditLogTable'
import { AuditLogFilters } from '@/components/admin/AuditLogFilters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AuditLogPageClientProps {
  userName: string
}

export default function AuditLogPageClient({ userName }: AuditLogPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useState(false)

  const [filters, setFilters] = useState({
    role: searchParams.get('role') || '',
    action: searchParams.get('action') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
  })

  const page = parseInt(searchParams.get('page') || '1')

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const fetchLogs = async (newPage: number, newFilters: typeof filters) => {
    setLoading(true)
    const queryParams = new URLSearchParams()
    queryParams.set('page', newPage.toString())
    queryParams.set('limit', '20')
    if (newFilters.role) queryParams.set('role', newFilters.role)
    if (newFilters.action) queryParams.set('action', newFilters.action)
    if (newFilters.date_from) queryParams.set('date_from', newFilters.date_from)
    if (newFilters.date_to) queryParams.set('date_to', newFilters.date_to)

    try {
      const response = await fetch(`/api/admin/audit-log?${queryParams.toString()}`)
      const result = await response.json()
      if (result.success) {
        setLogs(result.data?.logs || [])
        setPagination(result.data?.pagination || { page: 1, total_pages: 1, total: 0 })
      }
    } catch {
      console.error('Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(page, filters)
  }, [])

  const handleApplyFilters = () => {
    startTransition(true)
    const params = new URLSearchParams()
    params.set('page', '1')
    if (filters.role) params.set('role', filters.role)
    if (filters.action) params.set('action', filters.action)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    router.push(`/admin/audit-log?${params.toString()}`)
    fetchLogs(1, filters)
    setTimeout(() => startTransition(false), 500)
  }

  const handleClearFilters = () => {
    startTransition(true)
    router.push('/admin/audit-log')
    setFilters({ role: '', action: '', date_from: '', date_to: '' })
    fetchLogs(1, { role: '', action: '', date_from: '', date_to: '' })
    setTimeout(() => startTransition(false), 500)
  }

  const handlePageChange = (newPage: number) => {
    startTransition(true)
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/admin/audit-log?${params.toString()}`)
    fetchLogs(newPage, filters)
    setTimeout(() => startTransition(false), 500)
  }

  return (
    <DashboardLayout
      user={{
        nama: userName,
        role: 'super_admin',
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-indigo-900">Audit Log</h1>
          <p className="text-gray-600">Monitor aktivitas sistem dan pengguna</p>
        </div>

        <AuditLogFilters
          filters={filters}
          onFilterChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Riwayat Audit</CardTitle>
                <CardDescription>
                  Menampilkan {logs.length} dari {pagination.total} total log
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AuditLogTable logs={logs} loading={loading} />

            {pagination.total_pages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.total_pages || loading}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
