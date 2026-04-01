"use client"

import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface GuruSearchFormProps {
  defaultValue?: string
}

export function GuruSearchForm({ defaultValue = "" }: GuruSearchFormProps) {
  const router = useRouter()

  const handleSearch = (value: string) => {
    const params = new URLSearchParams()
    if (value) {
      params.set("search", value)
    }
    const queryString = params.toString()
    router.push(`/admin/guru${queryString ? `?${queryString}` : ""}`)
  }

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Cari username atau nama..."
        defaultValue={defaultValue}
        className="pl-9"
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  )
}