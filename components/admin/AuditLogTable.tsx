'use client'

import { useState } from 'react'
import { AuditLog } from '@/types/database'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface AuditLogTableProps {
  logs: AuditLog[]
  loading?: boolean
}

const ROLE_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  super_admin: 'destructive',
  guru: 'default',
  siswa: 'secondary',
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  create_guru: 'Buat Guru',
  update_guru: 'Update Guru',
  delete_guru: 'Hapus Guru',
  create_siswa: 'Buat Siswa',
  update_siswa: 'Update Siswa',
  delete_siswa: 'Hapus Siswa',
  import_siswa: 'Import Siswa',
  create_ujian: 'Buat Ujian',
  update_ujian: 'Update Ujian',
  delete_ujian: 'Hapus Ujian',
  toggle_ujian: 'Toggle Ujian',
  duplicate_ujian: 'Duplikat Ujian',
  create_soal: 'Buat Soal',
  update_soal: 'Update Soal',
  delete_soal: 'Hapus Soal',
  submit_ujian: 'Submit Ujian',
  setup_completed: 'Setup Selesai',
  change_password: 'Ganti Password',
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function formatEntityDetails(log: AuditLog) {
  const parts: string[] = []

  if (log.entity_type) {
    parts.push(log.entity_type)
  }

  if (log.entity_id) {
    parts.push(log.entity_id.slice(0, 8))
  }

  return parts.join(' • ') || '-'
}

export function AuditLogTable({ logs, loading }: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Memuat data...</div>
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Tidak ada data audit log</div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Aksi</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead className="text-right">Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <>
              <TableRow
                key={log.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  expandedId === log.id && 'bg-muted/50'
                )}
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <TableCell className="w-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }}
                  >
                    {expandedId === log.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {formatTimestamp(log.created_at)}
                </TableCell>
                <TableCell className="max-w-[150px] truncate font-mono text-xs">
                  {log.user_id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_COLORS[log.role] || 'outline'}>
                    {log.role}
                  </Badge>
                </TableCell>
                <TableCell>{ACTION_LABELS[log.action] || log.action}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">
                  {formatEntityDetails(log)}
                </TableCell>
                <TableCell className="text-right">
                  {log.details && (
                    <Badge variant="outline" className="text-xs">
                      JSON
                    </Badge>
                  )}
                </TableCell>
              </TableRow>

              {expandedId === log.id && log.details && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-muted/30 p-4">
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Detail Log:
                      </div>
                      <pre className="max-h-64 overflow-auto rounded-md bg-black/5 p-3 text-xs dark:bg-white/10">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
