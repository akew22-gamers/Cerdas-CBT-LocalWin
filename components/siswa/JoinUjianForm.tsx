"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface JoinUjianFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function JoinUjianForm({ open = true, onOpenChange }: JoinUjianFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [kodeUjian, setKodeUjian] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!kodeUjian.trim()) {
      toast.error("Kode ujian harus diisi")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/siswa/ujian/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kode_ujian: kodeUjian.trim().toUpperCase(),
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          const errorMessage = result.error?.message || "Gagal bergabung ke ujian"
          toast.error(errorMessage)
          return
        }

        toast.success("Berhasil bergabung ke ujian")
        router.push(result.data.redirect_url)
        
      } catch (error) {
        console.error("Join ujian error:", error)
        toast.error("Terjadi kesalahan. Silakan coba lagi.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Masuk Ujian</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="kode_ujian" className="text-sm font-medium text-foreground">
              Kode Ujian
            </label>
            <Input
              id="kode_ujian"
              type="text"
              placeholder="Contoh: ABC123"
              value={kodeUjian}
              onChange={(e) => setKodeUjian(e.target.value.toUpperCase())}
              disabled={isPending}
              className="uppercase tracking-wider text-center text-lg"
              maxLength={10}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground text-center">
              Masukkan kode ujian yang diberikan oleh guru
            </p>
          </div>

          <DialogFooter showCloseButton>
            <Button 
              type="submit" 
              disabled={isPending || !kodeUjian.trim()}
              className="w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk Ujian"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
