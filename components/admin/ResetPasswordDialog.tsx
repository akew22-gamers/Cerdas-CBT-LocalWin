"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ResetPasswordDialogProps {
  guruId: string
  guruNama: string
  onPasswordReset: () => void
}

export function ResetPasswordDialog({ guruId, guruNama, onPasswordReset }: ResetPasswordDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [password, setPassword] = React.useState("")

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/guru/${guruId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password: password }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || "Gagal mereset password")
      }

      toast.success("Password berhasil direset")
      setIsOpen(false)
      setPassword("")
      onPasswordReset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal mereset password"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" title="Reset Password">
            <KeyRound className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleReset}>
          <DialogHeader>
            <DialogTitle>Reset Password Guru</DialogTitle>
            <DialogDescription>
              Reset password untuk guru {guruNama}. Pastikan password baru aman.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="new_password">Password Baru</Label>
            <Input
              id="new_password"
              type="password"
              placeholder="Masukkan password baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Mereset..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
