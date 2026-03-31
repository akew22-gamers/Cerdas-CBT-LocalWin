'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const ROLES = [
  { value: '', label: 'Semua Role' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'guru', label: 'Guru' },
  { value: 'siswa', label: 'Siswa' },
]

const ACTIONS = [
  { value: '', label: 'Semua Aksi' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create_guru', label: 'Buat Guru' },
  { value: 'update_guru', label: 'Update Guru' },
  { value: 'delete_guru', label: 'Hapus Guru' },
  { value: 'create_siswa', label: 'Buat Siswa' },
  { value: 'update_siswa', label: 'Update Siswa' },
  { value: 'delete_siswa', label: 'Hapus Siswa' },
  { value: 'import_siswa', label: 'Import Siswa' },
  { value: 'create_ujian', label: 'Buat Ujian' },
  { value: 'update_ujian', label: 'Update Ujian' },
  { value: 'delete_ujian', label: 'Hapus Ujian' },
  { value: 'toggle_ujian', label: 'Toggle Ujian' },
  { value: 'duplicate_ujian', label: 'Duplikat Ujian' },
  { value: 'create_soal', label: 'Buat Soal' },
  { value: 'update_soal', label: 'Update Soal' },
  { value: 'delete_soal', label: 'Hapus Soal' },
  { value: 'submit_ujian', label: 'Submit Ujian' },
  { value: 'setup_completed', label: 'Setup Selesai' },
  { value: 'change_password', label: 'Ganti Password' },
]

export interface AuditLogFiltersProps {
  filters: {
    role: string
    action: string
    date_from: string
    date_to: string
  }
  onFilterChange: (filters: AuditLogFiltersProps['filters']) => void
  onApply: () => void
  onClear: () => void
}

export function AuditLogFilters({ filters, onFilterChange, onApply, onClear }: AuditLogFiltersProps) {
  const handleClear = () => {
    onFilterChange({
      role: '',
      action: '',
      date_from: '',
      date_to: ''
    })
    onClear()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="role-filter">Role</Label>
            <Select
              value={filters.role || ''}
              onValueChange={(value) => onFilterChange({ ...filters, role: value || '' })}
            >
              <SelectTrigger id="role-filter" className="w-full">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-filter">Aksi</Label>
            <Select
              value={filters.action || ''}
              onValueChange={(value) => onFilterChange({ ...filters, action: value || '' })}
            >
              <SelectTrigger id="action-filter" className="w-full">
                <SelectValue placeholder="Pilih aksi" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-from">Dari Tanggal</Label>
            <Input
              id="date-from"
              type="date"
              value={filters.date_from}
              onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-to">Sampai Tanggal</Label>
            <Input
              id="date-to"
              type="date"
              value={filters.date_to}
              onChange={(e) => onFilterChange({ ...filters, date_to: e.target.value })}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={onApply} className="flex-1">
              Terapkan
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
