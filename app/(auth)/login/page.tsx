import { Card, CardContent } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/LoginForm"
import { AdminLoginTrigger } from "@/components/auth/AdminLoginTrigger"
import { redirect } from "next/navigation"

async function getSetupStatus() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/setup/status`, { cache: 'no-store' })
    const { data } = await res.json()
    
    if (!data || !data.setup_wizard_completed) {
      return { isSetupComplete: false, nama_sekolah: 'Cerdas-CBT' }
    }

    const sekolahRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/public/sekolah`, { cache: 'no-store' })
    const { data: sekolahData } = await sekolahRes.json()

    return {
      isSetupComplete: true,
      nama_sekolah: sekolahData?.sekolah?.nama_sekolah || 'Cerdas-CBT',
      logo_url: sekolahData?.sekolah?.logo_url
    }
  } catch {
    return { isSetupComplete: false, nama_sekolah: 'Cerdas-CBT' }
  }
}

export default async function LoginPage() {
  const setupStatus = await getSetupStatus()

  if (!setupStatus.isSetupComplete) {
    redirect('/setup')
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="fixed inset-0 opacity-[0.015] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="fixed top-20 right-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-20 left-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-slate-100">
                <img
                  src="/images/logo_kemendikdasmen.svg"
                  alt="Logo Kemendikdasmen"
                  className="h-16 w-auto"
                />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              Cerdas-CBT
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {setupStatus.nama_sekolah}
            </p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <LoginForm schoolName={setupStatus.nama_sekolah} />
            </CardContent>
          </Card>

          <footer className="text-center mt-8">
            <p className="text-xs text-slate-400">
              © 2026 Cerdas-CBT by EAS Creative Studio
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Platform Ujian Berbasis Komputer
            </p>
          </footer>
        </div>
      </div>

      <AdminLoginTrigger />
    </>
  )
}
