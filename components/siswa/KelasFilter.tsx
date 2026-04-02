"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Kelas {
  id: string
  nama_kelas: string
}

interface KelasFilterProps {
  kelasList: Kelas[]
  selectedKelasId: string | null
  selectedKelasName: string | null
}

export function KelasFilter({ kelasList, selectedKelasId, selectedKelasName }: KelasFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleValueChange = (value: string | null) => {
    const val = value || ""
    if (val === "") {
      router.push(pathname)
    } else {
      router.push(`${pathname}?kelas_id=${val}`)
    }
  }

  return (
    <Select value={selectedKelasId || ""} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[220px] bg-slate-50 border-slate-200">
        <SelectValue placeholder="Pilih kelas">
          {selectedKelasName || "Semua Kelas"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Semua Kelas</SelectItem>
        {kelasList.map((kelas) => (
          <SelectItem key={kelas.id} value={kelas.id}>
            {kelas.nama_kelas}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}