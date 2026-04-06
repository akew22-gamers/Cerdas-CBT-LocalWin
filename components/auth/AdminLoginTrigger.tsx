'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { AdminLoginModal } from './AdminLoginModal'

export function AdminLoginTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 p-2 text-slate-300 hover:text-violet-600 transition-all duration-300 hover:scale-110 opacity-30 hover:opacity-100 z-50"
        title="Admin Login"
        aria-label="Admin Login"
      >
        <Shield className="w-5 h-5" />
      </button>

      <AdminLoginModal open={open} onOpenChange={setOpen} />
    </>
  )
}
