"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface UjianStatusToggleProps {
  ujianId: string
  currentStatus: 'aktif' | 'nonaktif'
}

export function UjianStatusToggle({ ujianId, currentStatus }: UjianStatusToggleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isChecked, setIsChecked] = useState(currentStatus === 'aktif')

  const handleToggle = async (checked: boolean) => {
    setIsChecked(checked)
    
    startTransition(async () => {
      try {
        await fetch(`/api/guru/ujian/${ujianId}/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: checked ? 'aktif' : 'nonaktif' })
        })
        router.refresh()
      } catch (error) {
        console.error('Error toggling status:', error)
        setIsChecked(!checked)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`status-toggle-${ujianId}`}
        checked={isChecked}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <Label 
        htmlFor={`status-toggle-${ujianId}`}
        className="text-sm font-medium text-slate-600 cursor-pointer"
      >
        {isChecked ? 'Aktif' : 'Nonaktif'}
      </Label>
    </div>
  )
}
