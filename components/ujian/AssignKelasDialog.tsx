"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, Check } from "lucide-react"
import { toast } from "sonner"

interface Kelas {
  id: string
  nama_kelas: string
  created_at: string
}

interface AssignedKelas {
  id: string
  nama_kelas: string
}

interface AssignKelasDialogProps {
  ujianId: string
  trigger?: React.ReactNode
  initialKelas?: AssignedKelas[]
  onAssignSuccess?: () => void
}

export function AssignKelasDialog({
  ujianId,
  trigger,
  initialKelas = [],
  onAssignSuccess,
}: AssignKelasDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [selectedKelasIds, setSelectedKelasIds] = useState<Set<string>>(
    new Set(initialKelas.map((k) => k.id))
  )

  useEffect(() => {
    if (open) {
      fetchKelas()
    }
  }, [open])

  const fetchKelas = async () => {
    setIsFetching(true)
    try {
      const response = await fetch("/api/guru/kelas", {
        credentials: 'include'
      })
      const result = await response.json()

      if (result.success) {
        setKelas(result.data.kelas)
      } else {
        toast.error("Gagal mengambil data kelas")
      }
    } catch (error) {
      console.error("Fetch kelas error:", error)
      toast.error("Terjadi kesalahan saat mengambil data kelas")
    } finally {
      setIsFetching(false)
    }
  }

  const toggleKelas = (kelasId: string) => {
    const newSelected = new Set(selectedKelasIds)
    if (newSelected.has(kelasId)) {
      newSelected.delete(kelasId)
    } else {
      newSelected.add(kelasId)
    }
    setSelectedKelasIds(newSelected)
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/guru/ujian/${ujianId}/kelas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kelas_ids: Array.from(selectedKelasIds),
        }),
        credentials: 'include'
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error?.message || "Gagal menugaskan kelas")
        return
      }

      toast.success("Kelas berhasil ditugaskan")
      setOpen(false)
      onAssignSuccess?.()
    } catch (error) {
      console.error("Assign kelas error:", error)
      toast.error("Terjadi kesalahan saat menugaskan kelas")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
      {!trigger && (
        <DialogTrigger>
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            Assign Kelas
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Kelas ke Ujian</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-500">Memuat data kelas...</p>
            </div>
          ) : kelas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-500">Belum ada kelas</p>
              <p className="text-xs text-gray-400 mt-1">
                Buat kelas terlebih dahulu di halaman Manajemen Kelas
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {kelas.map((k) => {
                const isSelected = selectedKelasIds.has(k.id)
                return (
                  <button
                    key={k.id}
                    onClick={() => toggleKelas(k.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-medium">{k.nama_kelas}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || selectedKelasIds.size === 0}
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
