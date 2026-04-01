"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Ujian {
  id: string
  judul: string
  kode_ujian: string
  status: 'aktif' | 'nonaktif'
}

interface UjianFilterProps {
  ujianList: Ujian[]
  selectedUjianId: string | null
}

export function UjianFilter({ ujianList, selectedUjianId }: UjianFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleUjianChange = (ujianId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (ujianId) {
      params.set("ujian_id", ujianId)
    } else {
      params.delete("ujian_id")
    }
    
    router.push(`/guru/soal?${params.toString()}`)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Filter Ujian</label>
      <Select
        value={selectedUjianId ?? ""}
        onValueChange={handleUjianChange}
      >
        <SelectTrigger className="w-full sm:w-[400px]">
          <SelectValue placeholder="Pilih ujian..." />
        </SelectTrigger>
        <SelectContent>
          {ujianList.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.judul} ({u.kode_ujian}) - {u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}